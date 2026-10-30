import Hero from "@/components/Hero";
import WhyJoin from "@/components/WhyJoin";

import Departments from "@/components/Departments/Departments";
import Leadership from "@/components/Leadership/Leadership";
import Achievements from "@/components/Achievements";
import BlogPreview from "@/components/BlogPreview";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyJoin />
      <Departments />
      <Leadership />
      <Achievements />
      <BlogPreview />
      <CTASection />
    </>
  );
}
