"use client";
import React from "react";
import { Code2, Users, Trophy, Rocket, BookOpen, Network } from "lucide-react";
import { CLUB } from "../constants";
import SectionTitle from "./ui/SectionTitle";

const benefits = [
  { icon: Code2, title: "Hands-on Coding", desc: "Build real projects across web, AI, and cybersecurity with peers." },
  { icon: Users, title: "Community", desc: "Join a tight-knit circle of tech enthusiasts from Dhaka College." },
  { icon: Trophy, title: "Competitions", desc: "Compete in hackathons, contests, and inter-club showdowns." },
  { icon: Rocket, title: "Launchpad", desc: "Turn ideas into shipped products with mentorship and resources." },
  { icon: BookOpen, title: "Workshops", desc: "Learn from seniors and industry guests through regular sessions." },
  { icon: Network, title: "Network", desc: "Connect with alumni, sponsors, and the wider tech ecosystem." },
];

const WhyJoin: React.FC = () => {
  return (
    <section id="why-join" className="py-24 bg-bg relative overflow-hidden border-t border-line">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionTitle title="Why Join DCITC" subtitle="What you gain by being part of the club" />

        <p className="mx-auto mb-12 max-w-3xl text-center font-rajdhani text-lg leading-relaxed tracking-wide text-subtle">
          Dhaka College IT Club (DCITC) is a student technology club at Dhaka
          College in Dhaka, Bangladesh. Also known as the Dhaka College
          Information Technology Club, its mission is clear: {CLUB.MISSION.STATEMENT}{" "}
          This website is the club&apos;s public home.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group border border-line bg-white/[0.02] p-6 hover:border-line-strong hover:bg-surface-2 transition-all duration-300"
            >
              <div className="w-12 h-12 flex items-center justify-center border border-line-strong text-muted mb-4 group-hover:text-text group-hover:border-line-strong/40 transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-orbitron text-text text-sm md:text-base font-bold tracking-wider uppercase mb-2">
                {title}
              </h3>
              <p className="font-rajdhani text-subtle text-base tracking-wide">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/3 blur-3xl rounded-full pointer-events-none" />
    </section>
  );
};

export default WhyJoin;