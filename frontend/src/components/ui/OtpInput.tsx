"use client";

import { useRef } from "react";

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
  label = "Verification code",
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const groupId = "otp-label";

  function commit(next: string[]) {
    onChange(next.join("").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    const next = [...digits];
    if (!clean) {
      next[index] = "";
      commit(next);
      return;
    }
    let cursor = index;
    for (const char of clean) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }
    commit(next);
    refs.current[Math.min(cursor, length - 1)]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        refs.current[index - 1]?.focus();
      }
      commit(next);
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>
  ) {
    const clean = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length - index);
    if (!clean) return;
    event.preventDefault();
    const next = [...digits];
    let cursor = index;
    for (const char of clean) {
      next[cursor] = char;
      cursor += 1;
    }
    commit(next);
    refs.current[Math.min(cursor, length - 1)]?.focus();
  }

  return (
    <div>
      <span id={groupId} className="dc-label">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={groupId}
        aria-describedby={error ? "otp-error" : undefined}
        className="flex items-center gap-2"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.currentTarget.select()}
            disabled={disabled}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={error ? true : undefined}
            autoFocus={index === 0}
            className={`dc-input h-12 min-w-0 flex-1 px-0 text-center font-orbitron text-lg ${
              error ? "border-red-500/60" : ""
            }`}
          />
        ))}
      </div>
      {error ? (
        <p
          id="otp-error"
          role="alert"
          className="mt-1.5 font-rajdhani text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
