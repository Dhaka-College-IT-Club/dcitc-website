import Image from "next/image";
import Button from "./ui/Button";
import { Container } from "./ui/Section";
import { CLUB } from "../constants";

/**
 * Server-rendered hero. On phones the stack is natural height, tucked up to
 * the navbar so heading, button and crest fit one screen; from md it fills the
 * viewport. One hairline ring and one static glow carry the crest — nothing
 * more, and never a filter on the artwork itself.
 */
export default function Hero() {
  return (
    <section
      id="hero"
      className={[
        "relative flex items-center overflow-hidden",
        "pt-[6.5rem] pb-10",
        "md:min-h-[100svh] md:pt-28 md:pb-16 lg:pt-32",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="tech-grid grid-fade pointer-events-none absolute inset-0 opacity-[0.15]"
      />
      <div
        aria-hidden="true"
        className="haze-layer pointer-events-none absolute inset-0 hidden md:block"
      />
      <div
        aria-hidden="true"
        className="haze-glow pointer-events-none absolute inset-0 opacity-80 md:hidden"
      />

      <Container>
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:gap-12">
          <div className="enter-rise">
            <p className="type-display uppercase">
              Shaping
              <br />
              <span className="text-accent">Tomorrow</span>
              <br />
              Today
            </p>

            <h1 className="type-body mt-4 max-w-[26rem] text-pretty text-subtle md:mt-6">
              <span className="sr-only">{CLUB.NAME}</span>
              <span aria-hidden="true">{CLUB.NAME}</span>
            </h1>

            <div className="mt-6 md:mt-8">
              <Button href="/signup">Join DCITC</Button>
            </div>
          </div>

          <div
            className={[
              "relative mx-auto flex items-center justify-center",
              "h-48 w-48 sm:h-60 sm:w-60 md:mx-0 md:ml-auto md:h-[18rem] md:w-[18rem]",
              "md:-translate-y-10 lg:h-[26rem] lg:w-[26rem]",
              "[@media(max-height:600px)]:h-40 [@media(max-height:600px)]:w-40",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-line opacity-60"
            />
            <span
              aria-hidden="true"
              className="absolute inset-[10%] rounded-full shadow-glow-soft"
            />

            <div
              className={[
                "relative h-40 w-40 sm:h-52 sm:w-52 md:h-[13rem] md:w-[13rem] lg:h-[19rem] lg:w-[19rem]",
                "[@media(max-height:600px)]:h-32 [@media(max-height:600px)]:w-32",
              ].join(" ")}
            >
              <Image
                src="/logo.png"
                alt="Dhaka College IT Club crest"
                fill
                priority
                sizes="(min-width: 1024px) 304px, (min-width: 768px) 208px, 160px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
