import React, { useState } from 'react';
import { Play, Pause, Square, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface WorkflowPanelProps {
  workflows: Record<string, any>;
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
  const [description, setDescription] = useState('');

  const handleExecute = () => {
    if (selectedWorkflow && description.trim()) {
      onExecute(selectedWorkflow, description);
      setDescription('');
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <Play className="w-5 h-5 text-purple-400" />
        Workflows IA
      </h2>

      {/* Sélection du workflow */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-300">Choisir un workflow</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(workflows).map(([key, workflow]) => (
            <button
              key={key}
              onClick={() => setSelectedWorkflow(key)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedWorkflow === key
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              }`}
            >
              <div className="text-left">
                <p className="font-medium text-white">{workflow.name}</p>
                <p className="text-sm text-gray-400 mt-1">{workflow.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description de la tâche */}
      {selectedWorkflow && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-300">Description de la tâche</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce que vous voulez créer..."
            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
          />
          <button
            onClick={handleExecute}
            disabled={isExecuting || !description.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* Progression du workflow */}
      {currentWorkflow && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-300">Progression</h3>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium">{currentWorkflow.description}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{currentWorkflow.progress}%</span>
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentWorkflow.progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {currentWorkflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg"
                >
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <p className="text-white font-medium">{step.name}</p>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                  {step.result && (
                    <button className="text-purple-400 hover:text-purple-300 text-sm">
                      Voir résultat
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};