import React, { useState } from 'react';
import { 
  Users, 
  MessageCircle, 
  Video, 
  Share2,
  UserPlus,
  Crown,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  Hand
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  avatar: string;
  isOwner?: boolean;
  isSpeaking?: boolean;
  hasCamera?: boolean;
  hasMic?: boolean;
}

interface AgentCollaborationProps {
  currentAgent: Agent;
  collaboratingAgents: Agent[];
  onInviteAgent: () => void;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onShareScreen: () => void;
}

export const AgentCollaboration: React.FC<AgentCollaborationProps> = ({
  currentAgent,
  collaboratingAgents,
  onInviteAgent,
  onStartVoiceCall,
  onStartVideoCall,
  onShareScreen
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const allAgents = [currentAgent, ...collaboratingAgents];

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Collaboration ({allAgents.length} agents)
        </h3>
        
        <div className="flex items-center gap-2">
          {!isCallActive ? (
            <>
              <button
                onClick={onStartVoiceCall}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Appel vocal"
              >
                <Mic className="w-4 h-4 text-white" />
              </button>
              
              <button
                onClick={onStartVideoCall}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Appel vidéo"
              >
                <Video className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setMicEnabled(!micEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  micEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {micEnabled ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
              </button>
              
              <button
                onClick={() => setCameraEnabled(!cameraEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  cameraEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {cameraEnabled ? <Camera className="w-4 h-4 text-white" /> : <CameraOff className="w-4 h-4 text-white" />}
              </button>
              
              <button
                onClick={onShareScreen}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                title="Partager l'écran"
              >
                <ScreenShare className="w-4 h-4 text-white" />
              </button>
            </>
          )}
          
          <button
            onClick={onInviteAgent}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Inviter un agent"
          >
            <UserPlus className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
      
      {/* Liste des agents */}
      <div className="space-y-3">
        {allAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-lg">
                {agent.avatar}
              </div>
              
              {/* Indicateur de statut */}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                agent.status === 'active' ? 'bg-green-400' :
                agent.status === 'busy' ? 'bg-orange-400' :
                'bg-gray-400'
              }`} />
              
              {/* Indicateur de parole */}
              {agent.isSpeaking && (
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-400 rounded-full animate-pulse flex items-center justify-center">
                  <Mic className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{agent.name}</span>
                {agent.isOwner && (
                  <Crown className="w-4 h-4 text-yellow-400" title="Propriétaire" />
                )}
                {agent.id === currentAgent.id && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Vous</span>
                )}
              </div>
              <p className="text-sm text-gray-400">{agent.role}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {isCallActive && (
                <>
                  {agent.hasMic && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="Micro activé" />
                  )}
                  {agent.hasCamera && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full" title="Caméra activée" />
                  )}
                </>
              )}
              
              <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                <MessageCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Zone de collaboration en temps réel */}
      {isCallActive && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-purple-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-white">Session collaborative active</span>
            </div>
            
            <button
              onClick={() => setIsCallActive(false)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Quitter
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            Tous les agents peuvent voir et modifier le code en temps réel
          </div>
        </div>
      )}
      
      {/* Actions rapides */}
      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" />
          Partager le projet
        </button>
        <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          <Hand className="w-4 h-4" />
          Demander aide
        </button>
      </div>
    </div>
  );
};
