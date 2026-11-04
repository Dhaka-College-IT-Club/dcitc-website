import Image from "next/image";
import { ChevronDown } from "lucide-react";
import Button from "./ui/Button";
import { Container } from "./ui/Section";
import { CLUB } from "../constants";

/**
 * Server-rendered hero. Height is one viewport minus the 4rem navbar, so the
 * next section never peeks and nothing spills below the fold on mobile.
 */
export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden py-12 md:py-16"
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
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:gap-12">
          <div className="enter-rise">
            <p className="type-overline mb-4 flex items-center gap-3 text-accent md:mb-5">
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

            <h1 className="type-body mt-4 max-w-md text-subtle md:mt-6">
              <span className="sr-only">{CLUB.NAME}</span>
              <span aria-hidden="true">{CLUB.NAME}</span>
            </h1>

            <div className="mt-6 md:mt-8">
              <Button href="/signup">Join DCITC</Button>
            </div>
          </div>

          {/* Rings and crest share one box, so the dashed orbit never clips. */}
          <div className="relative mx-auto flex h-52 w-52 items-center justify-center sm:h-64 sm:w-64 md:mx-0 md:ml-auto lg:h-80 lg:w-80">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-dashed border-line-strong motion-safe:animate-[spin_60s_linear_infinite]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-8 rounded-full border border-line"
            />
            <span
              aria-hidden="true"
              className="absolute inset-6 rounded-full bg-accent-soft blur-2xl"
            />

            <div className="relative h-36 w-36 sm:h-44 sm:w-44 lg:h-56 lg:w-56">
              <Image
                src="/hero.png"
                alt="DCITC crest"
                fill
                priority
                sizes="(min-width: 1024px) 224px, (min-width: 640px) 176px, 144px"
                className="object-contain"
              />
              <span
                aria-hidden="true"
                className="absolute -left-3 -top-3 h-5 w-5 border-l-2 border-t-2 border-accent/50"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-3 -right-3 h-5 w-5 border-b-2 border-r-2 border-accent/50"
              />
            </div>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-faint sm:flex md:bottom-5">
        <span className="type-overline">Scroll to initialise</span>
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </div>
    </section>
  );
}
