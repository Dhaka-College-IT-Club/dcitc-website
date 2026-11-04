import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";

const variants = {
  error: {
    role: "alert" as const,
    icon: AlertCircle,
    classes: "border-red-500/50 bg-red-500/[0.07] text-red-200",
    iconClasses: "text-red-400",
  },
  success: {
    role: "status" as const,
    icon: CheckCircle2,
    classes: "border-emerald-500/40 bg-emerald-500/[0.07] text-emerald-200",
    iconClasses: "text-emerald-400",
  },
  info: {
    role: "status" as const,
    icon: Info,
    classes: "border-line-strong bg-surface-2 text-muted",
    iconClasses: "text-subtle",
  },
};

export default function Alert({
  variant = "info",
  children,
  onDismiss,
}: {
  variant?: keyof typeof variants;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={`flex items-start gap-2.5 border-l-2 px-3.5 py-3 font-rajdhani text-sm leading-snug ${config.classes}`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconClasses}`}
        aria-hidden="true"
      />
      <div className="flex-1">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 -mt-0.5 inline-flex h-6 w-6 items-center justify-center text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Dismiss message"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
