"use client";

import Image from "next/image";
import { useState } from "react";
import { focalPosition, isOptimizableImage, resolveImageUrl } from "@/lib/images";

/**
 * The single image component for intel content: admin table thumbnail, list
 * card and detail hero. It resolves the stored value, crops around the saved
 * focal point, and swaps in a placeholder if the file cannot be loaded.
 */
export default function IntelImage({
  src,
  alt,
  focalX,
  focalY,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const resolved = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!resolved || failedSrc === resolved) return <ImagePlaceholder alt={alt} />;

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
      priority={priority}
      // Hosts outside next.config's allow-list would throw in next/image.
      unoptimized={!isOptimizableImage(resolved)}
      className={`object-cover ${className}`.trim()}
      style={{ objectPosition: focalPosition(focalX, focalY) }}
      onError={() => setFailedSrc(resolved)}
    />
  );
}

function ImagePlaceholder({ alt }: { alt: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-white/10 to-black"
    >
      <span className="font-orbitron text-3xs uppercase tracking-[0.28em] text-faint">
        DCITC
      </span>
    </div>
  );
}
