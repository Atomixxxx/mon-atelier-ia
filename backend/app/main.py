#!/usr/bin/env python3
"""
Backend FastAPI — Version Unifiée Atelier IA + Bolt/Agent
Supporte: workflows, chat agent, upload fichiers, multi-agent.
"""

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import time, uuid, os, traceback, logging, shutil, asyncio

# ---- Import agents/workflow
from agent import get_available_agents
from config import AGENT_ROLES
from workflow_orchestrator import mastermind_dispatch  # ✅ Corrigé ici

# ---- Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("atelier-backend")

app = FastAPI(title="Backend Atelier IA Unifié", version="1.1.0")

# ---- CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Mémoire pour workflows
workflows_db: Dict[str, Dict[str, Any]] = {}

# ===================
# == MODELS ========
# ===================
class WorkflowRequest(BaseModel):
    workflow_type: str
    description: str

class AgentChatRequest(BaseModel):
    message: str
    agent: Optional[str] = "assistant"  # ✅ Valeur par défaut
    context: Optional[Dict[str, Any]] = None

# ===================
# == MIDDLEWARE ====
# ===================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"➡️ {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"✅ {request.method} {request.url} [{response.status_code}]")
        return response
    except Exception as e:
        logger.error(f"❌ {request.method} {request.url} ERROR: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

# ===================
# == ROUTES API ====
# ===================

@app.get("/")
async def root():
    return {
        "message": "Backend Atelier IA (unifié)",
        "status": "ok",
        "version": "1.1.0",
        "datetime": datetime.now().isoformat(),
        "routes": [
            "/workflows/available", "/workflows/start", "/workflows/{id}/status", "/workflows",
            "/agent", "/agents", "/kb/upload", "/health", "/test"
        ]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "now": datetime.now().isoformat(),
        "workflows": len(workflows_db)
    }

@app.get("/test")
async def test():
    return {"result": "API OK", "timestamp": datetime.now().isoformat()}

# ---- AGENT CHAT (dispatch intelligent)
@app.post("/agent")
async def agent_chat(body: AgentChatRequest):
    try:
        logger.info(f"🤖 Agent chat: [{body.agent}] {body.message[:50]}")
        result = await mastermind_dispatch(
            agent=body.agent,  # ✅ Correction ici
            message=body.message,
            context=body.context or {}
        )
        return {"success": True, "response": result}
    except Exception as e:
        logger.error(f"❌ Agent chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

@app.get("/agents")
async def list_agents():
    return {"agents": get_available_agents()}

# ---- Upload KB Files
UPLOAD_DIR = "./uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/kb/upload")
async def upload_kb_files(files: List[UploadFile] = File(...)):
    uploaded = []
    for file in files:
        dest = os.path.join(UPLOAD_DIR, file.filename)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        uploaded.append(file.filename)
    logger.info(f"📚 Upload fichiers KB: {uploaded}")
    return {"success": True, "uploaded_files": uploaded}

# ---- Workflows
@app.get("/workflows/available")
async def get_available_workflows():
    workflows = {
        "full_development": {
            "name": "Développement Complet",
            "description": "Développement complet frontend + backend + base de données",
            "steps": ["visionnaire", "architecte", "frontend_engineer", "backend_engineer", "database_specialist", "critique", "optimiseur"]
        },
        "frontend_only": {
            "name": "Frontend Uniquement",
            "description": "Conception d'interfaces utilisateur uniquement",
            "steps": ["visionnaire", "architecte", "frontend_engineer", "critique"]
        },
        "backend_api": {
            "name": "API Backend",
            "description": "Création d'API backend robuste",
            "steps": ["visionnaire", "architecte", "backend_engineer", "database_specialist", "critique"]
        },
        "code_review": {
            "name": "Revue de Code",
            "description": "Analyse et optimisation de code existant",
            "steps": ["critique", "optimiseur"]
        }
    }
    return {"success": True, "workflows": workflows}

@app.post("/workflows/start")
async def start_workflow(req: WorkflowRequest):
    logger.info(f"🚀 Start workflow: {req.workflow_type}")
    workflow_id = f"wf_{uuid.uuid4().hex[:8]}"
    workflow = {
        "id": workflow_id,
        "type": req.workflow_type,
        "description": req.description,
        "status": "running",
        "steps": [],
        "results": {},
        "start_time": datetime.now().isoformat(),
        "progress": 0
    }
    workflows_db[workflow_id] = workflow
    return {"success": True, "workflow_id": workflow_id, "message": "Workflow lancé"}

@app.get("/workflows/{workflow_id}/status")
async def get_workflow_status(workflow_id: str):
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow introuvable")
    wf = workflows_db[workflow_id]
    elapsed = (datetime.now() - datetime.fromisoformat(wf["start_time"])).total_seconds()
    wf["progress"] = min(100, int(elapsed * 10))
    if wf["progress"] >= 100:
        wf["status"] = "completed"
    return wf

@app.get("/workflows")
async def list_workflows():
    return {"workflows": list(workflows_db.values()), "count": len(workflows_db)}

# ---- Webhook Slack (optionnel)
@app.post("/webhook/slack")
async def slack_webhook(payload: dict):
    logger.info(f"📥 Webhook Slack reçu: {payload}")
    return {"success": True}

# ---- 404 Handler
@app.exception_handler(404)
async def not_found(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint non trouvé", "url": str(request.url)}
    )

# ---- DEV LAUNCHER
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
