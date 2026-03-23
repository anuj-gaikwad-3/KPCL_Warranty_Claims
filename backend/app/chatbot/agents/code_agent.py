import logging
import os
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from langsmith import traceable
from langsmith.run_helpers import get_current_run_tree
from app.chatbot.config import settings
from app.chatbot.agents.prompts import SYSTEM_PLANNER_PROMPT
from app.chatbot.services.data_parser import execute_agent_code, find_relevant_context
from app.chatbot.models.response import ChatResponse

logger = logging.getLogger(__name__)

# Cost-related keywords — if ANY appear, the full cost table is included in the prompt
COST_KEYWORDS = {
    "cost", "price", "value", "rupee", "rupees", "₹", "how much",
    "expense", "amount", "pricing", "rate", "charge", "bill", "worth",
}

def _is_cost_query(message: str) -> bool:
    """Return True if the user message requires cost data."""
    lowered = message.lower()
    return any(kw in lowered for kw in COST_KEYWORDS)


# ── Initialize Google Generative AI directly (no LangChain wrapper) ──
_model = None

def _get_model():
    global _model
    if _model is None:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set -- chatbot will fail on /chat requests")
            return None
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel(
            model_name=settings.MODEL_NAME,
            generation_config=genai.GenerationConfig(temperature=0),
        )
        logger.info(f"Gemini model initialized: {settings.MODEL_NAME}")
    return _model


# ── LangSmith Trace: individual LLM call ──
@traceable(name="Gemini LLM Call", run_type="llm")
def _call_gemini(prompt: str, model_name: str):
    """
    Calls Gemini and returns (text, usage_metadata).
    Usage is also logged to this specific span.
    """
    model = _get_model()
    response = model.generate_content(prompt)
    
    # Extract usage metadata
    usage = getattr(response, 'usage_metadata', None) or getattr(response, 'usage', None)
    
    # Fallback to dictionary lookup if attribute access fails
    if not usage and hasattr(response, 'to_dict'):
        usage_dict = response.to_dict().get('usage_metadata') or response.to_dict().get('usage')
        if usage_dict:
            from types import SimpleNamespace
            usage = SimpleNamespace(**usage_dict)

    if usage:
        try:
            run = get_current_run_tree()
            if run:
                run.set_usage_metadata(
                    prompt_tokens=getattr(usage, 'prompt_token_count', 0),
                    completion_tokens=getattr(usage, 'candidates_token_count', 0),
                    total_tokens=getattr(usage, 'total_token_count', 0)
                )
        except Exception as e:
            logger.warning(f"Error logging child tokens: {e}")

    return response.text, usage


# ── LangSmith Trace: full agent pipeline per user request ──
@traceable(name="Indi4 Bot Agent Run", run_type="chain")
async def run_data_agent(user_message: str, user_id: str, user_role: str = "viewer") -> ChatResponse:
    model = _get_model()
    if model is None:
        return ChatResponse(
            answer="Chatbot is not configured. Please set the GEMINI_API_KEY environment variable.",
            confidence="Low",
            reasoning_path="Missing API key",
        )

    clean_msg = user_message.lower().strip()
    greetings = [
        "hi", "hello", "hey", "hi there", "hello kbot", "hi kbot",
        "good morning", "good afternoon",
    ]

    if clean_msg in greetings:
        logger.info("Greeting triggered. Bypassing LLM for speed.")
        return ChatResponse(
            answer="Hello! I am KBot, your Indi4 Data and Diagnostic Assistant. I can help you analyze compressor data, calculate metrics, or troubleshoot problems. What can I do for you today?",
            confidence="High",
            reasoning_path="Direct Greeting Bypass",
        )

    # ── RBAC: block cost queries for non-admin users ──
    is_admin = user_role == "admin"
    needs_cost = _is_cost_query(user_message)

    if needs_cost and not is_admin:
        logger.info(f"Cost query blocked for role='{user_role}'")
        return ChatResponse(
            answer="🔒 **Access Restricted**\n\nCost and price analysis is only available to **Admin** users. You can still ask me about warranty trends, complaint analysis, dealer data, and charts.",
            confidence="High",
            reasoning_path="RBAC: cost query blocked for viewer role",
        )

    # ── Build context (omit cost table for non-cost queries or non-admins) ──
    include_costs = is_admin and needs_cost
    logger.info(f"Search-First Node: query='{user_message}' | include_costs={include_costs} | role={user_role}")
    search_results = find_relevant_context(user_message, include_costs=include_costs)

    context_str = f"""
    EXACT COLUMNS IN WARRANTY DATABASE (Use these for your Pandas code):
    {search_results.get('df_columns', [])}

    SEARCH RESULTS (Pre-filtered from Database):
    - Relevant Diagnostic Knowledge: {search_results.get('filtered_kb', [])}
    - Recent Related Warranty Claims: {search_results.get('filtered_warranty', [])}
    
    COMPLETE SPARE PART COST LIST (Text Format):
    {search_results.get('cost_table_str', 'No cost data available.')}
    """

    current_prompt = f"{SYSTEM_PLANNER_PROMPT}\n\n{context_str}\n\nUser Question: {user_message}\n\nPython Code:"

    max_retries = 1
    last_error = ""

    # Accumulators for parent-level token logging
    total_prompt_tokens = 0
    total_completion_tokens = 0

    for attempt in range(max_retries + 1):
        logger.info(f"Attempt {attempt + 1}: Asking Gemini to process filtered data...")

        try:
            # Get text and usage metadata from helper
            generated_code, usage = _call_gemini(
                prompt=current_prompt,
                model_name=settings.MODEL_NAME,
            )

            # Update parent-level accumulators
            if usage:
                total_prompt_tokens += getattr(usage, 'prompt_token_count', 0)
                total_completion_tokens += getattr(usage, 'candidates_token_count', 0)
                
                # Update the PARENT run metadata immediately so it shows up in main table
                try:
                    parent_run = get_current_run_tree()
                    if parent_run:
                        parent_run.set_usage_metadata(
                            prompt_tokens=total_prompt_tokens,
                            completion_tokens=total_completion_tokens,
                            total_tokens=total_prompt_tokens + total_completion_tokens
                        )
                except Exception as e:
                    logger.warning(f"Error logging parent tokens: {e}")

            if "```python" in generated_code:
                generated_code = generated_code.split("```python")[1].split("```")[0].strip()
            elif "```" in generated_code:
                generated_code = generated_code.split("```")[1].split("```")[0].strip()

            logger.info("Executing code in Python Sandbox...")
            result = execute_agent_code(generated_code)

            if not result.get("error"):
                logger.info("Success!")
                return ChatResponse(
                    answer=result["answer"],
                    confidence="High" if attempt == 0 else "Medium (Self-Corrected)",
                    graph_json=result.get("graph_json"),
                    reasoning_path=f"Successful execution on attempt {attempt + 1}",
                )

            last_error = result["error"]
            logger.warning(f"Attempt {attempt + 1} failed: {last_error}. Retrying...")
            error_snippet = last_error[:200]
            current_prompt += f"\n\nPrevious attempt failed with error: {error_snippet}\nFix the code and try again. Python Code:"

        except ResourceExhausted as e:
            logger.error(f"Gemini quota exhausted (429) — returning immediately.")
            return ChatResponse(
                answer=(
                    "⚠️ **API Quota Exhausted**\n\n"
                    "The Gemini API free-tier daily/minute limit has been reached.\n\n"
                    "**What you can do:**\n"
                    "* ⏳ Wait ~1 minute and try again (per-minute reset)\n"
                    "* 🌅 Wait until midnight IST for the daily quota to reset\n"
                    "* 🔑 Create a new API key at [aistudio.google.com](https://aistudio.google.com) → paste it in `backend/.env`\n\n"
                    "_Error: 429 Too Many Requests_"
                ),
                confidence="Low",
                reasoning_path="Quota exhausted — aborted immediately (no retry)",
            )

        except Exception as e:
            logger.error(f"Critical Agent Failure: {e}")
            return ChatResponse(
                answer=f"An unexpected error occurred: {str(e)[:200]}",
                confidence="Low",
                reasoning_path="Unexpected exception",
                error=str(e),
            )

    logger.error("All attempts failed.")
    return ChatResponse(
        answer="I found the relevant records but had trouble processing them. Please try rephrasing your question.",
        confidence="Low",
        reasoning_path=f"Failed after {max_retries + 1} attempt(s).",
        error=last_error,
    )
