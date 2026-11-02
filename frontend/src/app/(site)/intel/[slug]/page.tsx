import Link from "next/link";
import { notFound } from "next/navigation";
import IntelCard from "@/components/ui/IntelCard";
import IntelImage from "@/components/ui/IntelImage";
import IntelMarkdown from "@/components/ui/IntelMarkdown";
import ReadingProgress from "@/components/ui/ReadingProgress";
import TableOfContents from "@/components/ui/TableOfContents";
import { apiServer } from "@/lib/api";
import { resolveImageUrl } from "@/lib/images";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { absoluteUrl, breadcrumbList, isoDate } from "@/lib/structured-data";
import JsonLd from "@/components/seo/JsonLd";
import {
  cleanTitle,
  extractHeadings,
  formatShortDate,
  readingMinutes,
  shouldShowStandfirst,
} from "@/lib/intel";
import type { Intel } from "@/lib/api-types";
import type { Metadata } from "next";

export const revalidate = 60;

async function getIntelBySlug(slug: string): Promise<Intel | null> {
  try {
    return await apiServer<Intel>(`/intels/${slug}`);
  } catch (error) {
    // Only a genuine miss is a 404 page. An outage must reach the error boundary.
    if ((error as { status?: number } | null)?.status === 404) return null;
    throw error;
  }
}

async function getRelatedIntel(slug: string): Promise<Intel[]> {
  try {
    const all = await apiServer<Intel[]>("/intels");
    return all.filter((item) => item.slug !== slug).slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let intel: Intel | null = null;
  try {
    intel = await getIntelBySlug(slug);
  } catch {
    // Metadata must never turn an outage into a misleading "not found" title.
    return { title: "Intel" };
  }
  if (!intel) return { title: "Intel Not Found" };

  const image = resolveImageUrl(intel.image);
  const title = cleanTitle(intel.title);
  const description = `Dhaka College IT Club (DCITC): ${intel.excerpt}`;
  const published = intel.createdAt ? new Date(intel.createdAt) : null;
  const publishedTime =
    published && !Number.isNaN(published.getTime())
      ? published.toISOString()
      : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/intel/${intel.slug}` },
    openGraph: {
      siteName: "Dhaka College IT Club",
      type: "article",
      locale: "en_US",
      url: `/intel/${intel.slug}`,
      title,
      description,
      publishedTime,
      images: image ? [image] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [DEFAULT_OG_IMAGE.url],
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

  const related = await getRelatedIntel(slug);
  const title = cleanTitle(intel.title);
  const headings = extractHeadings(intel.content);
  const minutes = readingMinutes(intel.content);
  const image = resolveImageUrl(intel.image);
  const publishedIso = isoDate(intel.date) ?? isoDate(intel.createdAt);
  const modifiedIso = isoDate(intel.updatedAt) ?? publishedIso;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: intel.excerpt,
    image: image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_IMAGE.url),
    ...(publishedIso ? { datePublished: publishedIso } : {}),
    ...(modifiedIso ? { dateModified: modifiedIso } : {}),
    author: { "@type": "Person", name: intel.author },
    publisher: {
      "@type": "Organization",
      name: "Dhaka College IT Club",
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png") },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/intel/${intel.slug}`),
    },
  };
  const breadcrumbs = breadcrumbList([
    { name: "Home", path: "/" },
    { name: "Intel", path: "/intel" },
    { name: title, path: `/intel/${intel.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-black pb-24 text-slate-200">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbs} />
      <ReadingProgress />

      <div className="pt-24 sm:pt-28">
        <article className="mx-auto max-w-6xl px-5 sm:px-8">
          <Link
            href="/intel"
            className="inline-flex items-center gap-2 font-orbitron text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span> Back to Intel
          </Link>

          <div className="relative mt-6 aspect-video w-full overflow-hidden border border-white/10 xl:aspect-[21/9]">
            <IntelImage
              src={intel.image}
              alt={title}
              focalX={intel.imageFocalX}
              focalY={intel.imageFocalY}
              sizes="(min-width: 1280px) 1152px, 100vw"
              priority
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black to-transparent" />
          </div>

          <div className="mx-auto mt-8 max-w-[1000px]">
            <header className="max-w-[720px]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="border border-white/20 bg-white/[0.06] px-2.5 py-1 font-orbitron text-[10px] uppercase tracking-[0.2em] text-white">
                  {intel.tag}
                </span>
                <span className="font-rajdhani text-sm text-slate-400">
                  By {intel.author} ·{" "}
                  {publishedIso ? (
                    <time dateTime={publishedIso}>
                      {formatShortDate(intel.date)}
                    </time>
                  ) : (
                    formatShortDate(intel.date)
                  )}{" "}
                  · {minutes} min read
                </span>
              </div>

              <h1 className="mt-4 text-balance font-orbitron text-3xl font-bold leading-tight text-white md:text-5xl">
                {title}
              </h1>
              {shouldShowStandfirst(intel.excerpt, intel.content) ? (
                <p className="mt-4 font-rajdhani text-lg leading-relaxed text-slate-300 md:text-xl">
                  {intel.excerpt}
                </p>
              ) : null}
            </header>

            <div className="mt-10 flex justify-center gap-14">
              <div className="w-full min-w-0 max-w-[720px]">
                <div className="border-t border-white/10 pt-8">
                  <IntelMarkdown content={intel.content} />
                </div>

                {related.length > 0 ? (
                  <section className="mt-16 border-t border-white/10 pt-8">
                    <h2 className="font-orbitron text-xs uppercase tracking-[0.28em] text-slate-500">
                      More Intel
                    </h2>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {related.map((item) => (
                        <IntelCard key={item.id} intel={item} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="hidden w-[220px] shrink-0 xl:block">
                <TableOfContents headings={headings} />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
