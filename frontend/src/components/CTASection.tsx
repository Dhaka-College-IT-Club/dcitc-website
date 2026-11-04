import Button from "./ui/Button";
import { Container, Section } from "./ui/Section";

export default function CTASection() {
  return (
    <Section id="join" seam className="overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(34,211,238,0.08),transparent_70%)]"
      />
      <Container className="relative text-center">
        <h2 className="type-h2 uppercase">
          Ready to <span className="text-accent">initiate?</span>
        </h2>
        <p className="type-body mx-auto mt-4 max-w-xl text-subtle">
          Join the elite tech enthusiasts of Dhaka College.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/signup">Join DCITC</Button>
        </div>
      </Container>
    </Section>
  );
}
