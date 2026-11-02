import Image from "next/image";
import Link from "next/link";

export default function Logo({
  href = "/",
  compact = false,
  className = "",
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label="Dhaka College IT Club - Home"
    >
      <span className="relative block h-10 w-10 shrink-0 sm:h-11 sm:w-11">
        <Image
          src="/logo.png"
          alt=""
          fill
          sizes="44px"
          loading="eager"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-orbitron text-sm font-bold tracking-[0.22em] text-white">
            DCITC
          </span>
          <span className="mt-1 font-rajdhani text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Dhaka College IT Club
          </span>
        </span>
      )}
    </Link>
  );
}
