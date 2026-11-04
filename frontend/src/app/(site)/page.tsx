import Hero from "@/components/Hero";
import WhyJoin from "@/components/WhyJoin";

import Departments from "@/components/Departments/Departments";
import Leadership from "@/components/Leadership/Leadership";
import Achievements from "@/components/Achievements";
import BlogPreview from "@/components/BlogPreview";
import CTASection from "@/components/CTASection";
import GetInTouch from "@/components/GetInTouch";
import { apiServer } from "@/lib/api";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import type { Leader, Achievement, Intel, PublicSettings } from "@/lib/api-types";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Dhaka College IT Club (DCITC) - Official Website" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Dhaka College IT Club (DCITC) - Official Website",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhaka College IT Club (DCITC) - Official Website",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default async function Home() {
  let leaders: Leader[] = [];
  let featuredAchievements: Achievement[] = [];
  let achievementsVisible = false;
  let featuredIntels: Intel[] = [];
  try {
    leaders = await apiServer<Leader[]>("/leadership");
  } catch {
    leaders = [];
  }
  try {
    // Hidden (toggle OFF) ships no section and skips the featured fetch too.
    achievementsVisible = (await apiServer<PublicSettings>("/settings/public")).achievementsVisible;
    if (achievementsVisible) {
      featuredAchievements = await apiServer<Achievement[]>("/achievements?featured=true");
    }
  } catch {
    featuredAchievements = [];
  }
  try {
    featuredIntels = await apiServer<Intel[]>("/intels?featured=true");
  } catch {
    featuredIntels = [];
  }
  return (
    <>
      <Hero />
      <WhyJoin />
      <Departments />
      <Leadership members={leaders} />
      {achievementsVisible ? <Achievements items={featuredAchievements} /> : null}
      <BlogPreview items={featuredIntels} />
      <GetInTouch />
      <CTASection />
    </>
  );
}