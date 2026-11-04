import Image from "next/image";
import { ChevronDown } from "lucide-react";
import Button from "./ui/Button";
import { Container } from "./ui/Section";
import { CLUB } from "../constants";

/** Server-rendered hero: no client JS, one CSS entrance, brand asset in colour. */
export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[88svh] items-center overflow-hidden pb-16 pt-28"
    >
      <div
        aria-hidden="true"
        className="tech-grid pointer-events-none absolute inset-0 opacity-[0.15]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_78%_18%,rgba(34,211,238,0.10),transparent_70%)]"
      />

      <Container>
        <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div className="enter-rise">
            <p className="type-overline mb-5 flex items-center gap-3 text-accent">
              <span aria-hidden="true" className="h-px w-8 bg-accent/60" />
              Dhaka College · Est. {CLUB.FOUNDED}
            </p>

            <p className="type-display uppercase">
              Shaping
              <br />
              <span className="text-accent">Tomorrow</span>
              <br />
              Today
            </p>

            <h1 className="type-body mt-6 max-w-md text-subtle">
              <span className="sr-only">{CLUB.NAME}</span>
              <span aria-hidden="true">{CLUB.NAME}</span>
            </h1>

            <div className="mt-8">
              <Button href="/signup">Join DCITC</Button>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="h-[300px] w-[300px] rounded-full border border-dashed border-line-strong motion-safe:animate-[spin_60s_linear_infinite] lg:h-[380px] lg:w-[380px]" />
              <div className="absolute h-[240px] w-[240px] rounded-full border border-line lg:h-[300px] lg:w-[300px]" />
            </div>

            <div className="relative h-64 w-64 lg:h-80 lg:w-80">
              <div
                aria-hidden="true"
                className="absolute inset-6 rounded-full bg-accent-soft blur-3xl"
              />
              <Image
                src="/hero.png"
                alt="DCITC crest"
                fill
                priority
                sizes="(min-width: 1024px) 320px, 256px"
                className="object-contain"
              />
              <span
                aria-hidden="true"
                className="absolute -left-3 -top-3 h-6 w-6 border-l-2 border-t-2 border-accent/50"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-3 -right-3 h-6 w-6 border-b-2 border-r-2 border-accent/50"
              />
            </div>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-faint sm:flex">
        <span className="type-overline">Scroll to initialise</span>
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </div>
    </section>
  );
}
