"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export default function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  widthClassName = "max-w-xl",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "left" | "right";
  widthClassName?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.setTimeout(() => {
        dialog
          .querySelector<HTMLElement>(
            'input:not([type="file"]):not([type="hidden"]), textarea, select'
          )
          ?.focus();
      }, 60);
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`drawer-surface dialog-surface fixed inset-y-0 m-0 h-dvh max-h-dvh w-full ${widthClassName} overflow-hidden border-0 bg-[#060606] p-0 text-slate-200 shadow-[-40px_0_90px_-30px_rgba(0,0,0,1)] ${
        side === "right"
          ? "left-auto right-0 border-l border-white/15"
          : "left-0 right-auto border-r border-white/15"
      }`}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="font-orbitron text-[10px] uppercase tracking-[0.28em] text-slate-500">
              Admin console
            </p>
            <h2
              id={titleId}
              className="mt-1 font-orbitron text-lg font-bold text-white"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 font-rajdhani text-sm text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 text-slate-400 transition-colors hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="dc-scroll flex-1 min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}
