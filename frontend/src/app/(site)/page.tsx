import Hero from "@/components/Hero";
import WhyJoin from "@/components/WhyJoin";

import Departments from "@/components/Departments/Departments";
import Leadership from "@/components/Leadership/Leadership";
import Achievements from "@/components/Achievements";
import BlogPreview from "@/components/BlogPreview";
import CTASection from "@/components/CTASection";
import GetInTouch from "@/components/GetInTouch";
import { apiServer } from "@/lib/api";
import type { Leader, Achievement, Intel } from "@/lib/api-types";

export const revalidate = 60;

export default async function Home() {
  let leaders: Leader[] = [];
  let featuredAchievements: Achievement[] = [];
  let featuredIntels: Intel[] = [];
  try {
    leaders = await apiServer<Leader[]>("/leadership");
  } catch {
    leaders = [];
  }
  try {
    featuredAchievements = await apiServer<Achievement[]>("/achievements?featured=true");
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
      <Achievements items={featuredAchievements} />
      <BlogPreview items={featuredIntels} />
      <GetInTouch />
      <CTASection />
    </>
  );
}