import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface ProjectFile {
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

export const useFileManager = (projectId: string) => {
  const [files, setFiles] = useLocalStorage<ProjectFile[]>(`project_${projectId}_files`, []);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [openTabs, setOpenTabs] = useState<ProjectFile[]>([]);

  const createFile = useCallback((name: string, parentId?: string, type: 'file' | 'folder' = 'file') => {
    const newFile: ProjectFile = {
      id: generateId(),
      name,
      type,
      content: type === 'file' ? '' : undefined,
      language: type === 'file' ? getLanguageFromExtension(name) : undefined,
      children: type === 'folder' ? [] : undefined,
      parentId,
      path: parentId ? `${findFileById(files, parentId)?.path}/${name}` : `/${name}`,
      lastModified: new Date().toISOString(),
      size: 0
    };

    if (parentId) {
      setFiles(prev => updateFileInTree(prev, parentId, (parent) => ({
        ...parent,
        children: [...(parent.children || []), newFile]
      })));
    } else {
      setFiles(prev => [...prev, newFile]);
    }

    return newFile;
  }, [files, setFiles]);

  const updateFile = useCallback((fileId: string, updates: Partial<ProjectFile>) => {
    setFiles(prev => updateFileInTree(prev, fileId, (file) => ({
      ...file,
      ...updates,
      lastModified: new Date().toISOString(),
      size: updates.content ? new Blob([updates.content]).size : file.size
    })));
  }, [setFiles]);

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => removeFileFromTree(prev, fileId));
    setOpenTabs(prev => prev.filter(tab => tab.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  }, [setFiles, selectedFile]);

  const openFile = useCallback((file: ProjectFile) => {
    if (file.type === 'folder') return;

    setSelectedFile(file);
    setOpenTabs(prev => {
      if (prev.find(tab => tab.id === file.id)) {
        return prev;
      }
      return [...prev, file];
    });
  }, []);

  const closeTab = useCallback((fileId: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== fileId));
    if (selectedFile?.id === fileId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== fileId);
      setSelectedFile(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1] : null);
    }
  }, [selectedFile, openTabs]);

  const findFileById = (fileList: ProjectFile[], id: string): ProjectFile | null => {
    for (const file of fileList) {
      if (file.id === id) return file;
      if (file.children) {
        const found = findFileById(file.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateFileInTree = (
    fileList: ProjectFile[], 
    id: string, 
    updater: (file: ProjectFile) => ProjectFile
  ): ProjectFile[] => {
    return fileList.map(file => {
      if (file.id === id) {
        return updater(file);
      }
      if (file.children) {
        return { ...file, children: updateFileInTree(file.children, id, updater) };
      }
      return file;
    });
  };

  const removeFileFromTree = (fileList: ProjectFile[], id: string): ProjectFile[] => {
    return fileList.filter(file => {
      if (file.id === id) return false;
      if (file.children) {
        file.children = removeFileFromTree(file.children, id);
      }
      return true;
    });
  };

  return {
    files,
    selectedFile,
    openTabs,
    createFile,
    updateFile,
    deleteFile,
    openFile,
    closeTab,
    setSelectedFile
  };
};