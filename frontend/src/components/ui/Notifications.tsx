import { Toaster, toast, ToastBar } from "react-hot-toast";
import { X } from "lucide-react";
import { motion } from "framer-motion";

export function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "bg-zinc-950 text-white rounded-lg px-4 py-3 shadow-xl border border-zinc-800",
        style: { fontFamily: "Inter, sans-serif" },
        duration: 4000,
      }}
      containerClassName="z-[10000]"
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <motion.div
              className="flex items-center gap-3"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
            >
              {icon}
              <span className="flex-1">{message}</span>
              <button onClick={() => toast.dismiss(t.id)} className="p-1 hover:text-cyan-400 transition">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}

// Utilisation dans App.tsx (au root de l'app)
export { toast };
