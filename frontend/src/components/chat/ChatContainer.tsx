import React, { useState, useCallback } from 'react';
import ChatHistory from './ChatHistory';
import ChatPanel from './ChatPanel';

interface ChatContainerProps {
  projectId?: string;
  agentId?: string;
  initialConversationId?: string;
}

export default function ChatContainer({
  projectId = "default-project",
  agentId = "assistant",
  initialConversationId
}: ChatContainerProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [chatKey, setChatKey] = useState(0); // Pour forcer le re-render du ChatPanel

  // Gérer la sélection d'une conversation
  const handleConversationSelect = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setChatKey(prev => prev + 1); // Forcer le ChatPanel à se recharger avec la nouvelle conversation
  }, []);

  // Gérer la création d'une nouvelle conversation
  const handleNewConversation = useCallback(() => {
    setChatKey(prev => prev + 1); // Forcer le ChatPanel à se recharger
  }, []);

  return (
    <div className="flex h-screen bg-[#0f1419]">
      {/* Sidebar - ChatHistory */}
      <ChatHistory
        projectId={projectId}
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />
      
      {/* Panel principal - ChatPanel */}
      <div className="flex-1 flex flex-col">
        <ChatPanel
          key={chatKey} // Force re-render quand on change de conversation
          agentId={agentId}
          projectId={projectId}
          conversationId={currentConversationId}
          enablePersistence={true} // Activé pour persister les conversations
          onConversationChange={setCurrentConversationId}
        />
      </div>
    </div>
  );
}