"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";
type ToastItem = { id: number; message: string; variant: ToastVariant };

const ToastContext = createContext<{
  push: (message: string, variant?: ToastVariant) => void;
} | null>(null);

const styles: Record<ToastVariant, { icon: typeof Info; classes: string }> = {
  success: {
    icon: CheckCircle2,
    classes: "border-emerald-500/50 text-emerald-200",
  },
  error: { icon: AlertCircle, classes: "border-red-500/50 text-red-200" },
  info: { icon: Info, classes: "border-line-strong text-muted" },
};

let nextToastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = ++nextToastId;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 4500);
    },
    []
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const config = styles[toast.variant];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              role={toast.variant === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-2.5 border border-line border-l-2 bg-surface/95 px-3.5 py-3 shadow-elev-1 backdrop-blur ${config.classes}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="flex-1 type-body-sm leading-snug">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() =>
                  setToasts((current) =>
                    current.filter((item) => item.id !== toast.id)
                  )
                }
                className="inline-flex h-5 w-5 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
