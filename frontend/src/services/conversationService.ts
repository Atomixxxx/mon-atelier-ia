// services/conversationService.ts

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    codeSnippets?: string[];
    fileReferences?: string[];
    executionResult?: any;
  };
}

export interface ConversationContext {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  messages: Message[];
  createdAt: Date;
  lastUpdated: Date;
  metadata: {
    codeContext: string[];
    currentFiles: string[];
    objectives: string[];
    totalMessages: number;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  lastMessage: string;
  lastUpdated: Date;
  messageCount: number;
}

class ConversationService {
  private static instance: ConversationService;
  private conversations: Map<string, ConversationContext> = new Map();
  private readonly STORAGE_KEY = 'ai_conversations';
  private readonly MAX_CONTEXT_LENGTH = 4000; // tokens
  private readonly MAX_MESSAGES_IN_MEMORY = 50;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  // === CONVERSATION MANAGEMENT ===

  async createConversation(projectId: string, title?: string): Promise<ConversationContext> {
    const conversation: ConversationContext = {
      id: this.generateId(),
      projectId,
      title: title || `Conversation ${new Date().toLocaleString()}`,
      summary: '',
      messages: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
      metadata: {
        codeContext: [],
        currentFiles: [],
        objectives: [],
        totalMessages: 0
      }
    };

    this.conversations.set(conversation.id, conversation);
    await this.saveToStorage();
    return conversation;
  }

  async getConversation(conversationId: string): Promise<ConversationContext | null> {
    return this.conversations.get(conversationId) || null;
  }

  async getConversationsByProject(projectId: string): Promise<ConversationSummary[]> {
    const conversations = Array.from(this.conversations.values())
      .filter(conv => conv.projectId === projectId)
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      summary: conv.summary || this.generateSummary(conv.messages),
      lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
      lastUpdated: conv.lastUpdated,
      messageCount: conv.messages.length
    }));
  }

  async deleteConversation(conversationId: string): Promise<void> {
    this.conversations.delete(conversationId);
    await this.saveToStorage();
  }

  async renameConversation(conversationId: string, newTitle: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.title = newTitle;
      conversation.lastUpdated = new Date();
      await this.saveToStorage();
    }
  }

  // === MESSAGE MANAGEMENT ===

  async addMessage(conversationId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newMessage: Message = {
      id: this.generateId(),
      timestamp: new Date(),
      ...message
    };

    conversation.messages.push(newMessage);
    conversation.lastUpdated = new Date();
    conversation.metadata.totalMessages++;

    // Compression si trop de messages
    if (conversation.messages.length > this.MAX_MESSAGES_IN_MEMORY) {
      await this.compressConversation(conversationId);
    }

    await this.saveToStorage();
    return newMessage;
  }

  async getConversationContext(conversationId: string): Promise<{
    recentMessages: Message[];
    summary: string;
    codeContext: string[];
  } | null> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    return {
      recentMessages: conversation.messages.slice(-10), // 10 derniers messages
      summary: conversation.summary,
      codeContext: conversation.metadata.codeContext
    };
  }

  // === SEARCH & FILTERS ===

  async searchConversations(query: string, projectId?: string): Promise<ConversationSummary[]> {
    const conversations = Array.from(this.conversations.values())
      .filter(conv => {
        const matchesProject = !projectId || conv.projectId === projectId;
        const matchesQuery = 
          conv.title.toLowerCase().includes(query.toLowerCase()) ||
          conv.summary.toLowerCase().includes(query.toLowerCase()) ||
          conv.messages.some(msg => msg.content.toLowerCase().includes(query.toLowerCase()));
        
        return matchesProject && matchesQuery;
      })
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      summary: conv.summary || this.generateSummary(conv.messages),
      lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
      lastUpdated: conv.lastUpdated,
      messageCount: conv.messages.length
    }));
  }

  // === CONTEXT MANAGEMENT ===

  async updateCodeContext(conversationId: string, files: string[]): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.metadata.currentFiles = files;
      conversation.lastUpdated = new Date();
      await this.saveToStorage();
    }
  }

  async addObjective(conversationId: string, objective: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.metadata.objectives.push(objective);
      conversation.lastUpdated = new Date();
      await this.saveToStorage();
    }
  }

  // === PRIVATE METHODS ===

  private async compressConversation(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    // Garder les 20 derniers messages
    const recentMessages = conversation.messages.slice(-20);
    const oldMessages = conversation.messages.slice(0, -20);

    // Générer un résumé des anciens messages
    const oldSummary = this.generateSummary(oldMessages);
    
    // Mettre à jour le résumé global
    conversation.summary = conversation.summary 
      ? `${conversation.summary}\n\n${oldSummary}`
      : oldSummary;

    // Garder seulement les messages récents
    conversation.messages = recentMessages;
    
    await this.saveToStorage();
  }

  private generateSummary(messages: Message[]): string {
    if (messages.length === 0) return '';
    
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (userMessages.length <= 3) {
      return userMessages.map(m => m.content.substring(0, 100)).join(' | ');
    }
    
    return `Discussion sur ${userMessages.length} sujets. Dernier: ${lastUserMessage?.content.substring(0, 100)}...`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = Array.from(this.conversations.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.conversations = new Map(parsed.map(([id, conv]: [string, any]) => [
          id,
          {
            ...conv,
            createdAt: new Date(conv.createdAt),
            lastUpdated: new Date(conv.lastUpdated),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }
        ]));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.conversations = new Map();
    }
  }
}

// Export du singleton
export const conversationService = ConversationService.getInstance();