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
                  index === 0 ? "bg-transparent" : complete || active ? "bg-accent/40" : "bg-surface-2"
                }`}
              />
              <span
                className={`mx-2 inline-flex h-7 w-7 shrink-0 items-center justify-center border type-overline transition-colors ${
                  complete
                    ? "border-accent bg-accent text-bg"
                    : active
                      ? "border-white bg-bg text-text"
                      : "border-line-strong bg-bg text-faint"
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
                      ? "bg-accent/40"
                      : "bg-surface-2"
                }`}
              />
            </div>
            <span
              className={`mt-2 max-w-full truncate type-overline uppercase tracking-[0.14em] sm:text-3xs ${
                active ? "text-text" : complete ? "text-muted" : "text-faint"
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
