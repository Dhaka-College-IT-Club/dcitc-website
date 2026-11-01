"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import TextField from "./TextField";

type PasswordFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  id?: string;
  name?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  placeholder?: string;
};

export default function PasswordField({
  label,
  error,
  hint,
  className,
  id,
  name,
  value,
  onChange,
  autoComplete = "current-password",
  autoFocus,
  required,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? name ?? "password";

  return (
    <TextField
      id={inputId}
      name={name}
      label={label}
      error={error}
      hint={hint}
      className={className}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      required={required}
      placeholder={placeholder}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
