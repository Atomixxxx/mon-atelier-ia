export interface ChatContext {
  summary?: string;
  recentMessages?: Array<{
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  }>;
  codeContext?: string[];
  objectives?: string[];
  currentFiles?: string[];
}

export interface SendMessageOptions {
  agentId?: string;
  context?: ChatContext;
  conversationId?: string;
  projectId?: string;
  executeCode?: boolean;
  language?: string;
}

export interface AgentResponse {
  response: string;
  metadata?: {
    executionResult?: any;
    suggestedActions?: string[];
    codeGenerated?: boolean;
    filesModified?: string[];
  };
}

export class APIClient {
  private baseURL: string;
  
  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Workflows
  async getAvailableWorkflows() {
    return this.request('/workflows/available');
  }

  async startWorkflow(workflowType: string, description: string) {
    return this.request('/workflows/start', {
      method: 'POST',
      body: JSON.stringify({
        workflow_type: workflowType,
        description: description
      })
    });
  }

  async getWorkflowStatus(workflowId: string) {
    return this.request(`/workflows/${workflowId}/status`);
  }

  async stopWorkflow(workflowId: string) {
    return this.request(`/workflows/${workflowId}/stop`, {
      method: 'POST'
    });
  }

  // Chat / Agents (AMÉLIORÉ)
  async sendMessage(
    message: string, 
    agentId?: string, 
    options?: Omit<SendMessageOptions, 'agentId'>
  ): Promise<AgentResponse> {
    const payload = {
      message,
      agent: agentId || 'assistant',
      ...(options?.context && { context: options.context }),
      ...(options?.conversationId && { conversation_id: options.conversationId }),
      ...(options?.projectId && { project_id: options.projectId }),
      ...(options?.executeCode && { execute_code: options.executeCode }),
      ...(options?.language && { language: options.language })
    };

    return this.request('/agent', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Méthode simplifiée pour compatibilité
  async sendMessageSimple(message: string, agentId?: string): Promise<AgentResponse> {
    return this.sendMessage(message, agentId);
  }

  // Nouvelle méthode pour l'exécution de code
  async executeCode(
    code: string, 
    language: string, 
    agentId?: string,
    context?: ChatContext
  ): Promise<AgentResponse> {
    return this.request('/agent/execute', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        agent: agentId || 'code-assistant',
        context
      })
    });
  }

  // Nouvelle méthode pour l'analyse de code
  async analyzeCode(
    code: string, 
    language: string, 
    analysisType: 'review' | 'optimize' | 'debug' | 'explain' = 'review'
  ): Promise<AgentResponse> {
    return this.request('/agent/analyze', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        analysis_type: analysisType
      })
    });
  }

  // Nouvelle méthode pour la génération de code
  async generateCode(
    description: string,
    language: string,
    context?: ChatContext
  ): Promise<AgentResponse> {
    return this.request('/agent/generate', {
      method: 'POST',
      body: JSON.stringify({
        description,
        language,
        context
      })
    });
  }

  async getAgents() {
    return this.request('/agents');
  }

  async getAgentCapabilities(agentId: string) {
    return this.request(`/agents/${agentId}/capabilities`);
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectData: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`);
  }

  async updateProject(projectId: string, projectData: any) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // Files
  async saveFile(projectId: string, fileData: any) {
    return this.request(`/projects/${projectId}/files`, {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
  }

  async getFile(projectId: string, filePath: string) {
    return this.request(`/projects/${projectId}/files/${encodeURIComponent(filePath)}`);
  }

  async updateFile(projectId: string, filePath: string, content: string) {
    return this.request(`/projects/${projectId}/files/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async deleteFile(projectId: string, filePath: string) {
    return this.request(`/projects/${projectId}/files/${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    });
  }

  async getProjectFiles(projectId: string) {
    return this.request(`/projects/${projectId}/files`);
  }

  // Nouvelles méthodes pour les conversations (si backend supporte)
  async getConversations(projectId?: string) {
    const params = projectId ? `?project_id=${projectId}` : '';
    return this.request(`/conversations${params}`);
  }

  async createConversation(projectId: string, title?: string) {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        title: title || `Conversation ${new Date().toLocaleString()}`
      })
    });
  }

  async getConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}`);
  }

  async updateConversation(conversationId: string, data: any) {
    return this.request(`/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}`, {
      method: 'DELETE'
    });
  }

  // Méthodes utilitaires
  async healthCheck() {
    return this.request('/health');
  }

  async getSystemStatus() {
    return this.request('/system/status');
  }

  async getAvailableModels() {
    return this.request('/models/available');
  }

  async switchModel(modelName: string) {
    return this.request('/models/switch', {
      method: 'POST',
      body: JSON.stringify({ model: modelName })
    });
  }
}

export const apiClient = new APIClient();