export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}
