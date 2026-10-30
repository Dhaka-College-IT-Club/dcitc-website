import { Check } from "lucide-react";

export default function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex w-full items-start" aria-label="Signup progress">
      {steps.map((step, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;

        return (
          <li
            key={step}
            className="flex min-w-0 flex-1 flex-col items-center"
            aria-current={active ? "step" : undefined}
          >
            <div className="flex w-full items-center">
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${
                  index === 0 ? "bg-transparent" : complete || active ? "bg-white/40" : "bg-white/10"
                }`}
              />
              <span
                className={`mx-2 inline-flex h-7 w-7 shrink-0 items-center justify-center border font-orbitron text-[10px] transition-colors ${
                  complete
                    ? "border-white bg-white text-black"
                    : active
                      ? "border-white bg-black text-white"
                      : "border-white/15 bg-black text-slate-500"
                }`}
              >
                {complete ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  number
                )}
              </span>
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${
                  index === steps.length - 1
                    ? "bg-transparent"
                    : complete
                      ? "bg-white/40"
                      : "bg-white/10"
                }`}
              />
            </div>
            <span
              className={`mt-2 max-w-full truncate font-orbitron text-[9px] uppercase tracking-[0.14em] sm:text-[10px] ${
                active ? "text-white" : complete ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
