import { useState, useEffect, useCallback } from 'react';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description: string;
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
  agentId?: string;
}

interface WorkflowResult {
  id: string;
  type: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  steps: WorkflowStep[];
  results: Record<string, any>;
  startTime: string;
  endTime?: string;
  progress: number;
  currentStep: number;
}

export const useWorkflowManager = () => {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowResult | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [availableWorkflows, setAvailableWorkflows] = useState<Record<string, any>>({});

  const API_BASE_URL = 'http://localhost:8000';

  // Charger les workflows disponibles
  const loadAvailableWorkflows = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/available`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableWorkflows(data.workflows);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des workflows:', error);
    }
  }, []);

  // Exécuter un workflow
  const executeWorkflow = useCallback(async (workflowType: string, description: string) => {
    setIsExecuting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: workflowType,
          description: description
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Démarrer le polling du statut
          startWorkflowPolling(result.workflow_id);
          return result.workflow_id;
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution du workflow:', error);
      setIsExecuting(false);
    }
  }, []);

  // Polling du statut du workflow
  const startWorkflowPolling = useCallback((workflowId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/status`);
        if (response.ok) {
          const workflow = await response.json();
          setCurrentWorkflow(workflow);
          
          if (workflow.status === 'completed' || workflow.status === 'failed') {
            setIsExecuting(false);
            clearInterval(pollInterval);
            
            // Ajouter à l'historique
            setWorkflowHistory(prev => [workflow, ...prev]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du polling:', error);
        clearInterval(pollInterval);
        setIsExecuting(false);
      }
    }, 1000);

    // Timeout après 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsExecuting(false);
    }, 5 * 60 * 1000);
  }, []);

  useEffect(() => {
    loadAvailableWorkflows();
  }, [loadAvailableWorkflows]);

  return {
    currentWorkflow,
    workflowHistory,
    isExecuting,
    availableWorkflows,
    executeWorkflow,
    loadAvailableWorkflows
  };
};