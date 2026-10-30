"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useState } from "react";
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
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  shape?: keyof typeof shapes;
  hint?: string;
}) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError?.message || "Upload failed. Try a smaller image.");
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
            <label
              htmlFor={id}
              className="inline-flex h-8 cursor-pointer items-center gap-2 border border-white/20 px-3 font-orbitron text-[10px] uppercase tracking-[0.14em] text-slate-300 transition-colors hover:border-white/50 hover:text-white focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
            </label>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setError("");
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
        </div>
      </div>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
