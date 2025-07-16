import React from 'react';
import { MessageSquare, Zap, User } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  avatar: string;
  description: string;
  capabilities: string[];
  lastActivity?: string;
}

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (agent: Agent) => void;
  onStartChat: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  onSelect,
  onStartChat
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-orange-500';
      case 'idle': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Disponible';
      case 'busy': return 'Occupé';
      case 'idle': return 'Inactif';
      default: return 'Hors ligne';
    }
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-700 ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      }`}
      onClick={() => onSelect(agent)}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-2xl">
            {agent.avatar}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(agent.status)} border-2 border-gray-800`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">{agent.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
              agent.status === 'busy' ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {getStatusText(agent.status)}
            </span>
          </div>
          
          <p className="text-sm text-gray-400 mt-1">{agent.role}</p>
          <p className="text-xs text-gray-500 mt-2">{agent.description}</p>
          
          <div className="flex flex-wrap gap-1 mt-3">
            {agent.capabilities.slice(0, 3).map((cap, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300"
              >
                {cap}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300">
                +{agent.capabilities.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartChat(agent);
          }}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Discuter
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          Workflow
        </button>
      </div>
    </div>
  );
};