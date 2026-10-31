import Image from "next/image";

// Mirrors images.remotePatterns in next.config.ts. next/image throws during render
// for a host it does not know, which takes the whole page down, so any URL that
// would throw is rendered as a placeholder instead. Server components only: the
// allow-list is read from a server-side env var.
const remoteHosts = new Set(
  (process.env.IMAGE_REMOTE_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
);

function isRenderableImage(src: string | null | undefined): src is string {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    return remoteHosts.has(url.hostname) && url.protocol === (local ? "http:" : "https:");
  } catch {
    return false;
  }
}

type ContentImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export default function ContentImage({ src, alt, className, sizes, priority }: ContentImageProps) {
  if (!isRenderableImage(src)) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full w-full items-center justify-center bg-linear-to-br from-white/10 to-black"
      >
        <span className="font-orbitron text-[10px] tracking-[0.3em] uppercase text-slate-500">
          DCITC
        </span>
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
}
