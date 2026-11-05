"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Facebook, Linkedin, Github, Globe } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import { LEADERSHIP } from "../../constants";
import type { Leader } from "../../lib/api-types";
import { isOptimizableImage, resolveImageUrl } from "../../lib/images";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "DC";
}

function LeaderImage({ member }: { member: Leader }) {
  const resolved = resolveImageUrl(member.image);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-2 to-bg">
        <span
          role="img"
          aria-label={member.name}
          className="type-h3 font-bold tracking-[0.2em] text-subtle"
        >
          {initials(member.name)}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={`${member.name} - ${member.role}`}
      fill
      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      // A host outside next.config's allow-list must render, not throw.
      unoptimized={!isOptimizableImage(resolved)}
      className="object-cover transition-all duration-500 group-hover:scale-110"
      onError={() => setFailed(true)}
    />
  );
}

const LEADERSHIP_SUBTITLE: string = LEADERSHIP.SUBTITLE;
const LEADERSHIP_EXEC_LABEL: string = LEADERSHIP.LABELS.EXECUTIVE;
const LEADERSHIP_CHIEF_LABEL: string = LEADERSHIP.LABELS.CHIEF;
const LEADERSHIP_JOINT_LABEL: string = LEADERSHIP.LABELS.JOINT;

const Leadership: React.FC<{ members?: Leader[] }> = ({ members = [] }) => {
  const LEADERSHIP_BATCHES: string[] = Array.from(
    new Set(members.map((m) => m.batch))
  ).sort().reverse();
  const [activeBatch, setActiveBatch] = useState<string>(
    LEADERSHIP_BATCHES[0] ?? ""
  );
  const batchMembers = members.filter((m) => m.batch === activeBatch);
  const executives = batchMembers.filter((m) => m.tier === "executive");
  const chiefs = batchMembers.filter((m) => m.tier === "chief");
  const joints = batchMembers.filter((m) => m.tier === "joint");

  const LeaderCard = ({
    member,
    size = "normal",
  }: {
    member: Leader;
    size?: "large" | "normal" | "small";
  }) => {
    const sizeClasses: Record<"large" | "normal" | "small", string> = {
      large: "w-48 h-48 md:w-56 md:h-56",
      normal: "w-40 h-40 md:w-48 md:h-48",
      small: "w-36 h-36 md:w-40 md:h-40",
    };

    return (
      <div className="group relative flex h-full flex-col items-center">
        <div className={`relative ${sizeClasses[size]} mb-4 overflow-hidden`}>
          <div
            className="hex-glow absolute inset-0 border border-line bg-linear-to-br from-surface-2 to-transparent group-hover:border-accent"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          ></div>

          <div
            className="absolute inset-2 overflow-hidden"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            {member.image ? (
              <LeaderImage member={member} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-surface-2 to-bg">
                <span
                  role="img"
                  aria-label={member.name}
                  className="type-h3 font-bold tracking-[0.2em] text-subtle"
                >
                  {initials(member.name)}
                </span>
              </div>
            )}
            <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bg/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>

          <span aria-hidden="true" className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 border-l border-t border-accent/40" />
          <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 border-b border-r border-accent/40" />
        </div>

        <div className="text-center flex flex-col items-center flex-1 w-full">
          <h3 className="type-h4 mb-1 flex min-h-[2.5rem] items-end justify-center text-center uppercase tracking-wide md:min-h-[2.75rem]">
            {member.name}
          </h3>
          <p className="type-caption flex min-h-[1.5rem] items-start justify-center text-center text-subtle">
            {member.role}
          </p>
          {(member.facebook || member.linkedin || member.github || member.portfolio) && (
            <div className="flex justify-center gap-3 mt-auto pt-4">
              {member.facebook && (
                <a
                  href={member.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center border border-line text-subtle transition-colors hover:border-accent/60 hover:text-accent"
                  aria-label={`${member.name} Facebook`}
                >
                  <Facebook className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center border border-line text-subtle transition-colors hover:border-accent/60 hover:text-accent"
                  aria-label={`${member.name} LinkedIn`}
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {member.github && (
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center border border-line text-subtle transition-colors hover:border-accent/60 hover:text-accent"
                  aria-label={`${member.name} GitHub`}
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {member.portfolio && (
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center border border-line text-subtle transition-colors hover:border-accent/60 hover:text-accent"
                  aria-label={`${member.name} Portfolio`}
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      id="leadership"
      className="section-seam relative scroll-mt-20 overflow-hidden bg-bg py-16 md:py-24"
    >
      <div
        aria-hidden="true"
        className="tech-grid pointer-events-none absolute inset-0 opacity-[0.04]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
        <SectionTitle
          eyebrow="The panel"
          title="Leadership"
          subtitle={LEADERSHIP_SUBTITLE}
        />

        <div className="flex justify-center mb-12">
          <Card padding="p-1" className="inline-flex items-center gap-1">
            {LEADERSHIP_BATCHES.map((batch) => (
              <button
                key={batch}
                onClick={() => setActiveBatch(batch)}
                className={`type-overline px-5 py-2 transition-colors duration-200 ${
                  activeBatch === batch
                    ? "bg-accent text-bg"
                    : "text-subtle hover:text-text"
                }`}
              >
                {batch}
              </button>
            ))}
          </Card>
        </div>

        {batchMembers.length === 0 ? (
          <div className="py-20 text-center">
            <p className="type-body text-faint">
              Panel coming soon
            </p>
          </div>
        ) : (
          <>
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center mb-8 text-center"
          >
            <div className="h-px w-8 bg-linear-to-r from-transparent to-line-strong sm:w-16" />
            <span className="type-overline px-4 text-faint">
              {LEADERSHIP_EXEC_LABEL}
            </span>
            <div className="h-px w-8 bg-linear-to-l from-transparent to-line-strong sm:w-16" />
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {executives.map((member) => (
              <LeaderCard
                key={member.batch + '-' + member.name}
                member={member}
                size="large"
              />
            ))}
          </div>
        </div>

        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex justify-center items-center mb-8 text-center"
          >
            <div className="h-px w-8 bg-linear-to-r from-transparent to-line-strong sm:w-16" />
            <span className="type-overline px-4 text-faint">
              {LEADERSHIP_CHIEF_LABEL}
            </span>
            <div className="h-px w-8 bg-linear-to-l from-transparent to-line-strong sm:w-16" />
          </motion.div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {chiefs.map((member) => (
              <LeaderCard
                key={member.batch + '-' + member.name}
                member={member}
                size="normal"
              />
            ))}
          </div>
        </div>

        {joints.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex justify-center items-center mb-8 text-center"
            >
              <div className="h-px w-8 bg-linear-to-r from-transparent to-line-strong sm:w-16" />
              <span className="type-overline px-4 text-faint">
                {LEADERSHIP_JOINT_LABEL}
              </span>
              <div className="h-px w-8 bg-linear-to-l from-transparent to-line-strong sm:w-16" />
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {joints.map((member) => (
                <LeaderCard
                  key={member.batch + '-' + member.name}
                  member={member}
                  size="small"
                />
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </section >
  );
};

export default Leadership;
