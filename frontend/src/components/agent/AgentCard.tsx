import React from 'react';
import { MessageSquare, Clock, Zap, User } from 'lucide-react';

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
      case 'active':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'idle':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'busy':
        return 'Occupé';
      case 'idle':
        return 'Inactif';
      default:
        return 'Inconnu';
    }
  };

  const formatLastActivity = (timestamp?: string) => {
    if (!timestamp) return 'Jamais';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `il y a ${diffMins}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    return `il y a ${diffDays}j`;
  };

  return (
    <div
      onClick={() => onSelect(agent)}
      className={`bg-gray-900 rounded-lg border p-6 cursor-pointer transition-all hover:shadow-lg ${
        isSelected 
          ? 'border-purple-500 bg-purple-900/20' 
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      {/* Header avec avatar et statut */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
            {agent.avatar}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${getStatusColor(agent.status)}`} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-white">{agent.name}</h3>
          <p className="text-sm text-gray-400">{agent.role}</p>
          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
            agent.status === 'active' ? 'bg-green-900 text-green-300' :
            agent.status === 'busy' ? 'bg-yellow-900 text-yellow-300' :
            'bg-gray-800 text-gray-300'
          }`}>
            {getStatusText(agent.status)}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-4 line-clamp-2">
        {agent.description}
      </p>

      {/* Capacités */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Capacités</h4>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 4).map((capability) => (
            <span
              key={capability}
              className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 4 && (
            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
              +{agent.capabilities.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Dernière activité */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Clock className="w-3 h-3" />
        <span>Dernière activité : {formatLastActivity(agent.lastActivity)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartChat(agent);
          }}
          disabled={agent.status === 'busy'}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          {agent.status === 'busy' ? 'Occupé' : 'Discuter'}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(agent);
          }}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${
            isSelected
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};