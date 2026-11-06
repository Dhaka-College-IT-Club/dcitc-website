"use client";

import { Crosshair } from "lucide-react";
import { focalPosition, resolveImageUrl } from "@/lib/images";

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/**
 * Click the image to choose which part survives `object-cover` cropping.
 * The two previews below show the card and detail-hero crops live.
 */
export default function FocalPointPicker({
  image,
  x = 50,
  y = 50,
  onChange,
}: {
  image: string;
  x?: number | null;
  y?: number | null;
  onChange: (x: number, y: number) => void;
}) {
  const src = resolveImageUrl(image);
  const focalX = clamp(x ?? 50);
  const focalY = clamp(y ?? 50);
  const position = focalPosition(focalX, focalY);

  if (!src) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="type-overline uppercase tracking-[0.18em] text-faint">
          Focal point
        </p>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Image focal point, ${focalX}% across, ${focalY}% down. Click to move it.`}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onChange(
              clamp(((event.clientX - rect.left) / rect.width) * 100),
              clamp(((event.clientY - rect.top) / rect.height) * 100),
            );
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 10 : 2;
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            };
            const move = moves[event.key];
            if (!move) return;
            event.preventDefault();
            onChange(clamp(focalX + move[0]), clamp(focalY + move[1]));
          }}
          className="relative mt-1.5 aspect-video w-full cursor-crosshair overflow-hidden border border-line-strong bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: position }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-accent drop-shadow-lg"
            style={{ left: `${focalX}%`, top: `${focalY}%` }}
          >
            <Crosshair className="h-full w-full" />
          </span>
        </div>
        <p className="mt-1.5 type-caption text-faint">
          Click the image (or use arrow keys) to set what stays in frame.{" "}
          {focalX}% / {focalY}%
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <figure>
          <div className="relative aspect-video w-full overflow-hidden border border-line bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: position }}
            />
          </div>
          <figcaption className="mt-1 type-overline uppercase tracking-[0.16em] text-faint">
            Card crop · 16:9
          </figcaption>
        </figure>
        <figure>
          <div className="relative aspect-[21/9] w-full overflow-hidden border border-line bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: position }}
            />
          </div>
          <figcaption className="mt-1 type-overline uppercase tracking-[0.16em] text-faint">
            Detail hero · 21:9
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
