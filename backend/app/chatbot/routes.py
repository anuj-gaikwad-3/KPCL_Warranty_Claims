from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.chatbot.models.request import ChatRequest
from app.chatbot.models.response import ChatResponse
from app.chatbot.agents.code_agent import run_data_agent

router = APIRouter()


@router.get("/health")
async def chatbot_health():
    return {"status": "online", "message": "Indi4 Chatbot service is running"}


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    x_user_role: Optional[str] = Header(default="viewer"),
):
    try:
        user_role = x_user_role if x_user_role in ("admin", "viewer") else "viewer"
        response_data = await run_data_agent(request.message, request.user_id, user_role=user_role)
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
