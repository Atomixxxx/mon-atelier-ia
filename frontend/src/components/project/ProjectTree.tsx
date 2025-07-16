import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, Edit3 } from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  content?: string;
  language?: string;
}

interface ProjectTreeProps {
  tree: TreeNode[];
  selectedFileId: string | null;
  onFileSelect: (file: TreeNode) => void;
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const startRename = (file: TreeNode) => {
    setRenamingFile(file.id);
    setNewName(file.name);
  };

  const confirmRename = () => {
    if (renamingFile && newName.trim()) {
      onFileRename(renamingFile, newName.trim());
    }
    setRenamingFile(null);
    setNewName('');
  };

  const cancelRename = () => {
    setRenamingFile(null);
    setNewName('');
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFileId === node.id;
    const isRenaming = renamingFile === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-purple-600/20 border-l-2 border-purple-500' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (node.type === 'file') {
              onFileSelect(node);
            } else {
              toggleFolder(node.id);
            }
          }}
        >
          {node.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
              className="hover:bg-gray-700 p-1 rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          
          <div className="flex-1 flex items-center gap-2">
            {node.type === 'folder' ? (
              isExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              <File className="w-4 h-4 text-gray-400" />
            )}
            
            {isRenaming ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && confirmRename()}
                onBlur={confirmRename}
                className="bg-gray-800 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                autoFocus
              />
            ) : (
              <span className="text-sm text-gray-300">{node.name}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startRename(node);
              }}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <Edit3 className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileDelete(node.id);
              }}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Explorateur</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onFileCreate(null, 'file')}
            className="p-1 hover:bg-gray-700 rounded"
            title="Nouveau fichier"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => onFileCreate(null, 'folder')}
            className="p-1 hover:bg-gray-700 rounded"
            title="Nouveau dossier"
          >
            <Folder className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      <div className="p-2 max-h-96 overflow-y-auto">
        {tree.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
};