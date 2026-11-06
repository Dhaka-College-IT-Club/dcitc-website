import { Code2, Users, Trophy, Rocket, BookOpen, Network } from "lucide-react";
import { CLUB } from "../constants";
import Card from "./ui/Card";
import Reveal from "./ui/Reveal";
import { Container, Section } from "./ui/Section";
import SectionTitle from "./ui/SectionTitle";

const benefits = [
  { icon: Code2, title: "Hands-on Coding", desc: "Build real projects across web, AI, and cybersecurity with peers." },
  { icon: Users, title: "Community", desc: "Join a tight-knit circle of tech enthusiasts from Dhaka College." },
  { icon: Trophy, title: "Competitions", desc: "Compete in hackathons, contests, and inter-club showdowns." },
  { icon: Rocket, title: "Launchpad", desc: "Turn ideas into shipped products with mentorship and resources." },
  { icon: BookOpen, title: "Workshops", desc: "Learn from seniors and industry guests through regular sessions." },
  { icon: Network, title: "Network", desc: "Connect with alumni, sponsors, and the wider tech ecosystem." },
];

export default function WhyJoin() {
  return (
    <Section id="why-join" seam>
      <Container>
        <Reveal>
          <SectionTitle
            eyebrow="Why join"
            title="Why Join DCITC"
            subtitle="What you gain by being part of the club"
          />

          <p className="type-body mt-8 max-w-3xl text-center text-subtle max-md:mx-0 max-md:max-w-[34rem] max-md:text-left md:mx-auto">
            Dhaka College IT Club (DCITC) is a student technology club at Dhaka
            College in Dhaka, Bangladesh. Also known as the Dhaka College
            Information Technology Club, its mission is clear:{" "}
            {CLUB.MISSION.STATEMENT} This website is the club&apos;s public home.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <Card key={title} as="article" interactive tick>
                <div className="mb-5 flex h-12 w-12 items-center justify-center border border-line-strong bg-surface-2 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="type-h4 uppercase tracking-wide">{title}</h3>
                <p className="type-body-sm mt-2 text-subtle">{desc}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
