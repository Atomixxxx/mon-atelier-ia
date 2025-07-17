import React, { useState } from 'react';
import { Play, Zap, ChevronRight, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AvailableWorkflow {
  name: string;
  description: string;
  steps: string[];
  category: string;
  icon: string;
}

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
  executionTime?: number;
  outputData?: any;
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

interface WorkflowPanelProps {
  workflows: Record<string, AvailableWorkflow>;
  currentWorkflow: WorkflowResult | null;
  isExecuting: boolean;
  onExecute: (workflowType: string, description: string) => void;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  workflows,
  currentWorkflow,
  isExecuting,
  onExecute
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState('');

  const handleExecute = (workflowKey: string) => {
    const workflow = workflows[workflowKey];
    if (workflow) {
      const description = customDescription || workflow.description;
      onExecute(workflowKey, description);
      setCustomDescription('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Workflows IA</h2>
      </div>

      {/* Workflow en cours */}
      {currentWorkflow && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white">Workflow en cours</h3>
            <span className={`px-2 py-1 rounded text-xs ${
              currentWorkflow.status === 'running' ? 'bg-blue-900 text-blue-300' :
              currentWorkflow.status === 'completed' ? 'bg-green-900 text-green-300' :
              currentWorkflow.status === 'failed' ? 'bg-red-900 text-red-300' :
              'bg-gray-800 text-gray-300'
            }`}>
              {currentWorkflow.status}
            </span>
          </div>
          
          <div className="space-y-2">
            {currentWorkflow.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded">
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : step.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : step.status === 'running' ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-gray-300">{step.name}</span>
                  {step.description && (
                    <p className="text-xs text-gray-500">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {currentWorkflow.progress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progression</span>
                <span>{Math.round(currentWorkflow.progress)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentWorkflow.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sélection de workflow */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
        <h3 className="font-medium text-white mb-4">Choisir un workflow</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {Object.entries(workflows).map(([key, workflow]) => (
            <button
              key={key}
              onClick={() => setSelectedWorkflow(selectedWorkflow === key ? null : key)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedWorkflow === key
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{workflow.icon}</span>
                <div>
                  <h4 className="font-medium text-white">{workflow.name}</h4>
                  <span className="text-xs text-purple-400">{workflow.category}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{workflow.description}</p>
              
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Étapes :</span>
                <div className="flex flex-wrap gap-1">
                  {workflow.steps.map((step, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded"
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedWorkflow && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description personnalisée (optionnel)
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Décrivez ce que vous souhaitez créer..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                rows={3}
              />
            </div>
            
            <button
              onClick={() => handleExecute(selectedWorkflow)}
              disabled={isExecuting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exécution en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Lancer le workflow
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};