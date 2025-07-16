export const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    'javascript': 'text-yellow-400',
    'typescript': 'text-blue-400',
    'python': 'text-green-400',
    'html': 'text-orange-400',
    'css': 'text-purple-400',
    'json': 'text-gray-400',
    'markdown': 'text-gray-300',
    'sql': 'text-pink-400',
    'bash': 'text-green-300',
    'php': 'text-purple-300',
    'java': 'text-red-400',
    'cpp': 'text-blue-300',
    'rust': 'text-orange-300',
    'go': 'text-cyan-400'
  };
  return colors[language] || 'text-gray-400';
};

export const getLanguageIcon = (language: string): string => {
  const icons: Record<string, string> = {
    'javascript': '🟨',
    'typescript': '🔷',
    'python': '🐍',
    'html': '🌐',
    'css': '🎨',
    'json': '📋',
    'markdown': '📝',
    'sql': '🗃️',
    'bash': '⚡',
    'php': '🐘',
    'java': '☕',
    'cpp': '⚙️',
    'rust': '🦀',
    'go': '🐹'
  };
  return icons[language] || '📄';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const timeAgo = (timestamp: string): string => {
  const now = new Date().getTime();
  const time = new Date(timestamp).getTime();
  const diffInSeconds = (now - time) / 1000;
  
  if (diffInSeconds < 60) return 'À l\'instant';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}j`;
};