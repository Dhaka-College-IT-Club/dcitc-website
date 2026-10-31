import Link from "next/link";
import { notFound } from "next/navigation";
import ContentImage from "@/components/ui/ContentImage";
import { apiServer } from "@/lib/api";
import type { Intel } from "@/lib/api-types";
import type { Metadata } from "next";

export const revalidate = 60;

async function getIntelBySlug(slug: string): Promise<Intel | null> {
  try {
    return await apiServer<Intel>(`/intels/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const intel = await getIntelBySlug(slug);
  if (!intel) return { title: "Intel Not Found" };
  return {
    title: `${intel.title} | DCITC Intel`,
    description: intel.excerpt,
    openGraph: {
      title: intel.title,
      description: intel.excerpt,
      images: intel.image ? [intel.image] : [],
    },
  };
}

export default async function IntelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const intel = await getIntelBySlug(slug);
  if (!intel) notFound();

  return (
    <div className="min-h-screen bg-black pb-20 pt-24 text-slate-200 sm:pt-32">
      <article className="mx-auto max-w-4xl px-6">
        <Link
          href="/intel"
          className="inline-flex items-center gap-2 font-orbitron text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-white"
        >
          <span aria-hidden="true">←</span> Back to Intel
        </Link>

        <div className="relative mt-6 aspect-[16/9] max-h-[26rem] w-full overflow-hidden border border-white/10">
          <ContentImage
            src={intel.image}
            alt={intel.title}
            sizes="(min-width: 896px) 896px, 100vw"
            priority
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black to-transparent" />
        </div>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="border border-white/20 bg-white/[0.06] px-2.5 py-1 font-orbitron text-[10px] uppercase tracking-[0.2em] text-white">
              {intel.tag}
            </span>
            <span className="font-rajdhani text-sm text-slate-500">
              By {intel.author} · {intel.date}
            </span>
          </div>

          <h1 className="mt-4 font-orbitron text-3xl font-bold leading-tight text-white md:text-5xl">
            {intel.title}
          </h1>
          <p className="mt-4 font-rajdhani text-lg leading-relaxed text-slate-400 md:text-xl">
            {intel.excerpt}
          </p>
        </header>

        <div className="mt-10 max-w-2xl border-t border-white/10 pt-8">
          <div className="whitespace-pre-line font-rajdhani text-lg leading-relaxed text-slate-300">
            {intel.content}
          </div>
        </div>
      </article>
    </div>
  );
}
