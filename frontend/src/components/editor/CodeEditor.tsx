import React, { useState, useRef, useEffect } from 'react';
import { Play, Save, Copy, RotateCcw, Maximize2, Settings, FileText } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onSave: () => void;
  onRun: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  onSave,
  onRun
}) => {
  const [localCode, setLocalCode] = useState(code);
  const [isModified, setIsModified] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalCode(code);
    setIsModified(false);
  }, [code]);

  useEffect(() => {
    const lines = localCode.split('\n').length;
    setLineCount(lines);
  }, [localCode]);

  const handleCodeChange = (newCode: string) => {
    setLocalCode(newCode);
    setIsModified(newCode !== code);
    onChange(newCode);
  };

  const handleSave = () => {
    onSave();
    setIsModified(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      // Vous pourriez ajouter une notification ici
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const handleReset = () => {
    setLocalCode(code);
    setIsModified(false);
  };

  const getLanguageDisplay = (lang: string) => {
    const languages: Record<string, string> = {
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'markdown': 'Markdown',
      'python': 'Python',
      'text': 'Texte'
    };
    return languages[lang] || lang.toUpperCase();
  };

  const canRun = () => {
    const runnableLanguages = ['javascript', 'typescript', 'jsx', 'tsx', 'python'];
    return runnableLanguages.includes(language);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">Éditeur de code</span>
          <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded">
            {getLanguageDisplay(language)}
          </span>
          {isModified && (
            <span className="text-xs px-2 py-1 bg-orange-900 text-orange-300 rounded">
              Modifié
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
            title="Copier le code"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          {isModified && (
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Annuler les modifications"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={!isModified}
            className="p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
            title="Sauvegarder"
          >
            <Save className="w-4 h-4" />
          </button>
          
          {canRun() && (
            <button
              onClick={onRun}
              className="p-2 bg-green-700 hover:bg-green-600 rounded text-white transition-colors"
              title="Exécuter le code"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Éditeur */}
      <div className="flex flex-1 overflow-hidden">
        {/* Numéros de ligne */}
        <div className="bg-gray-800 border-r border-gray-700 px-2 py-3 text-xs text-gray-500 select-none">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="leading-6 text-right">
              {i + 1}
            </div>
          ))}
        </div>
        
        {/* Zone de code */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={localCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-full bg-transparent text-gray-300 font-mono text-sm p-3 resize-none focus:outline-none leading-6"
            placeholder="Tapez votre code ici..."
            spellCheck={false}
            style={{
              tabSize: 2,
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
            }}
            onKeyDown={(e) => {
              // Gestion de la tabulation
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newCode = localCode.substring(0, start) + '  ' + localCode.substring(end);
                handleCodeChange(newCode);
                
                // Repositionner le curseur
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                  }
                }, 0);
              }
              
              // Sauvegarde rapide Ctrl+S
              if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>
      </div>
      
      {/* Footer avec stats */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{lineCount} ligne{lineCount > 1 ? 's' : ''}</span>
          <span>{localCode.length} caractère{localCode.length > 1 ? 's' : ''}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {canRun() && (
            <span className="text-green-400">Exécutable</span>
          )}
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};