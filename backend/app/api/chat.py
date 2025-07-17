from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Import correct
from app.services.ai_service import query_agent

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str
    agent: Optional[str] = "assistant"
    context: Optional[Dict[str, Any]] = None

@router.post("/")
async def chat(message: ChatMessage):
    """Send a message to an agent and return its response."""
    try:
        response = await query_agent(
            agent_role=message.agent,
            message=message.message,
            context=message.context or {},
        )
        return {"response": response, "agent": message.agent}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur agent: {str(exc)}")