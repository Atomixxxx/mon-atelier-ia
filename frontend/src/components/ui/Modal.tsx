import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import clsx from "clsx";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  width?: string;
  hideClose?: boolean;
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  width = "max-w-lg",
  hideClose = false,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur z-40 animate-fade-in" />
        <Dialog.Content
          className={clsx(
            "fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "bg-zinc-900 border border-zinc-700 shadow-2xl rounded-2xl p-6",
            width,
            "w-full max-h-[90vh] flex flex-col outline-none animate-fade-in",
            className
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <Dialog.Title className="text-lg font-semibold text-cyan-400">{title}</Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-zinc-400 mt-1">{description}</Dialog.Description>
              )}
            </div>
            {!hideClose && (
              <Dialog.Close asChild>
                <button
                  className="ml-2 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                  aria-label="Fermer"
                  tabIndex={0}
                >
                  <XIcon size={20} />
                </button>
              </Dialog.Close>
            )}
          </div>
          <div className="flex-1">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
