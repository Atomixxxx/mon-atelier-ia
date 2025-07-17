"""
Modèles Pydantic pour les workflows et agents
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum

class WorkflowRequest(BaseModel):
    workflow_type: str
    description: str

class AgentChatRequest(BaseModel):
    message: str
    agent: Optional[str] = "assistant"
    context: Optional[Dict[str, Any]] = None

class WorkflowStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

class WorkflowStepModel(BaseModel):
    id: str
    agent_role: str
    task_description: str
    status: WorkflowStatus
    execution_time: Optional[float] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    error_message: Optional[str] = None
    output_data: Optional[Any] = None

class WorkflowModel(BaseModel):
    id: str
    type: str
    name: str
    description: str
    status: WorkflowStatus
    steps: List[WorkflowStepModel]
    results: Dict[str, Any]
    start_time: str
    end_time: Optional[str] = None
    error: Optional[str] = None