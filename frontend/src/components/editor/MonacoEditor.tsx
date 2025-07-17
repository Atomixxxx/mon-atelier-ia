import React, { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  Download, 
  Copy, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Settings,
  FileText
} from 'lucide-react';

interface MonacoCodeEditorProps {
  value: string;
  language: string;
  theme?: 'atelier-dark' | 'vs-dark' | 'light';
  onChange: (value: string) => void;
  onSave?: () => void;
  onRun?: () => void;
  readOnly?: boolean;
  height?: string;
  showMinimap?: boolean;
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value,
  language,
  theme = 'atelier-dark',
  onChange,
  onSave,
  onRun,
  readOnly = false,
  height = '400px',
  showMinimap = false,
  showLineNumbers = true,
  wordWrap = true,
  fontSize = 14
}) => {
  const editorRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // State des settings (contrôlés)
  const [settings, setSettings] = useState({
    fontSize,
    theme,
    minimap: showMinimap,
    wordWrap,
  });
  // Position curseur
  const [editorPosition, setEditorPosition] = useState({ line: 1, column: 1 });

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Thème custom (une seule fois suffit)
    if (!monaco.editor.getThemes().some((t: any) => t.themeName === 'atelier-dark')) {
      monaco.editor.defineTheme('atelier-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'type', foreground: '4EC9B0' },
          { token: 'class', foreground: '4FC1FF', fontStyle: 'bold' },
          { token: 'function', foreground: 'DCDCAA' },
          { token: 'variable', foreground: '9CDCFE' }
        ],
        colors: {
          'editor.background': '#0d1117',
          'editor.foreground': '#c9d1d9',
          'editor.lineHighlightBackground': '#161b22',
          'editor.selectionBackground': '#264f78',
          'editor.inactiveSelectionBackground': '#3a3d41',
          'editorCursor.foreground': '#c9d1d9',
          'editorLineNumber.foreground': '#6e7681',
          'editorLineNumber.activeForeground': '#c9d1d9',
          'editorWhitespace.foreground': '#6e7681',
          'editorIndentGuide.background': '#21262d',
          'editorIndentGuide.activeBackground': '#30363d'
        }
      });
    }

    // Raccourcis clavier
    editor.addAction({
      id: 'save-file',
      label: 'Sauvegarder',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => onSave?.()
    });
    editor.addAction({
      id: 'run-code',
      label: 'Exécuter',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRun?.()
    });

    // Snippets React/TS
    if (language === 'typescript' || language === 'javascript') {
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: () => ({
          suggestions: [
            {
              label: 'rfc',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'import React from \'react\';\n\ninterface ${1:ComponentName}Props {\n\t$2\n}\n\nexport const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = (${3:props}) => {\n\treturn (\n\t\t<div>\n\t\t\t$4\n\t\t</div>\n\t);\n};',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'React Functional Component avec TypeScript'
            },
            {
              label: 'useState',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState<${2:type}>(${3:initialValue});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'React useState hook'
            },
            {
              label: 'useEffect',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'useEffect(() => {\n\t${1:// effet}\n\t\n\treturn () => {\n\t\t${2:// cleanup}\n\t};\n}, [${3:dependencies}]);',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'React useEffect hook'
            }
          ]
        })
      });
    }

    // Thème actuel
    monaco.editor.setTheme(settings.theme);

    // Listen for cursor position
    editor.onDidChangeCursorPosition(e => {
      setEditorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  // Panel d’options dynamiques
  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  const downloadCode = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(f => !f);
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 overflow-hidden ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FileText className="w-4 h-4" />
            <span>{language}</span>
            <span className="text-gray-600">•</span>
            <span>{value.split('\n').length} lignes</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={copyToClipboard} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Copier le code">
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={downloadCode} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Télécharger">
            <Download className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={formatCode} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Formater le code">
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
          {onSave && (
            <button onClick={onSave} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Sauvegarder (Ctrl+S)">
              <Save className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {onRun && (
            <button onClick={onRun} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Exécuter (Ctrl+Enter)">
              <Play className="w-4 h-4 text-green-400" />
            </button>
          )}
          <button onClick={() => setIsSettingsOpen(s => !s)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Paramètres">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Plein écran">
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-gray-400" /> : <Maximize2 className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Panneau de paramètres */}
      {isSettingsOpen && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Taille police</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                value={settings.fontSize}
                onChange={e => handleSettingChange('fontSize', Number(e.target.value))}
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Thème</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                value={settings.theme}
                onChange={e => handleSettingChange('theme', e.target.value)}
              >
                <option value="atelier-dark">Atelier Dark</option>
                <option value="vs-dark">VS Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="minimap"
                checked={settings.minimap}
                onChange={e => handleSettingChange('minimap', e.target.checked)}
                className="text-purple-600"
              />
              <label htmlFor="minimap" className="text-sm text-gray-300">Minimap</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wordwrap"
                checked={settings.wordWrap}
                onChange={e => handleSettingChange('wordWrap', e.target.checked)}
                className="text-purple-600"
              />
              <label htmlFor="wordwrap" className="text-sm text-gray-300">Word Wrap</label>
            </div>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <Editor
        height={isFullscreen ? 'calc(100vh - 200px)' : height}
        theme={settings.theme}
        language={language}
        value={value}
        onChange={val => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: settings.fontSize,
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
          fontLigatures: true,
          lineHeight: 1.6,
          minimap: { enabled: settings.minimap },
          lineNumbers: showLineNumbers ? 'on' : 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: settings.wordWrap ? 'on' : 'off',
          readOnly,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true,
          smoothScrolling: true,
          contextmenu: true,
          mouseWheelZoom: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          parameterHints: {
            enabled: true,
            cycle: true
          },
          codeLens: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          matchBrackets: 'always',
          bracketPairColorization: {
            enabled: true
          },
          guides: {
            indentation: true,
            highlightActiveIndentation: true
          },
          renderWhitespace: 'selection',
          renderControlCharacters: false,
          renderLineHighlight: 'all',
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false
          }
        }}
      />

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Ln {editorPosition.line}, Col {editorPosition.column}</span>
          <span>{language.toUpperCase()}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{value.length} caractères</span>
          <span>{new Blob([value]).size} bytes</span>
        </div>
      </div>
    </div>
  );
};
