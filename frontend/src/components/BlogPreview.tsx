import Link from "next/link";
import MotionSection from "./MotionSection";
import IntelCard from "./ui/IntelCard";
import type { Intel } from "@/lib/api-types";

const BlogPreview = ({ items = [] }: { items?: Intel[] }) => {
  return (
    <MotionSection
      id="intel"
      title="Intel"
      subtitle="Latest Insights from the DCITC"
      className="py-24 bg-black relative"
    >
      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500 font-rajdhani text-lg">
            No intelligence reports available at this time.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((post) => (
              <IntelCard key={post.id} intel={post} />
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/intel"
              className="px-8 py-3 border-2 border-white/30 text-white font-orbitron font-bold tracking-wider hover:bg-white/10 transition-colors duration-300 -skew-x-12 inline-flex"
            >
              View All Intel<span className="sr-only"> articles</span>
            </Link>
          </div>
        </>
      )}
    </MotionSection>
  );
};

export default BlogPreview;
