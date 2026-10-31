import Link from "next/link";
import { notFound } from "next/navigation";
import ContentImage from "@/components/ui/ContentImage";
import { apiServer } from "@/lib/api";
import type { Intel } from "@/lib/api-types";
import type { Metadata } from "next";
import ShareButtons from "@/components/ShareButtons";

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
    <div className="min-h-screen bg-black text-slate-200 pt-24 sm:pt-32 pb-16">
      <article className="max-w-4xl mx-auto px-6">
        <header className="mb-10">
          <Link
            href="/intel"
            className="inline-flex items-center text-slate-400 hover:text-white font-rajdhani mb-6 transition-colors"
          >
            ← Back to Intel
          </Link>

          <div className="relative h-64 md:h-96 w-full mb-8 overflow-hidden border border-white/10 rounded-lg">
            <ContentImage
              src={intel.image}
              alt={intel.title}
              sizes="(min-width: 896px) 896px, 100vw"
              priority
              className="object-cover"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <span className="w-fit px-3 py-1 text-xs font-orbitron tracking-widest uppercase rounded bg-white/10 text-white border border-white/20">
              {intel.tag}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-rajdhani text-slate-500">
                {intel.date}
              </span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            {intel.title}
          </h1>
          <p className="text-xl font-rajdhani text-slate-400 leading-relaxed">
            {intel.excerpt}
          </p>
        </header>

        <div className="prose prose-invert max-w-none">
          <div className="font-rajdhani text-slate-300 text-lg leading-relaxed whitespace-pre-line">
            {intel.content}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <h3 className="text-white font-orbitron text-lg mb-4">Circulate Intel</h3>
          <ShareButtons title={intel.title} />
        </div>
      </article>
    </div>
  );
}