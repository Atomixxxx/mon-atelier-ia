import React, { useRef, useEffect, useState } from "react";
import { Send, Loader2, Trash2, Copy, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import clsx from "clsx";
import { useChat } from "@/hooks/useChat";

// Garder votre type existant pour compatibilité
type Msg = {
  id: string;
  user: boolean;
  text: string;
  agent?: string;
};

interface ChatPanelProps {
  agentId?: string;
  projectId?: string;
  conversationId?: string;
  enablePersistence?: boolean;
  onConversationChange?: (conversationId: string) => void;
}

export default function ChatPanel({ 
  agentId = "assistant",
  projectId = "default-project",
  conversationId,
  enablePersistence = false,
  onConversationChange
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Utiliser le hook useChat
  const {
    messages: hookMessages,
    isLoading,
    error,
    sendMessage: hookSendMessage,
    clearMessages,
    conversationId: currentConversationId
  } = useChat({
    agentId,
    projectId,
    conversationId,
    autoSave: enablePersistence
  });

  // Convertir les messages du hook vers votre format existant
  const messages: Msg[] = hookMessages.map(msg => ({
    id: msg.id,
    user: msg.sender === 'user',
    text: msg.content,
    agent: msg.agentId || agentId
  }));

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (input.startsWith("/clear")) {
      clearMessages();
      setInput("");
    }
  }, [input, clearMessages]);

  // Notifier le parent du changement de conversation
  useEffect(() => {
    if (currentConversationId && onConversationChange) {
      onConversationChange(currentConversationId);
    }
  }, [currentConversationId, onConversationChange]);

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const val = input.trim();
    if (!val) return;

    setInput("");
    
    try {
      await hookSendMessage(val);
    } catch (err: any) {
      console.error('Send message error:', err);
    }
  }

  const handleCopy = (text: string) => navigator.clipboard.writeText(text);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#181A1B] rounded-lg shadow-xl border border-[#232627] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#232627] bg-[#181A1B]/80 backdrop-blur sticky top-0 z-10">
        <Bot className="text-purple-400" />
        <span className="font-semibold text-lg text-gray-100 tracking-tight">
          Atelier Chat IA
        </span>
        {/* Afficher l'ID de conversation si persistance activée */}
        {enablePersistence && currentConversationId && (
          <span className="text-xs text-gray-400 ml-2">
            Conv: {currentConversationId.slice(-6)}
          </span>
        )}
        <button
          className="ml-auto p-2 rounded hover:bg-[#222] transition"
          title="Effacer l'historique"
          onClick={clearMessages}
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Affichage d'erreur */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-red-400 underline text-xs mt-1"
          >
            Recharger la page
          </button>
        </div>
      )}

      {/* Chat zone */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto px-4 py-6 bg-gradient-to-br from-[#212325] via-[#181A1B] to-[#232627]">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <p className="text-lg mb-2">Bonjour ! Je suis votre assistant IA.</p>
            <p className="text-sm">Tapez votre message pour commencer...</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex group items-end max-w-3xl",
              msg.user ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div
              className={clsx(
                "flex items-center justify-center rounded-full w-8 h-8 mr-2",
                msg.user
                  ? "bg-gradient-to-br from-green-400 to-cyan-400"
                  : "bg-gradient-to-br from-purple-500 to-indigo-500"
              )}
            >
              {msg.user ? (
                <User className="text-black" size={18} />
              ) : (
                <Bot className="text-white" size={18} />
              )}
            </div>
            <div
              className={clsx(
                "p-3 rounded-xl shadow-md text-sm font-mono whitespace-pre-line relative",
                msg.user
                  ? "bg-gradient-to-br from-green-800/80 to-cyan-900/60 text-green-200"
                  : "bg-gradient-to-br from-[#26243e] to-[#181a21] text-purple-100"
              )}
              style={{ maxWidth: "650px" }}
            >
              <ReactMarkdown
                children={msg.text}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match ? match[1] : "tsx"}
                        PreTag="div"
                        className="rounded-lg text-xs p-2 my-1"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-[#232627] px-1 py-0.5 rounded text-cyan-300">{children}</code>
                    );
                  }
                }}
              />
              <button
                onClick={() => handleCopy(msg.text)}
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition bg-black/40 p-1 rounded hover:bg-black/80"
                title="Copier"
              >
                <Copy size={15} />
              </button>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-purple-300">
            <Loader2 className="animate-spin" /> L'IA écrit…
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex gap-2 p-4 border-t border-[#232627] bg-[#181A1B]/90 sticky bottom-0"
      >
        <textarea
          className="flex-1 bg-[#212325] text-gray-100 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-600 shadow transition"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
          placeholder="Dis à l'IA ce que tu veux coder, ou tape '/' pour voir les commandes…"
          value={input}
          disabled={isLoading}
          onChange={e => setInput(e.target.value)}
          rows={1}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={clsx(
            "rounded-lg px-4 py-2 font-semibold shadow bg-gradient-to-br from-purple-600 to-indigo-500 text-white hover:from-purple-700 hover:to-indigo-600 transition",
            isLoading && "opacity-60 cursor-not-allowed"
          )}
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}