"use client";

import { useEffect, useId, useRef } from "react";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pending = false,
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A closed dialog must not put its heading and body into the page text.
  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current && !pending) onCancel();
      }}
      className="dialog-surface m-auto w-[min(430px,calc(100vw-2rem))] border border-white/15 bg-[#070707] p-0 text-slate-200 shadow-[0_30px_90px_-20px_rgba(0,0,0,1)]"
    >
      <div className="p-5 sm:p-6">
        <p className="font-orbitron text-[10px] uppercase tracking-[0.28em] text-slate-500">
          {destructive ? "Confirm removal" : "Please confirm"}
        </p>
        <h2
          id={titleId}
          className="mt-2 font-orbitron text-lg font-bold text-white"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-2 font-rajdhani text-base leading-snug text-slate-400"
        >
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            size="sm"
            skew
            loading={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
