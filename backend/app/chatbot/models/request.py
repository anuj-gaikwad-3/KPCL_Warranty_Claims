from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id: str = Field(default="local_user", description="Unique ID for tenant isolation")
    message: str = Field(..., description="The natural language query from the user")
    session_id: str = Field(default="default_session", description="Context tracking")
