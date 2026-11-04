import { AlertCircle } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
  counter?: { text: string; over?: boolean };
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export default function TextField({
  label,
  error,
  hint,
  trailing,
  counter,
  className = "",
  id,
  name,
  ...props
}: TextFieldProps) {
  const inputId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="dc-label">
          {label}
        </label>
        {counter ? (
          <span
            className={`font-rajdhani text-xs tabular-nums ${
              counter.over ? "text-red-300" : "text-faint"
            }`}
          >
            {counter.text}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          className={`dc-input ${trailing ? "pr-12" : ""}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-1 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 font-rajdhani text-sm text-red-300"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p
          id={hintId}
          className="mt-1.5 font-rajdhani text-sm text-faint"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
