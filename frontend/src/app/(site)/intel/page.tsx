import { apiServer } from "@/lib/api";
import IntelCard from "@/components/ui/IntelCard";
import type { Intel } from "@/lib/api-types";

export const revalidate = 60;

export default async function IntelsPage() {
  let intels: Intel[] = [];
  try {
    intels = await apiServer<Intel[]>("/intels");
  } catch {
    intels = [];
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-10">
          <p className="text-xs font-orbitron tracking-[0.3em] text-slate-500 uppercase mb-3">
            Intelligence Briefing
          </p>
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Intel
          </h1>
          <p className="text-slate-400 font-rajdhani text-lg">
            Latest insights and updates from the DCITC team
          </p>
        </header>

        {intels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-rajdhani text-xl">
              No intelligence reports available at this time.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {intels.map((intel) => (
              <IntelCard key={intel.id} intel={intel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
