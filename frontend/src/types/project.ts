export interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: ProjectFile[];
}
