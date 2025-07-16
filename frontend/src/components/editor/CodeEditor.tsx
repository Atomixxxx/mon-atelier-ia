import React, { useRef, useEffect } from 'react';
import { Play, Save, Download, Copy, Maximize2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  onRun?: () => void;
  onSave?: () => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  onRun,
  onSave,
  readOnly = false
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        onSave?.();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onRun?.();
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-400 ml-2">{language}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Copier"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={downloadCode}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4 text-gray-400" />
          </button>
          {onSave && (
            <button
              onClick={onSave}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Sauvegarder (Ctrl+S)"
            >
              <Save className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {onRun && (
            <button
              onClick={onRun}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Exécuter (Ctrl+Enter)"
            >
              <Play className="w-4 h-4 text-green-400" />
            </button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-64 bg-gray-900 text-white p-4 font-mono text-sm resize-none focus:outline-none"
          placeholder="Votre code ici..."
          readOnly={readOnly}
          style={{
            lineHeight: '1.5',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace'
          }}
        />
        
        {/* Syntax highlighting placeholder */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Ici on pourrait intégrer Monaco Editor ou Prism.js */}
        </div>
      </div>
    </div>
  );
};