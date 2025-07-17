import React from "react";

interface Todo {
  id: string;
  text: string;
  done: boolean;
}
interface Step {
  id: number;
  title: string;
  status: "todo" | "in_progress" | "done";
  todos: Todo[];
}
interface ProjectPlan {
  title: string;
  description: string;
  steps: Step[];
}

export const ProjectPlanPanel: React.FC<{
  plan: ProjectPlan;
  onToggleTodo: (stepId: number, todoId: string) => void;
}> = ({ plan, onToggleTodo }) => {
  // Calcul du pourcentage d’avancement
  const total = plan.steps.flatMap(s => s.todos).length;
  const done = plan.steps.flatMap(s => s.todos).filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 w-full max-w-xl">
      <h2 className="text-2xl font-bold mb-2">{plan.title}</h2>
      <p className="text-gray-400 mb-4">{plan.description}</p>
      <div className="mb-4 w-full bg-gray-700 rounded-full h-3">
        <div
          className="bg-purple-600 h-3 rounded-full"
          style={{ width: `${percent}%`, transition: "width 0.3s" }}
        ></div>
      </div>
      {plan.steps.map(step => (
        <div key={step.id} className="mb-6">
          <h3 className="font-semibold mb-2">
            {step.title} <span className="ml-2 text-xs uppercase text-gray-400">{step.status}</span>
          </h3>
          <ul>
            {step.todos.map(todo => (
              <li key={todo.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => onToggleTodo(step.id, todo.id)}
                  className="accent-purple-600"
                />
                <span className={todo.done ? "line-through text-gray-500" : ""}>{todo.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="text-xs text-gray-500 mt-2">{done} tâches sur {total} terminées ({percent}%)</div>
    </div>
  );
};

// Ajoute cette ligne pour l'import par défaut !
export default ProjectPlanPanel;
