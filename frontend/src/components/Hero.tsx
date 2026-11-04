import Image from "next/image";
import Button from "./ui/Button";
import { Container } from "./ui/Section";
import { CLUB } from "../constants";

/**
 * Server-rendered hero. One viewport minus the 4rem navbar, so the next section
 * never peeks and nothing spills below the fold. The crest sits inside the
 * orbit rings at its own aspect ratio — no cropping, no photo in a circle.
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
        <div className="grid items-center gap-4 sm:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:gap-12">
          <div className="enter-rise">
            <p className="type-display uppercase">
              Shaping
              <br />
              <span className="text-accent">Tomorrow</span>
              <br />
              Today
            </p>

            <h1 className="type-body mt-5 max-w-md text-subtle md:mt-6">
              <span className="sr-only">{CLUB.NAME}</span>
              <span aria-hidden="true">{CLUB.NAME}</span>
            </h1>

            <div className="mt-7 md:mt-8">
              <Button href="/signup">Join DCITC</Button>
            </div>
          </div>

          <div className="relative mx-auto flex h-52 w-52 items-center justify-center sm:h-80 sm:w-80 md:mx-0 md:ml-auto lg:h-[24rem] lg:w-[24rem]">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-dashed border-line-strong opacity-70 motion-safe:animate-[spin_60s_linear_infinite]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-[12%] rounded-full border border-line"
            />
            <span
              aria-hidden="true"
              className="absolute inset-[24%] rounded-full bg-accent-soft opacity-70 blur-2xl"
            />

            <div className="relative h-40 w-40 sm:h-64 sm:w-64 lg:h-80 lg:w-80">
              <Image
                src="/logo.png"
                alt="Dhaka College IT Club crest"
                fill
                priority
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 256px, 192px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
