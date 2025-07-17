from fastapi import APIRouter

# Import depuis le bon endroit
from app.services.ai_service import get_available_agents

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("/")
async def list_agents():
    """Return the list of available AI agents."""
    try:
        agents = get_available_agents()
        return {"agents": agents, "count": len(agents)}
    except Exception as e:
        return {"agents": [], "error": str(e)}