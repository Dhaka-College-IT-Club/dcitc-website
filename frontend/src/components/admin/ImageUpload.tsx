"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import FocalPointPicker from "./FocalPointPicker";
import { uploadImage } from "@/lib/upload";

const shapes = {
  portrait: "h-32 w-24",
  square: "h-28 w-28",
  wide: "h-24 w-40",
};

export default function ImageUpload({
  label,
  value,
  onChange,
  shape = "wide",
  hint = "PNG, JPG or WebP. Max 5 MB.",
  error,
  focal,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  shape?: keyof typeof shapes;
  hint?: string;
  error?: string;
  focal?: { x: number; y: number; onChange: (x: number, y: number) => void };
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadErrorState] = useState("");

  // Restore scroll position after the native file picker closes (it moves focus
  // to the first field in the dialog, which scrolls the panel to the top).
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const restore = () => {
      const scroller = input.closest(".dc-scroll") as HTMLElement | null;
      const saved = (input as unknown as { __savedScroll?: number }).__savedScroll;
      setTimeout(() => {
        if (scroller && saved !== undefined) scroller.scrollTop = saved;
      }, 0);
    };
    input.addEventListener("cancel", restore);
    return () => input.removeEventListener("cancel", restore);
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadErrorState("");
    try {
      const url = await uploadImage(file);
      onChange(url);
      // Keep the spinner until the new preview actually loads; onLoad/onError
      // below is responsible for clearing it (covers success + failure).
    } catch (err) {
      const apiError = err as { message?: string };
      setUploadErrorState(apiError?.message || "Upload failed. Try a smaller image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="dc-label">{label}</span>
      <div className="flex items-start gap-3">
        {value ? (
          <div
            className={`relative ${shapes[shape]} shrink-0 overflow-hidden border border-white/15 bg-black`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
              onLoad={() => setUploading(false)}
              onError={() => {
                setUploading(false);
                setUploadErrorState("Could not load image. Try another file.");
              }}
              style={
                focal
                  ? { objectPosition: `${focal.x}% ${focal.y}%` }
                  : undefined
              }
            />
          </div>
        ) : (
          <div
            className={`${shapes[shape]} flex shrink-0 items-center justify-center border border-dashed border-white/15 bg-black/40 text-slate-500`}
            aria-hidden="true"
          >
            <ImagePlus className="h-5 w-5" />
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const scroller = inputRef.current?.closest(".dc-scroll") as HTMLElement | null;
                const dialog = scroller?.closest("dialog") as HTMLElement | null;
                const saved = scroller?.scrollTop ?? 0;
                if (inputRef.current) {
                  (inputRef.current as unknown as { __savedScroll?: number }).__savedScroll = saved;
                }
                const restore = () => {
                  if (scroller) scroller.scrollTop = saved;
                };
                // The native file picker moves focus (and thus scrolls) to the
                // dialog's first focusable field when it closes; counteract that
                // for a short window.
                const interval = window.setInterval(restore, 16);
                window.setTimeout(() => window.clearInterval(interval), 1000);
                if (dialog) {
                  const onFocusIn = () => window.setTimeout(restore, 0);
                  dialog.addEventListener("focusin", onFocusIn);
                  window.setTimeout(() => dialog.removeEventListener("focusin", onFocusIn), 1000);
                }
                inputRef.current?.click();
              }}
              onMouseDown={(event) => event.preventDefault()}
              disabled={uploading}
              className="inline-flex h-8 cursor-pointer items-center gap-2 border border-white/20 px-3 font-orbitron text-[10px] uppercase tracking-[0.14em] text-slate-300 transition-colors hover:border-white/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setUploadErrorState("");
                }}
                className="inline-flex h-8 items-center gap-1.5 border border-white/10 px-2.5 font-orbitron text-[10px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:border-red-400/50 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>
          <p className="font-rajdhani text-xs leading-snug text-slate-500">
            {uploading ? "Sending file to storage…" : hint}
          </p>
          {error ? (
            <p role="alert" className="font-rajdhani text-xs text-red-300">
              {error}
            </p>
          ) : null}
          {uploadError ? (
            <p role="alert" className="font-rajdhani text-xs text-red-300">
              {uploadError}
            </p>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
        tabIndex={-1}
        disabled={uploading}
        onChange={(event) => {
          const scroller = inputRef.current?.closest(".dc-scroll") as HTMLElement | null;
          const saved = (inputRef.current as unknown as { __savedScroll?: number }).__savedScroll ?? scroller?.scrollTop ?? 0;
          setTimeout(() => {
            if (scroller) scroller.scrollTop = saved;
          }, 0);
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {value && focal ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <FocalPointPicker
            image={value}
            x={focal.x}
            y={focal.y}
            onChange={focal.onChange}
          />
        </div>
      ) : null}
    </div>
  );
}
