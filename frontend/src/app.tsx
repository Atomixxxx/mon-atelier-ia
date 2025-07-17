import { useState } from "react";
import { Search, Settings, Zap, MessageSquare, FolderOpen, Users } from "lucide-react";
import ChatContainer from "./components/chat/ChatContainer";
import ProjectPlanPanel from "./components/project/ProjectPlanPanel";

// Types pour ton plan de projet
export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface Step {
  id: number;
  title: string;
  status: "todo" | "in_progress" | "done";
  todos: Todo[];
}

export interface ProjectPlan {
  title: string;
  description: string;
  steps: Step[];
}

const initialPlan: ProjectPlan = {
  title: "Projet IA - Génération App",
  description: "Application IA collaborative avec gestion de projets, génération de code, suivi des tâches, etc.",
  steps: [
    {
      id: 1,
      title: "Découverte des besoins",
      status: "done",
      todos: [
        { id: "1a", text: "Brief fonctionnel", done: true },
        { id: "1b", text: "Liste fonctionnalités", done: true }
      ]
    },
    {
      id: 2,
      title: "Mise en place de la structure",
      status: "in_progress",
      todos: [
        { id: "2a", text: "Initialiser le repo", done: true },
        { id: "2b", text: "Créer la structure des dossiers", done: false }
      ]
    },
    {
      id: 3,
      title: "UI & Génération de code",
      status: "todo",
      todos: [
        { id: "3a", text: "Intégrer Monaco Editor", done: false },
        { id: "3b", text: "Générer le backend FastAPI", done: false }
      ]
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "plan" | "projects" | "agents">("chat");
  const [plan, setPlan] = useState<ProjectPlan>(initialPlan);

  // Toggle une tâche (marque fait/non fait)
  const handleToggleTodo = (stepId: number, todoId: string) => {
    setPlan((plan) => ({
      ...plan,
      steps: plan.steps.map((step: Step) =>
        step.id === stepId
          ? {
              ...step,
              todos: step.todos.map((todo: Todo) =>
                todo.id === todoId ? { ...todo, done: !todo.done } : todo
              )
            }
          : step
      )
    }));
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-8 h-8 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mon Atelier IA
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Layout principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Seulement visible pour les onglets autres que chat */}
        {activeTab !== "chat" && (
          <aside className="bg-gray-900 border-r border-gray-800 w-64 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "chat"
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-800 text-gray-400"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab("plan")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "plan"
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-800 text-gray-400"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-sm">Plan Projet</span>
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "projects"
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-800 text-gray-400"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-sm">Projets</span>
                </button>
                <button
                  onClick={() => setActiveTab("agents")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "agents"
                      ? "bg-purple-600 text-white"
                      : "hover:bg-gray-800 text-gray-400"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Agents</span>
                </button>
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <div className="h-full flex">
              {/* Navigation rapide pour revenir aux autres onglets */}
              <div className="bg-gray-900 border-r border-gray-800 w-16 flex flex-col items-center py-4 gap-3">
                <button
                  onClick={() => setActiveTab("plan")}
                  className="p-3 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                  title="Plan Projet"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className="p-3 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                  title="Projets"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab("agents")}
                  className="p-3 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                  title="Agents"
                >
                  <Users className="w-5 h-5" />
                </button>
              </div>
              
              {/* ChatContainer prend tout l'espace restant */}
              <div className="flex-1">
                <ChatContainer
                  projectId="atelier-ia-projet"
                  agentId="assistant"
                />
              </div>
            </div>
          )}
          
          {activeTab === "plan" && (
            <div className="w-full max-w-2xl mx-auto mt-8 px-4">
              <ProjectPlanPanel plan={plan} onToggleTodo={handleToggleTodo} />
            </div>
          )}
          
          {activeTab === "projects" && (
            <div className="w-full max-w-2xl mx-auto mt-8 px-4">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 text-gray-400 text-center">
                <span>Composant ProjectList à brancher ici</span>
              </div>
            </div>
          )}
          
          {activeTab === "agents" && (
            <div className="w-full max-w-2xl mx-auto mt-8 px-4">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 text-gray-400 text-center">
                <span>Composant AgentsPanel à brancher ici</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}