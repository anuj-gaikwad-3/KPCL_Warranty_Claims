import logging
import langchain
from app.chatbot.config import settings
from app.chatbot.agents.prompts import SYSTEM_PLANNER_PROMPT
from app.chatbot.services.data_parser import execute_agent_code, find_relevant_context
from app.chatbot.models.response import ChatResponse

from langchain_google_genai import ChatGoogleGenerativeAI

langchain.debug = True

logger = logging.getLogger(__name__)

api_key = settings.GEMINI_API_KEY
if not api_key:
    logger.warning("GEMINI_API_KEY is not set -- chatbot will fail on /chat requests")

llm = None
if api_key:
    llm = ChatGoogleGenerativeAI(
        model=settings.MODEL_NAME,
        google_api_key=api_key,
        temperature=0,
        max_retries=0,
        timeout=30,
    )


async def run_data_agent(user_message: str, user_id: str) -> ChatResponse:
    if not llm:
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
            answer="Hello! I am KBot, your KPCL Data and Diagnostic Assistant. I can help you analyze compressor data, calculate metrics, or troubleshoot problems. What can I do for you today?",
            confidence="High",
            reasoning_path="Direct Greeting Bypass",
        )

    logger.info(f"Search-First Node: Filtering data for query: {user_message}")
    search_results = find_relevant_context(user_message)

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

    max_retries = 3
    last_error = ""

    for attempt in range(max_retries):
        logger.info(f"Attempt {attempt + 1}: Asking Gemini to process filtered data...")

        try:
            response = llm.invoke(current_prompt)
            generated_code = response.content

            logger.info(f"RAW CODE FROM AI:\n{generated_code}\n")

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
                    reasoning_path=f"Successful search-led execution on attempt {attempt + 1}",
                )

            last_error = result["error"]
            logger.warning(f"Attempt {attempt + 1} failed: {last_error}. Retrying...")
            current_prompt += f"\n\nPrevious Code: {generated_code}\nError: {last_error}\nPlease fix the logic and try again. Python Code:"

        except Exception as e:
            logger.error(f"Critical Agent Failure: {e}")
            break

    logger.error("All attempts failed.")
    return ChatResponse(
        answer="I successfully identified the records but had trouble calculating the final summary. Please try rephrasing your question.",
        confidence="Low",
        reasoning_path=f"Failed after {max_retries} attempts.",
        error=last_error,
    )
