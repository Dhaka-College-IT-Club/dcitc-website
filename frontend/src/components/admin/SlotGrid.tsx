"use client";

import { Check, Plus, X } from "lucide-react";

export type SlotItem = { id: number; title: string; slot: number | null };

export default function SlotGrid({
  count,
  items,
  onAssign,
  onClear,
  busy = false,
}: {
  count: number;
  items: SlotItem[];
  onAssign: (id: number, slot: number) => void;
  onClear: (id: number) => void;
  busy?: boolean;
}) {
  const slots = Array.from({ length: count }, (_, index) => index);
  const free = items.filter((item) => item.slot === null);
  const filled = items.filter(
    (item) => item.slot !== null && item.slot < count
  ).length;

  return (
    <section aria-label="Featured slots">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-orbitron text-xs uppercase tracking-[0.18em] text-slate-300">
            Landing page slots
          </h2>
          <p className="mt-1 font-rajdhani text-sm text-slate-500">
            {filled} of {count} filled. Empty slots stay hidden on the public
            page.
          </p>
        </div>
      </div>
      <div
        className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${
          count > 3 ? "lg:grid-cols-5" : ""
        }`}
      >
        {slots.map((slot) => {
          const occupant = items.find((item) => item.slot === slot);
          return (
            <div
              key={slot}
              className={`clip-notch-sm flex min-h-32 min-w-0 flex-col justify-between border p-3 ${
                occupant
                  ? "border-white/30 bg-white/[0.06]"
                  : "border-white/10 bg-white/[0.015]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-orbitron text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  Slot {String(slot + 1).padStart(2, "0")}
                </span>
                {occupant ? (
                  <span className="flex h-4 w-4 items-center justify-center bg-white text-black">
                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                ) : (
                  <Plus className="h-3.5 w-3.5 text-slate-700" aria-hidden="true" />
                )}
              </div>

              {occupant ? (
                <>
                  <p className="mt-3 line-clamp-2 font-rajdhani text-sm font-semibold leading-snug text-white">
                    {occupant.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => onClear(occupant.id)}
                    disabled={busy}
                    className="mt-2 inline-flex w-fit items-center gap-1 font-orbitron text-[9px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-red-300 disabled:opacity-40"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Clear
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 font-rajdhani text-sm text-slate-500">
                    Empty
                  </p>
                  <select
                    aria-label={`Assign an item to slot ${slot + 1}`}
                    value=""
                    disabled={busy || free.length === 0}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (value) onAssign(value, slot);
                    }}
                    className="mt-2 h-7 w-full border border-white/10 bg-black px-1.5 font-rajdhani text-xs text-slate-400 disabled:opacity-40"
                  >
                    <option value="" disabled>
                      {free.length === 0 ? "No items" : "Feature…"}
                    </option>
                    {free.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
