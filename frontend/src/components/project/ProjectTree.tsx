import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, File, Folder, FolderOpen, 
  Plus, MoreHorizontal, Edit3, Trash2, FileText, Code 
} from 'lucide-react';

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

interface ProjectTreeProps {
  tree: ProjectFile[];
  selectedFileId: string | null;
  onFileSelect: (file: ProjectFile) => void;
  onFileCreate: (parentId: string | null, type: 'file' | 'folder') => void;
  onFileDelete: (fileId: string) => void;
  onFileRename: (fileId: string, newName: string) => void;
}

export const ProjectTree: React.FC<ProjectTreeProps> = ({
  tree,
  selectedFileId,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? (
        <FolderOpen className="w-4 h-4 text-blue-400" />
      ) : (
        <Folder className="w-4 h-4 text-blue-400" />
      );
    }

    // Icônes selon l'extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'jsx':
      case 'js':
      case 'ts':
        return <Code className="w-4 h-4 text-yellow-400" />;
      case 'json':
        return <FileText className="w-4 h-4 text-green-400" />;
      case 'css':
      case 'scss':
        return <FileText className="w-4 h-4 text-pink-400" />;
      case 'html':
        return <FileText className="w-4 h-4 text-orange-400" />;
      case 'md':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  const handleRename = (fileId: string, currentName: string) => {
    setEditingFile(fileId);
    setEditName(currentName);
    setContextMenu(null);
  };

  const confirmRename = () => {
    if (editingFile && editName.trim()) {
      onFileRename(editingFile, editName.trim());
    }
    setEditingFile(null);
    setEditName('');
  };

  const renderFile = (file: ProjectFile, level: number = 0) => {
    const isSelected = selectedFileId === file.id;
    const isExpanded = expandedFolders.has(file.id);
    const isEditing = editingFile === file.id;

    return (
      <div key={file.id}>
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-purple-600 text-white' : 'hover:bg-gray-800 text-gray-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, file.id)}
        >
          {file.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(file.id);
              }}
              className="p-0.5 hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          {getFileIcon(file)}
          
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={confirmRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') {
                  setEditingFile(null);
                  setEditName('');
                }
              }}
              className="flex-1 bg-gray-700 text-white px-1 py-0.5 rounded text-sm focus:outline-none focus:bg-gray-600"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-sm truncate">{file.name}</span>
          )}
          
          {file.type === 'file' && file.size && (
            <span className="text-xs text-gray-500">
              {Math.round(file.size / 1024)}KB
            </span>
          )}
        </div>
        
        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map((child) => renderFile(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="font-medium text-white">Fichiers du projet</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onFileCreate(null, 'folder')}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            title="Nouveau dossier"
          >
            <Folder className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFileCreate(null, 'file')}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            title="Nouveau fichier"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Folder className="w-8 h-8 mb-2" />
            <p className="text-sm">Aucun fichier</p>
            <button
              onClick={() => onFileCreate(null, 'file')}
              className="text-xs text-purple-400 hover:text-purple-300 mt-1"
            >
              Créer un fichier
            </button>
          </div>
        ) : (
          tree.map((file) => renderFile(file))
        )}
      </div>
      
      {/* Menu contextuel */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-20 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 min-w-32"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const file = tree.find(f => f.id === contextMenu.fileId);
                if (file) handleRename(file.id, file.name);
              }}
              className="w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit3 className="w-3 h-3" />
              Renommer
            </button>
            <button
              onClick={() => {
                onFileDelete(contextMenu.fileId);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
};