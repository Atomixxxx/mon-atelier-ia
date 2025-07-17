import { useState, useCallback, useEffect } from 'react';

const API_URL = "http://localhost:8000/chat";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agentId?: string;
  timestamp: string;
  type: 'text' | 'code' | 'file' | 'image';
  metadata?: any;
}

interface UseChatOptions {
  agentId?: string;
  projectId?: string;
  conversationId?: string;
  autoSave?: boolean;
}

// Fonction utilitaire pour générer des IDs
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useChat = ({ 
  agentId = "assistant", 
  projectId = "default-project", 
  conversationId,
  autoSave = false
}: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<any>({
    recentMessages: [],
    summary: "",
    codeContext: [],
    objectives: [],
    projectId: projectId,
    conversationId: conversationId || generateId(),
    messageCount: 0
  });
  const [currentConversationId] = useState<string>(conversationId || generateId());

  // Fonction pour envoyer un message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      content,
      sender: 'user',
      agentId,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Construire le contexte pour l'API
      const apiContext = {
        summary: context.summary || "",
        recentMessages: messages.slice(-5).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        })),
        codeContext: context.codeContext || [],
        objectives: context.objectives || [],
        projectId: projectId,
        conversationId: currentConversationId,
        messageCount: messages.length + 1
      };

      console.log('Sending to API:', {
        message: content,
        agent: agentId,
        context: apiContext
      });

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: content,
          agent: agentId,
          context: apiContext,
          project_id: projectId,
          conversation_id: currentConversationId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Erreur inconnue" }));
        throw new Error(errorData.detail || `Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      const agentMessage: ChatMessage = {
        id: generateId(),
        content: data.response || "Pas de réponse",
        sender: 'agent',
        agentId: agentId,
        timestamp: new Date().toISOString(),
        type: 'text',
        metadata: data.metadata
      };

      setMessages(prev => [...prev, agentMessage]);
      
      // Mettre à jour le contexte avec la réponse du backend
      if (data.context) {
        setContext(prevContext => ({
          ...prevContext,
          ...data.context,
          lastInteraction: new Date().toISOString()
        }));
      }

    } catch (err: any) {
      console.error('Chat error details:', err);
      setError(err.message || "Erreur lors de l'envoi du message");
      
      // Ajouter un message d'erreur visible
      const errorMessage: ChatMessage = {
        id: generateId(),
        content: `Erreur: ${err.message}`,
        sender: 'agent',
        agentId,
        timestamp: new Date().toISOString(),
        type: 'text',
        metadata: { error: true }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, projectId, currentConversationId, messages, context]);

  // Fonction pour effacer les messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setContext({
      recentMessages: [],
      summary: "",
      codeContext: [],
      objectives: [],
      projectId: projectId,
      conversationId: generateId(),
      messageCount: 0
    });
    setError(null);
  }, [projectId]);

  // Fonction pour supprimer un message
  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Fonction pour mettre à jour le contexte de code
  const updateCodeContext = useCallback((files: string[]) => {
    setContext(prev => ({
      ...prev,
      codeContext: files,
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  // Fonction pour ajouter un objectif
  const addObjective = useCallback((objective: string) => {
    setContext(prev => ({
      ...prev,
      objectives: [...(prev.objectives || []), objective]
    }));
  }, []);

  // Fonction pour changer de conversation
  const switchConversation = useCallback(async (newConversationId: string) => {
    setMessages([]);
    setContext(prev => ({
      ...prev,
      conversationId: newConversationId,
      recentMessages: [],
      messageCount: 0
    }));
    setError(null);
    console.log('Switched to conversation:', newConversationId);
  }, []);

  return {
    // Interface compatible
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    deleteMessage,
    
    // Nouvelles fonctionnalités
    conversationId: currentConversationId,
    conversation: null,
    updateCodeContext,
    addObjective,
    switchConversation,
    
    // Métadonnées
    hasContext: Object.keys(context).length > 0,
    messageCount: messages.length,
    context,
    conversationLoaded: true
  };
};

// Version simple pour compatibilité
export const useChatSimple = (agentId?: string) => {
  return useChat({
    agentId,
    projectId: "temp-project",
    autoSave: false
  });
};