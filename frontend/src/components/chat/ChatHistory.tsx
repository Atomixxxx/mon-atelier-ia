import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock,
  Hash,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { conversationService, ConversationSummary } from '@/services/conversationService';

interface ChatHistoryProps {
  projectId: string;
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

export default function ChatHistory({
  projectId,
  currentConversationId,
  onConversationSelect,
  onNewConversation
}: ChatHistoryProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, [projectId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await conversationService.getConversationsByProject(projectId);
      setConversations(convs);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les conversations selon la recherche
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouper par date
  const groupedConversations = React.useMemo(() => {
    const groups: { [key: string]: ConversationSummary[] } = {};
    
    filteredConversations.forEach(conv => {
      const date = new Date(conv.lastUpdated);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Aujourd'hui";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Hier";
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        groupKey = "Cette semaine";
      } else {
        groupKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(conv);
    });
    
    return groups;
  }, [filteredConversations]);

  const handleNewConversation = async () => {
    try {
      const newConv = await conversationService.createConversation(projectId);
      setConversations(prev => [
        {
          id: newConv.id,
          title: newConv.title,
          summary: '',
          lastMessage: '',
          lastUpdated: newConv.createdAt,
          messageCount: 0
        },
        ...prev
      ]);
      onConversationSelect(newConv.id);
      onNewConversation();
    } catch (error) {
      console.error('Erreur création conversation:', error);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette conversation ?')) return;
    
    try {
      await conversationService.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      
      // Si c'était la conversation courante, créer une nouvelle
      if (currentConversationId === convId) {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Erreur suppression conversation:', error);
    }
  };

  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      await conversationService.renameConversation(convId, newTitle);
      setConversations(prev => prev.map(c => 
        c.id === convId ? { ...c, title: newTitle } : c
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Erreur renommage conversation:', error);
    }
  };

  const startEditing = (conv: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1d1e] border-r border-[#2a2d2e] w-80">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2d2e]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <MessageSquare size={20} />
            Conversations
          </h2>
          <button
            onClick={handleNewConversation}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            title="Nouvelle conversation"
          >
            <Plus size={16} className="text-white" />
          </button>
        </div>
        
        {/* Barre de recherche */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2a2d2e] border border-[#3a3d3e] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">
            Chargement...
          </div>
        ) : Object.keys(groupedConversations).length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
          </div>
        ) : (
          Object.entries(groupedConversations).map(([group, convs]) => (
            <div key={group} className="mb-4">
              {/* Groupe header */}
              <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {group}
              </div>
              
              {/* Conversations du groupe */}
              {convs.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onConversationSelect(conv.id)}
                  className={clsx(
                    "mx-2 mb-1 p-3 rounded-lg cursor-pointer transition-all group hover:bg-[#2a2d2e]",
                    currentConversationId === conv.id 
                      ? "bg-purple-600/20 border border-purple-500/30" 
                      : "hover:bg-[#2a2d2e]"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Titre */}
                      {editingId === conv.id ? (
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameConversation(conv.id, editTitle)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameConversation(conv.id, editTitle);
                            }
                          }}
                          className="w-full bg-[#1a1d1e] border border-purple-500 rounded px-2 py-1 text-sm text-white"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-white text-sm font-medium truncate">
                            {conv.title}
                          </h3>
                          {currentConversationId === conv.id && (
                            <ChevronRight size={14} className="text-purple-400" />
                          )}
                        </div>
                      )}
                      
                      {/* Résumé */}
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                        {conv.summary || conv.lastMessage || 'Nouvelle conversation'}
                      </p>
                      
                      {/* Métadonnées */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(new Date(conv.lastUpdated))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Hash size={12} />
                          {conv.messageCount}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(conv, e)}
                        className="p-1 hover:bg-[#3a3d3e] rounded"
                        title="Renommer"
                      >
                        <Edit3 size={12} className="text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 hover:bg-red-500/20 rounded"
                        title="Supprimer"
                      >
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}