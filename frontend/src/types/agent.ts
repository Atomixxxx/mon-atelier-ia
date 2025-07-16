export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  capabilities?: string[];
}
