export * from './agent';
export * from './project';
export * from './workflow';
export * from './api';

export interface WorkflowStep {
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
  outputData?: unknown;
}

export interface WorkflowResult {
  id: string;
  type: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  steps: WorkflowStep[];
  results: Record<string, unknown>;
  startTime: string;
  endTime?: string;
  progress: number;
  currentStep: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
  avatar: string;
  description: string;
  capabilities: string[];
  lastActivity?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: 'frontend' | 'backend' | 'fullstack';
  status: 'active' | 'completed' | 'draft';
  files: ProjectFile[];
  lastModified: string;
  createdAt: string;
  technologies: string[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  size?: number;
  children?: ProjectFile[];
  parentId?: string;
  path: string;
  lastModified: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agentId?: string;
  timestamp: string;
  type: 'text' | 'code' | 'file' | 'image';
  metadata?: unknown;
}

export interface ConsoleLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  timestamp: string;
  source?: string;
  details?: unknown;
}

export type Theme = 'dark' | 'light';
export type View = 'chat' | 'projects' | 'agents' | 'settings';
export type Layout = 'sidebar' | 'fullscreen' | 'split';