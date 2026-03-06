from pydantic import BaseModel
from typing import Optional


class ChatResponse(BaseModel):
    answer: str
    confidence: Optional[str] = None
    reasoning_path: Optional[str] = None
    error: Optional[str] = None
    graph_json: Optional[str] = None
    graph_base64: Optional[str] = None
