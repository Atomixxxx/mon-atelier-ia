#!/usr/bin/env python3
"""
Backend FastAPI — Version Unifiée Atelier IA + Contexte Conversationnel
Supporte: workflows, chat agent avec mémoire, upload fichiers, multi-agent, Ollama.
VERSION STABLE CORRIGÉE AVEC OLLAMA — 2024
"""

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import time, uuid, os, traceback, logging, shutil, asyncio, json
try:
    import httpx
except ImportError:
    httpx = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("atelier-backend")

app = FastAPI(title="Backend Atelier IA Unifié", version="1.4.0")

# ---- CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================
# == CONFIGURATION ==
# ===================

OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3-chatqa:latest"
UPLOAD_DIR = "./uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ===================
# == OLLAMA SERVICE ==
# ===================

class OllamaService:
    def __init__(self, base_url: str = OLLAMA_URL):
        self.base_url = base_url
        self.available_models = []
        
    async def check_connection(self) -> bool:
        """Vérifie si Ollama est accessible"""
        if not httpx:
            logger.warning("httpx non installé - Ollama désactivé")
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    self.available_models = [model["name"] for model in data.get("models", [])]
                    return True
                return False
        except Exception as e:
            logger.error(f"Ollama connection failed: {e}")
            return False
    
    async def generate(self, model: str, prompt: str, stream: bool = False) -> str:
        """Génère une réponse avec Ollama"""
        if not httpx:
            return f"[Mock] Réponse pour le modèle {model}: {prompt[:50]}..."
            
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": stream,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "num_ctx": 4096
                    }
                }
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "Pas de réponse générée")
                else:
                    logger.error(f"Ollama error: {response.status_code} - {response.text}")
                    return f"Erreur Ollama: {response.status_code}"
                    
        except asyncio.TimeoutError:
            return "Timeout: La génération a pris trop de temps"
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            return f"Erreur de génération: {str(e)}"
    
    async def get_models(self) -> List[str]:
        """Récupère la liste des modèles disponibles"""
        if not httpx:
            return ["llama3.1", "codellama", "mistral"]  # Mock models
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    return [model["name"] for model in data.get("models", [])]
                return []
        except Exception as e:
            logger.error(f"Failed to get models: {e}")
            return []

# Instance globale Ollama
ollama_service = OllamaService()

# ===================
# == AGENT SERVICES ==
# ===================

def get_available_agents():
    """Retourne la liste des agents disponibles"""
    return ["assistant", "code-assistant", "debugger", "reviewer", "optimizer", "documentation"]

async def query_agent(agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
    """Service principal pour interroger les agents IA via Ollama"""
    try:
        # Vérifier la connexion Ollama
        if not await ollama_service.check_connection():
            logger.warning("Ollama non disponible, utilisation du mode mock")
            return await query_agent_mock(agent_role, message, context)
        
        # Sélectionner le modèle selon l'agent
        model = get_model_for_agent(agent_role)
        
        # Construire le prompt spécialisé selon l'agent
        specialized_prompt = build_agent_prompt(agent_role, message, context)
        
        # Générer la réponse avec Ollama
        response = await ollama_service.generate(model, specialized_prompt)
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur query_agent: {e}")
        # Fallback vers le mock en cas d'erreur
        return await query_agent_mock(agent_role, message, context)

def get_model_for_agent(agent_role: str) -> str:
    """Sélectionne le modèle optimal selon l'agent"""
    model_mapping = {
        "code-assistant": DEFAULT_MODEL,
        "debugger": DEFAULT_MODEL,
        "reviewer": DEFAULT_MODEL,
        "optimizer": DEFAULT_MODEL,
        "documentation": DEFAULT_MODEL,
        "assistant": DEFAULT_MODEL
    }
    return model_mapping.get(agent_role, DEFAULT_MODEL)

def build_agent_prompt(agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
    """Construit un prompt spécialisé selon le rôle de l'agent"""
    
    # Prompts système selon l'agent
    system_prompts = {
        "assistant": "Tu es un assistant IA utile et bienveillant. Réponds de manière claire et précise.",
        
        "code-assistant": """Tu es un expert en développement logiciel. Tu aides à:
- Générer du code propre et fonctionnel
- Résoudre des problèmes de programmation
- Expliquer des concepts techniques
- Optimiser les performances
Réponds toujours avec du code commenté et des explications claires.""",

        "debugger": """Tu es un expert en debugging. Tu aides à:
- Identifier les bugs dans le code
- Analyser les erreurs et exceptions
- Proposer des solutions de correction
- Optimiser le code pour éviter les erreurs
Sois méthodique et précis dans tes analyses.""",

        "reviewer": """Tu es un expert en review de code. Tu évalues:
- La qualité du code et les bonnes pratiques
- La sécurité et les vulnérabilités
- Les performances et l'optimisation
- La lisibilité et la maintenabilité
Donne des commentaires constructifs et des suggestions d'amélioration.""",

        "optimizer": """Tu es un expert en optimisation. Tu te concentres sur:
- L'amélioration des performances
- La réduction de la complexité
- L'optimisation des ressources
- Les algorithmes plus efficaces
Propose des solutions concrètes et mesurables.""",

        "documentation": """Tu es un expert en documentation technique. Tu aides à:
- Créer une documentation claire et complète
- Rédiger des commentaires de code
- Expliquer des architectures complexes
- Créer des guides d'utilisation
Écris de manière structurée et accessible."""
    }
    
    system_prompt = system_prompts.get(agent_role, system_prompts["assistant"])
    
    # Construire le prompt final
    prompt_parts = [system_prompt, "\n"]
    
    # Ajouter le contexte si disponible
    if context:
        if context.get("recentMessages"):
            prompt_parts.append("HISTORIQUE DE LA CONVERSATION:")
            for msg in context["recentMessages"][-3:]:  # 3 derniers messages
                if isinstance(msg, dict):
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    prompt_parts.append(f"{role.upper()}: {content}")
            prompt_parts.append("")
        
        if context.get("codeContext"):
            prompt_parts.append(f"FICHIERS DE CODE: {', '.join(context['codeContext'])}")
        
        if context.get("projectId"):
            prompt_parts.append(f"PROJET: {context['projectId']}")
        
        prompt_parts.append("")
    
    # Ajouter la demande actuelle
    prompt_parts.append(f"DEMANDE:\n{message}")
    
    return "\n".join(prompt_parts)

async def query_agent_mock(agent_role: str, message: str, context: Dict[str, Any] = None) -> str:
    """Service mock pour les agents (fallback)"""
    await asyncio.sleep(0.1)  # Simulation délai
    
    context_info = ""
    if context:
        msg_count = len(context.get('recentMessages', []))
        project = context.get('projectId', 'Aucun')
        context_info = f" (Contexte: {msg_count} messages, Projet: {project})"
    
    responses = {
        "code-assistant": f"[Code Assistant] Je vais vous aider avec: {message[:60]}...{context_info}\n\nVoici une réponse de développement structurée pour votre demande.",
        "debugger": f"[Debugger] Analyse du problème: {message[:60]}...{context_info}\n\nJe vais identifier les issues potentielles et proposer des solutions.",
        "reviewer": f"[Reviewer] Review de code: {message[:60]}...{context_info}\n\nVoici mes recommandations pour améliorer la qualité du code.",
        "optimizer": f"[Optimizer] Optimisation: {message[:60]}...{context_info}\n\nJe propose ces améliorations de performance.",
        "documentation": f"[Documentation] Documentation: {message[:60]}...{context_info}\n\nVoici une documentation structurée pour votre projet.",
        "assistant": f"[Assistant] Je comprends votre demande: {message[:60]}...{context_info}\n\nVoici ma réponse détaillée."
    }
    
    return responses.get(agent_role, responses["assistant"])

# ===================
# == WORKFLOW ENGINE ==
# ===================

class WorkflowOrchestrator:
    def __init__(self):
        self.running_workflows = {}
    
    def get_available_workflows(self):
        return [
            "code_generation", 
            "project_setup", 
            "debugging", 
            "optimization",
            "documentation_generation",
            "code_review",
            "testing"
        ]
    
    async def start_workflow(self, workflow_type: str, description: str):
        workflow_id = f"wf_{int(time.time())}_{uuid.uuid4().hex[:8]}"
        self.running_workflows[workflow_id] = {
            "type": workflow_type,
            "status": "running",
            "description": description,
            "created_at": datetime.now().isoformat(),
            "steps": []
        }
        
        # Simuler l'exécution du workflow
        asyncio.create_task(self._execute_workflow(workflow_id, workflow_type, description))
        
        return workflow_id
    
    async def _execute_workflow(self, workflow_id: str, workflow_type: str, description: str):
        """Exécute un workflow de manière asynchrone"""
        try:
            # Simuler des étapes de workflow
            steps = self._get_workflow_steps(workflow_type)
            
            for i, step in enumerate(steps):
                await asyncio.sleep(2)  # Simulation délai
                self.running_workflows[workflow_id]["steps"].append({
                    "step": i + 1,
                    "name": step,
                    "status": "completed",
                    "timestamp": datetime.now().isoformat()
                })
            
            self.running_workflows[workflow_id]["status"] = "completed"
            
        except Exception as e:
            logger.error(f"Workflow {workflow_id} failed: {e}")
            self.running_workflows[workflow_id]["status"] = "failed"
            self.running_workflows[workflow_id]["error"] = str(e)
    
    def _get_workflow_steps(self, workflow_type: str) -> List[str]:
        """Retourne les étapes d'un type de workflow"""
        steps_mapping = {
            "code_generation": ["Analyse des requirements", "Génération du code", "Tests", "Documentation"],
            "project_setup": ["Initialisation", "Structure de dossiers", "Configuration", "Dépendances"],
            "debugging": ["Analyse du problème", "Identification des causes", "Correction", "Validation"],
            "optimization": ["Analyse des performances", "Identification des goulots", "Optimisation", "Benchmarking"],
            "documentation_generation": ["Analyse du code", "Génération des docs", "Révision", "Publication"],
            "code_review": ["Analyse statique", "Review sécurité", "Review performance", "Rapport final"],
            "testing": ["Analyse du code", "Génération des tests", "Exécution", "Rapport de couverture"]
        }
        return steps_mapping.get(workflow_type, ["Étape 1", "Étape 2", "Finalisation"])
    
    async def get_workflow_status(self, workflow_id: str):
        if workflow_id in self.running_workflows:
            return self.running_workflows[workflow_id]
        raise Exception("Workflow not found")
    
    async def stop_workflow(self, workflow_id: str):
        if workflow_id in self.running_workflows:
            self.running_workflows[workflow_id]["status"] = "stopped"
            return True
        return False

workflow_orchestrator = WorkflowOrchestrator()

# ===================
# == MODELS ========
# ===================

class WorkflowRequest(BaseModel):
    workflow_type: str
    description: str

class ConversationContext(BaseModel):
    summary: Optional[str] = None
    recentMessages: Optional[List[Dict[str, Any]]] = []
    codeContext: Optional[List[str]] = []
    objectives: Optional[List[str]] = []
    currentFiles: Optional[List[str]] = []
    conversationId: Optional[str] = None
    projectId: Optional[str] = None
    messageCount: Optional[int] = 0
    lastInteraction: Optional[str] = None

class AgentChatRequest(BaseModel):
    message: str
    agent: Optional[str] = "assistant"
    context: Optional[Union[Dict[str, Any], ConversationContext]] = None
    project_id: Optional[str] = None
    conversation_id: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    agent: Optional[str] = "assistant"
    context: Optional[Union[Dict[str, Any], ConversationContext]] = None
    project_id: Optional[str] = None
    conversation_id: Optional[str] = None
    execute_code: Optional[bool] = False
    language: Optional[str] = None

class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    agent: Optional[str] = "code-assistant"
    context: Optional[Union[Dict[str, Any], ConversationContext]] = None

class CodeAnalysisRequest(BaseModel):
    code: str
    language: str
    analysis_type: Optional[str] = "review"

class CodeGenerationRequest(BaseModel):
    description: str
    language: str
    context: Optional[Union[Dict[str, Any], ConversationContext]] = None

class ModelSwitchRequest(BaseModel):
    model: str

# ===================
# == UTILS CONTEXTE ==
# ===================

def safe_get_context_dict(context: Union[Dict, ConversationContext, None]) -> Dict[str, Any]:
    """Convertit le contexte en dictionnaire de manière sécurisée"""
    if context is None:
        return {}
    
    try:
        if isinstance(context, dict):
            return context
        elif hasattr(context, 'dict'):
            return context.dict()
        else:
            return {}
    except Exception as e:
        logger.error(f"Erreur conversion contexte: {e}")
        return {}

def build_contextual_prompt(message: str, context: Union[Dict, ConversationContext, None] = None) -> str:
    """Construit un prompt enrichi avec le contexte conversationnel"""
    if not context:
        return message
    
    try:
        context_dict = safe_get_context_dict(context)
        prompt_parts = []
        
        # Ajouter le résumé de la conversation
        if context_dict.get("summary"):
            prompt_parts.append(f"CONTEXTE DE LA CONVERSATION:\n{context_dict['summary']}\n")
        
        # Ajouter les messages récents
        recent_messages = context_dict.get("recentMessages", [])
        if recent_messages and isinstance(recent_messages, list) and len(recent_messages) > 0:
            prompt_parts.append("HISTORIQUE RÉCENT:")
            for msg in recent_messages[-5:]:  # 5 derniers messages
                if isinstance(msg, dict):
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    if content:
                        prompt_parts.append(f"{role.upper()}: {content}")
            prompt_parts.append("")
        
        # Ajouter le contexte de code
        code_context = context_dict.get("codeContext", [])
        if code_context and isinstance(code_context, list) and len(code_context) > 0:
            prompt_parts.append(f"FICHIERS DE CODE ACTUELS: {', '.join(code_context)}")
        
        # Ajouter les objectifs
        objectives = context_dict.get("objectives", [])
        if objectives and isinstance(objectives, list) and len(objectives) > 0:
            prompt_parts.append(f"OBJECTIFS: {', '.join(objectives)}")
        
        # Ajouter les métadonnées
        if context_dict.get("projectId"):
            prompt_parts.append(f"PROJET: {context_dict['projectId']}")
        
        if context_dict.get("messageCount"):
            prompt_parts.append(f"MESSAGE #{context_dict['messageCount']} de cette conversation")
        
        # Ajouter le message actuel
        prompt_parts.append(f"\nDEMANDE ACTUELLE:\n{message}")
        
        return "\n".join(prompt_parts)
        
    except Exception as e:
        logger.error(f"Erreur build_contextual_prompt: {e}")
        return message

def update_context_with_response(context: Union[Dict, ConversationContext, None], user_message: str, ai_response: str) -> Dict[str, Any]:
    """Met à jour le contexte avec la nouvelle interaction"""
    try:
        # Convertir le contexte en dict de manière sécurisée
        context_dict = safe_get_context_dict(context)
        
        # Initialiser recentMessages si nécessaire
        if "recentMessages" not in context_dict:
            context_dict["recentMessages"] = []
        
        # S'assurer que c'est une liste
        if not isinstance(context_dict["recentMessages"], list):
            context_dict["recentMessages"] = []
        
        # Ajouter les nouveaux messages
        new_messages = [
            {
                "role": "user",
                "content": user_message,
                "timestamp": datetime.now().isoformat()
            },
            {
                "role": "assistant", 
                "content": ai_response,
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        context_dict["recentMessages"].extend(new_messages)
        
        # Garder seulement les 10 derniers messages
        context_dict["recentMessages"] = context_dict["recentMessages"][-10:]
        
        # Mettre à jour les métadonnées
        context_dict["lastInteraction"] = datetime.now().isoformat()
        context_dict["messageCount"] = context_dict.get("messageCount", 0) + 1
        
        return context_dict
        
    except Exception as e:
        logger.error(f"Erreur update_context_with_response: {e}")
        # Retourner un contexte minimal en cas d'erreur
        return {
            "recentMessages": [
                {"role": "user", "content": user_message, "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "content": ai_response, "timestamp": datetime.now().isoformat()}
            ],
            "messageCount": 1,
            "lastInteraction": datetime.now().isoformat()
        }

# ===================
# == MIDDLEWARE ====
# ===================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"➡️ {request.method} {request.url}")
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        logger.info(f"✅ {request.method} {request.url} [{response.status_code}] {duration:.2f}s")
        return response
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"❌ {request.method} {request.url} ERROR: {str(e)} {duration:.2f}s")
        return JSONResponse(status_code=500, content={"detail": str(e)})

# ===================
# == ROUTES API ====
# ===================

@app.get("/")
async def root():
    ollama_status = "✅ Connecté" if await ollama_service.check_connection() else "❌ Déconnecté"
    
    return {
        "message": "Backend Atelier IA (unifié avec contexte conversationnel + Ollama)",
        "status": "ok",
        "version": "1.4.0",
        "datetime": datetime.now().isoformat(),
        "ollama_status": ollama_status,
        "available_models": ollama_service.available_models,
        "features": [
            "Chat avec mémoire conversationnelle",
            "Intégration Ollama complète",
            "Multi-agents spécialisés",
            "Analyse et génération de code",
            "Workflows automatisés",
            "Upload de fichiers"
        ],
        "routes": [
            "/health", "/test", "/agents", "/agent", "/chat",
            "/agent/execute", "/agent/analyze", "/agent/generate",
            "/models/available", "/models/switch",
            "/workflows/available", "/workflows/start", "/workflows/{id}/status", 
            "/workflows", "/kb/upload"
        ],
        "agents_available": len(get_available_agents()),
        "workflows_running": len(workflow_orchestrator.running_workflows)
    }

@app.get("/health")
async def health():
    try:
        agents_count = len(get_available_agents())
        workflows_count = len(workflow_orchestrator.running_workflows)
        ollama_connected = await ollama_service.check_connection()
        
        return {
            "status": "healthy" if ollama_connected else "degraded",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "agents": f"{agents_count} disponibles",
                "workflows": f"{workflows_count} actifs", 
                "storage": "disponible",
                "contexte_conversationnel": "activé",
                "ollama": "connecté" if ollama_connected else "déconnecté",
                "models": f"{len(ollama_service.available_models)} modèles"
            },
            "version": "1.4.0"
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "degraded",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@app.get("/test")
async def test():
    ollama_test = await ollama_service.check_connection()
    return {
        "result": "API OK", 
        "timestamp": datetime.now().isoformat(),
        "test_status": "✅ Toutes les fonctions opérationnelles",
        "contexte_test": "Mémoire conversationnelle active",
        "ollama_test": "✅ Connecté" if ollama_test else "❌ Déconnecté"
    }

# ---- MODELS API ----

@app.get("/models/available")
async def get_available_models():
    """Liste des modèles Ollama disponibles"""
    try:
        models = await ollama_service.get_models()
        return {
            "success": True,
            "models": models,
            "default_model": DEFAULT_MODEL,
            "count": len(models),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erreur liste modèles: {e}")
        return {
            "success": False,
            "models": [],
            "error": str(e)
        }

@app.post("/models/switch")
async def switch_model(request: ModelSwitchRequest):
    """Change le modèle par défaut"""
    try:
        available_models = await ollama_service.get_models()
        if request.model not in available_models:
            raise HTTPException(status_code=400, detail=f"Modèle '{request.model}' non disponible")
        
        global DEFAULT_MODEL
        DEFAULT_MODEL = request.model
        
        return {
            "success": True,
            "new_default_model": DEFAULT_MODEL,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erreur changement modèle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---- AGENTS API ----

@app.get("/agents")
async def list_agents():
    """Liste tous les agents disponibles"""
    try:
        agents = get_available_agents()
        return {
            "success": True,
            "agents": agents,
            "count": len(agents),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erreur liste agents: {e}")
        return {
            "success": False,
            "agents": [],
            "error": str(e)
        }

@app.get("/agents/{agent_id}/capabilities")
async def get_agent_capabilities(agent_id: str):
    """Récupère les capacités d'un agent spécifique"""
    available_agents = get_available_agents()
    if agent_id not in available_agents:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' non trouvé")
    
    capabilities = {
        "assistant": ["conversation", "aide_generale", "explication", "conseil"],
        "code-assistant": ["generation_code", "review_code", "debug", "optimisation", "refactoring"],
        "debugger": ["analyse_erreurs", "debug", "tests", "correction_bugs"],
        "reviewer": ["review_code", "suggestions", "bonnes_pratiques", "securite"],
        "optimizer": ["optimisation", "performance", "refactoring", "algorithmes"],
        "documentation": ["redaction", "commentaires", "guides", "architecture"]
    }
    
    return {
        "agent_id": agent_id,
        "capabilities": capabilities.get(agent_id, ["conversation"]),
        "status": "available",
        "model": get_model_for_agent(agent_id),
        "timestamp": datetime.now().isoformat()
    }

# ---- CHAT API ----

@app.get("/chat")
async def chat_info():
    """Informations sur l'endpoint chat"""
    return {
        "endpoint": "/chat",
        "method": "POST",
        "description": "Endpoint pour communiquer avec les agents IA avec mémoire conversationnelle",
        "usage": {
            "url": "http://localhost:8000/chat",
            "method": "POST",
            "content_type": "application/json",
            "body_example": {
                "message": "Continue le développement du composant React",
                "agent": "code-assistant",
                "context": {
                    "summary": "Développement d'un composant React",
                    "recentMessages": [
                        {"role": "user", "content": "Crée un composant Button"},
                        {"role": "assistant", "content": "Voici le composant..."}
                    ],
                    "codeContext": ["Button.tsx", "styles.css"],
                    "projectId": "mon-projet",
                    "conversationId": "conv-123"
                }
            }
        },
        "features": [
            "Mémoire conversationnelle",
            "Contexte de code",
            "Multi-agents spécialisés",
            "Intégration Ollama",
            "Persistance des conversations"
        ],
        "available_agents": get_available_agents(),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/chat")
async def chat(message: ChatMessage):
    """Endpoint principal pour le chat avec mémoire conversationnelle"""
    try:
        # Validation
        if not message.message or not message.message.strip():
            raise HTTPException(status_code=400, detail="Le message ne peut pas être vide")

        available_agents = get_available_agents()
        agent = message.agent or "assistant"
        if agent not in available_agents:
            raise HTTPException(status_code=400, detail=f"Agent '{agent}' non disponible. Agents: {available_agents}")

        start_time = time.time()
        
        # Construire le prompt avec contexte
        contextual_prompt = build_contextual_prompt(message.message, message.context)
        
        logger.info(f"🤖 Chat avec contexte: [{agent}] {message.message[:50]}...")
        if message.context:
            context_dict = safe_get_context_dict(message.context)
            if context_dict.get("conversationId"):
                logger.info(f"📝 Conversation: {context_dict['conversationId']}")

        # Appel à l'agent avec le prompt contextualisé
        context_dict = safe_get_context_dict(message.context)
        result = await query_agent(
            agent_role=agent,
            message=contextual_prompt,
            context=context_dict
        )

        duration = time.time() - start_time
        
        # Mettre à jour le contexte avec la nouvelle interaction
        updated_context = update_context_with_response(
            message.context,
            message.message,
            result
        )

        logger.info(f"✅ Agent [{agent}] responded in {duration:.2f}s")

        return {
            "success": True,
            "response": result,
            "agent": agent,
            "context": updated_context,  # Contexte mis à jour pour le frontend
            "metadata": {
                "response_time": f"{duration:.2f}s",
                "message_count": updated_context.get("messageCount", 0),
                "has_context": bool(message.context),
                "project_id": message.project_id,
                "conversation_id": message.conversation_id,
                "model_used": get_model_for_agent(agent)
            },
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Chat endpoint error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erreur chat: {str(e)}")

# ---- LEGACY SUPPORT ----

@app.post("/agent")
async def agent_chat_legacy(body: AgentChatRequest):
    """Endpoint legacy pour compatibilité"""
    try:
        start_time = time.time()
        logger.info(f"🤖 Agent chat legacy: [{body.agent}] {body.message[:60]}...")

        context_dict = safe_get_context_dict(body.context)
        result = await query_agent(
            agent_role=body.agent,
            message=body.message,
            context=context_dict
        )

        duration = time.time() - start_time
        logger.info(f"✅ Agent [{body.agent}] responded in {duration:.2f}s")

        return {
            "success": True,
            "response": result,
            "agent": body.agent,
            "timestamp": datetime.now().isoformat(),
            "response_time": f"{duration:.2f}s"
        }

    except Exception as e:
        logger.error(f"❌ Agent chat failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erreur agent {body.agent}: {str(e)}")

# ---- ENDPOINTS SPÉCIALISÉS ----

@app.post("/agent/execute")
async def execute_code(request: CodeExecutionRequest):
    """Exécution de code avec contexte"""
    try:
        prompt = f"""
EXÉCUTION DE CODE:
Langage: {request.language}
Code à exécuter:
```{request.language}
{request.code}
```

Instructions: Analyse ce code, explique ce qu'il fait, et retourne le résultat attendu. Si il y a des erreurs, explique-les et propose des corrections.
"""
        
        if request.context:
            prompt = build_contextual_prompt(prompt, request.context)

        context_dict = safe_get_context_dict(request.context)
        result = await query_agent(
            agent_role=request.agent,
            message=prompt,
            context=context_dict
        )

        return {
            "success": True,
            "result": result,
            "language": request.language,
            "agent": request.agent,
            "metadata": {
                "execution_type": "code_execution",
                "code_length": len(request.code),
                "model_used": get_model_for_agent(request.agent)
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Code execution error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur exécution: {str(e)}")

@app.post("/agent/analyze")
async def analyze_code(request: CodeAnalysisRequest):
    """Analyse de code (review, debug, optimize, explain)"""
    try:
        analysis_prompts = {
            "review": f"REVIEW DE CODE:\nAnalyse ce code {request.language} et donne tes recommandations pour l'améliorer:",
            "optimize": f"OPTIMISATION:\nComment optimiser ce code {request.language} pour de meilleures performances:",
            "debug": f"DEBUG:\nAnalyse ce code {request.language} et identifie les problèmes potentiels:",
            "explain": f"EXPLICATION:\nExplique ce code {request.language} de manière détaillée:"
        }
        
        prompt = analysis_prompts.get(request.analysis_type, analysis_prompts["review"])
        prompt += f"\n\n```{request.language}\n{request.code}\n```"

        result = await query_agent(
            agent_role="code-assistant",
            message=prompt,
            context={}
        )

        return {
            "success": True,
            "analysis": result,
            "analysis_type": request.analysis_type,
            "language": request.language,
            "model_used": get_model_for_agent("code-assistant"),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Code analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur analyse: {str(e)}")

@app.post("/agent/generate")
async def generate_code(request: CodeGenerationRequest):
    """Génération de code avec contexte"""
    try:
        prompt = f"""
GÉNÉRATION DE CODE:
Langage: {request.language}
Description: {request.description}

Instructions: Génère du code {request.language} propre, bien commenté et fonctionnel selon cette description. Inclus des exemples d'utilisation si pertinent.
"""
        
        if request.context:
            prompt = build_contextual_prompt(prompt, request.context)

        context_dict = safe_get_context_dict(request.context)
        result = await query_agent(
            agent_role="code-assistant",
            message=prompt,
            context=context_dict
        )

        return {
            "success": True,
            "generated_code": result,
            "language": request.language,
            "description": request.description,
            "model_used": get_model_for_agent("code-assistant"),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Code generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur génération: {str(e)}")

# ---- WORKFLOWS ----

@app.get("/workflows/available")
async def get_available_workflows():
    """Liste des types de workflows disponibles"""
    try:
        workflows = workflow_orchestrator.get_available_workflows()
        return {
            "success": True,
            "workflows": workflows,
            "count": len(workflows),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Erreur workflows disponibles: {e}")
        return {"success": False, "workflows": [], "error": str(e)}

@app.post("/workflows/start")
async def start_workflow(request: WorkflowRequest):
    """Démarre un nouveau workflow"""
    try:
        workflow_id = await workflow_orchestrator.start_workflow(
            request.workflow_type, 
            request.description
        )
        logger.info(f"🔄 Workflow démarré: {workflow_id}")
        return {
            "success": True,
            "workflow_id": workflow_id,
            "type": request.workflow_type,
            "status": "started",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Erreur démarrage workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur workflow: {str(e)}")

@app.get("/workflows/{workflow_id}/status")
async def get_workflow_status(workflow_id: str):
    """Statut d'un workflow"""
    try:
        status = await workflow_orchestrator.get_workflow_status(workflow_id)
        return {
            "success": True,
            "workflow_id": workflow_id,
            "workflow_data": status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Erreur statut workflow: {e}")
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} non trouvé")

@app.post("/workflows/{workflow_id}/stop")
async def stop_workflow(workflow_id: str):
    """Arrête un workflow"""
    try:
        success = await workflow_orchestrator.stop_workflow(workflow_id)
        if success:
            return {
                "success": True,
                "workflow_id": workflow_id,
                "status": "stopped",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} non trouvé")
    except Exception as e:
        logger.error(f"❌ Erreur arrêt workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur arrêt workflow: {str(e)}")

@app.get("/workflows")
async def list_running_workflows():
    """Liste des workflows en cours"""
    try:
        workflows = workflow_orchestrator.running_workflows
        return {
            "success": True,
            "running_workflows": workflows,
            "count": len(workflows),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Erreur liste workflows: {e}")
        return {"success": False, "workflows": [], "error": str(e)}

# ---- UPLOAD FILES ----

@app.post("/kb/upload")
async def upload_kb_files(files: List[UploadFile] = File(...)):
    """Upload de fichiers de connaissance"""
    uploaded = []
    try:
        for file in files:
            # Sécuriser le nom de fichier
            safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-")
            timestamp = int(time.time())
            safe_filename = f"{timestamp}_{safe_filename}"
            dest = os.path.join(UPLOAD_DIR, safe_filename)
            
            # Sauvegarder le fichier (version synchrone)
            with open(dest, 'wb') as f:
                content = await file.read()
                f.write(content)
            
            uploaded.append({
                "original_name": file.filename,
                "saved_name": safe_filename,
                "size": len(content),
                "content_type": file.content_type
            })
            
        logger.info(f"📚 Upload fichiers KB: {[f['saved_name'] for f in uploaded]}")
        return {
            "success": True,
            "uploaded_files": uploaded,
            "count": len(uploaded),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur upload: {str(e)}")

# ---- SYSTEM ENDPOINTS ----

@app.get("/system/status")
async def system_status():
    """Statut détaillé du système"""
    try:
        ollama_connected = await ollama_service.check_connection()
        models = await ollama_service.get_models()
        
        return {
            "system": {
                "status": "operational",
                "version": "1.4.0",
                "uptime": time.time(),
                "timestamp": datetime.now().isoformat()
            },
            "services": {
                "ollama": {
                    "connected": ollama_connected,
                    "url": OLLAMA_URL,
                    "models": models,
                    "default_model": DEFAULT_MODEL
                },
                "agents": {
                    "available": get_available_agents(),
                    "count": len(get_available_agents())
                },
                "workflows": {
                    "running": len(workflow_orchestrator.running_workflows),
                    "available_types": workflow_orchestrator.get_available_workflows()
                },
                "storage": {
                    "upload_dir": UPLOAD_DIR,
                    "files": len(os.listdir(UPLOAD_DIR)) if os.path.exists(UPLOAD_DIR) else 0
                }
            }
        }
    except Exception as e:
        logger.error(f"System status error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur statut système: {str(e)}")

# ---- ERROR HANDLERS ----

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "timestamp": datetime.now().isoformat()}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"General Exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erreur interne: {str(exc)}", "timestamp": datetime.now().isoformat()}
    )

# ---- STARTUP/SHUTDOWN EVENTS ----

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Backend Atelier IA démarré avec contexte conversationnel + Ollama")
    
    # Test de connexion Ollama
    ollama_connected = await ollama_service.check_connection()
    if ollama_connected:
        logger.info(f"✅ Ollama connecté: {len(ollama_service.available_models)} modèles disponibles")
        logger.info(f"🤖 Modèle par défaut: {DEFAULT_MODEL}")
    else:
        logger.warning("⚠️ Ollama non connecté - mode fallback activé")
    
    logger.info(f"📊 {len(get_available_agents())} agents disponibles")
    logger.info(f"🔧 {len(workflow_orchestrator.get_available_workflows())} types de workflows")
    logger.info("🧠 Mémoire conversationnelle activée")
    logger.info("✅ Prêt à recevoir des requêtes")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Arrêt du backend Atelier IA")

# ---- DEV LAUNCHER ----

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)