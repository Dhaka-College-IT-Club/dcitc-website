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
          <h2 className="type-overline uppercase tracking-[0.18em] text-muted">
            Landing page slots
          </h2>
          <p className="mt-1 type-body-sm text-faint">
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
              className={` flex min-h-32 min-w-0 flex-col justify-between border p-3 ${
                occupant
                  ? "border-line-strong bg-surface-2"
                  : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="type-overline uppercase tracking-[0.2em] text-faint">
                  Slot {String(slot + 1).padStart(2, "0")}
                </span>
                {occupant ? (
                  <span className="flex h-4 w-4 items-center justify-center bg-white text-bg">
                    <Check className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                ) : (
                  <Plus className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                )}
              </div>

              {occupant ? (
                <>
                  <p className="mt-3 line-clamp-2 type-body-sm font-semibold leading-snug text-text">
                    {occupant.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => onClear(occupant.id)}
                    disabled={busy}
                    className="mt-2 inline-flex w-fit items-center gap-1 type-overline uppercase tracking-[0.14em] text-faint transition-colors hover:text-red-300 disabled:opacity-40"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Clear
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 type-body-sm text-faint">
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
                    className="dc-input dc-input-sm mt-2 w-full disabled:opacity-40"
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
