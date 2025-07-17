import uuid
from datetime import datetime
from enum import Enum

# ---- ENUM ÉTATS ----
class WorkflowStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

# ---- STEP ----
class WorkflowStep:
    def __init__(self, agent_role, task_description):
        self.id = str(uuid.uuid4())
        self.agent_role = agent_role
        self.task_description = task_description
        self.status = WorkflowStatus.PENDING
        self.execution_time = None
        self.start_time = None
        self.end_time = None
        self.error_message = None
        self.output_data = None

    def to_dict(self):
        return {
            "id": self.id,
            "agent_role": self.agent_role,
            "task_description": self.task_description,
            "status": self.status.value,
            "execution_time": self.execution_time,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "error_message": self.error_message,
            "output_data": self.output_data,
        }

# ---- ORCHESTRATEUR ----
class WorkflowOrchestrator:
    def __init__(self):
        self.running_workflows = {}
        self.workflow_templates = {
            "full_development": {
                "name": "Développement Complet",
                "description": "Développement complet frontend + backend + base de données",
                "steps": [
                    "visionnaire", "architecte",
                    "frontend_engineer", "backend_engineer",
                    "database_specialist", "critique", "optimiseur"
                ]
            },
            "frontend_only": {
                "name": "Frontend uniquement",
                "description": "Conception d'interfaces utilisateur uniquement",
                "steps": [
                    "visionnaire", "frontend_engineer", "designer_ui_ux", "critique"
                ]
            },
            "backend_api": {
                "name": "Backend API",
                "description": "Création d'API backend",
                "steps": [
                    "visionnaire", "architecte", "backend_engineer", "database_specialist", "critique"
                ]
            },
            "code_review": {
                "name": "Analyse de Code",
                "description": "Analyse et optimisation de code existant",
                "steps": ["critique", "optimiseur"]
            }
        }

    def get_available_workflows(self):
        return self.workflow_templates

    def suggest_workflow(self, user_request: str) -> str:
        req = user_request.lower()
        if "frontend" in req:
            return "frontend_only"
        elif "api" in req or "backend" in req:
            return "backend_api"
        elif "review" in req or "optimise" in req or "optimiser" in req or "analyse" in req:
            return "code_review"
        else:
            return "full_development"

    async def execute_workflow(
        self, workflow_type: str, user_request: str, context: dict = None,
        workflow_id: str = None, results_dict: dict = None
    ):
        if workflow_type not in self.workflow_templates:
            raise ValueError("Type de workflow inconnu")

        workflow_id = workflow_id or f"workflow_{uuid.uuid4().hex[:8]}"
        print(f"[DEBUG] Workflow créé avec l'ID {workflow_id}")
        context = context or {}
        steps_data = []
        agent_outputs = {}

        workflow_data = {
            "id": workflow_id,
            "type": workflow_type,
            "name": self.workflow_templates[workflow_type]["name"],
            "description": self.workflow_templates[workflow_type]["description"],
            "status": WorkflowStatus.RUNNING.value,
            "steps": [],
            "results": {},
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "error": None
        }

        try:
            for agent_role in self.workflow_templates[workflow_type]["steps"]:
                step = WorkflowStep(agent_role, user_request)
                step.status = WorkflowStatus.RUNNING
                step.start_time = datetime.now()

                try:
                    from services.ai_service import query_agent
                    result = await query_agent(agent_role, user_request, context)
                    step.output_data = result
                    step.status = WorkflowStatus.COMPLETED
                    step.error_message = None
                except Exception as e:
                    step.output_data = None
                    step.status = WorkflowStatus.FAILED
                    step.error_message = str(e)
                    workflow_data["status"] = WorkflowStatus.FAILED.value
                    workflow_data["error"] = str(e)
                    step.end_time = datetime.now()
                    step.execution_time = (step.end_time - step.start_time).total_seconds()
                    steps_data.append(step.to_dict())
                    break

                step.end_time = datetime.now()
                step.execution_time = (step.end_time - step.start_time).total_seconds()
                steps_data.append(step.to_dict())
                agent_outputs[agent_role] = step.output_data
                context["last_output"] = step.output_data

            else:
                workflow_data["status"] = WorkflowStatus.COMPLETED.value

            workflow_data["steps"] = steps_data
            workflow_data["results"] = agent_outputs
            workflow_data["end_time"] = datetime.now().isoformat()

        except Exception as e:
            workflow_data["status"] = WorkflowStatus.FAILED.value
            workflow_data["error"] = str(e)
            workflow_data["end_time"] = datetime.now().isoformat()

        self.running_workflows[workflow_id] = workflow_data
        if results_dict is not None:
            results_dict[workflow_id] = agent_outputs
        return workflow_id

    def get_workflow_status(self, workflow_id: str):
        print("[DEBUG] IDs actuellement stockés :", list(self.running_workflows.keys()))
        print(f"[DEBUG] Demande de status pour workflow_id: {workflow_id}")
        return self.running_workflows.get(workflow_id)

# --- Singleton global ---
workflow_orchestrator = WorkflowOrchestrator()

# --- Dispatcher pour main.py ---
async def mastermind_dispatch(agent: str, message: str, context: dict) -> str:
    from services.ai_service import query_agent
    return await query_agent(agent_role=agent, message=message, context=context)
