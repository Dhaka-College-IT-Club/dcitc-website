"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Facebook, Linkedin } from "lucide-react";
import SectionTitle from "../UI/SectionTitle";
import { LEADERSHIP } from "../../constants";
import { LeadershipMember } from "../../types";

const LEADERSHIP_MEMBERS: LeadershipMember[] =
  LEADERSHIP.MEMBERS as LeadershipMember[];
const LEADERSHIP_BATCHES: string[] = ["DC-27", "DC-26", "DC-25"];
const LEADERSHIP_SUBTITLE: string = LEADERSHIP.SUBTITLE;
const LEADERSHIP_EXEC_LABEL: string = LEADERSHIP.LABELS.EXECUTIVE;
const LEADERSHIP_CHIEF_LABEL: string = LEADERSHIP.LABELS.CHIEF;
const LEADERSHIP_JOINT_LABEL: string = LEADERSHIP.LABELS.JOINT;

const Leadership: React.FC = () => {
  const [activeBatch, setActiveBatch] = useState<string>("DC-26");
  const batchMembers = LEADERSHIP_MEMBERS.filter(
    (m) => m.batch === activeBatch
  );
  const executives = batchMembers.filter((m) => m.tier === "executive");
  const chiefs = batchMembers.filter((m) => m.tier === "chief");
  const joints = batchMembers.filter((m) => m.tier === "joint");

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut" as const,
      },
    }),
  };

  const LeaderCard = ({
    member,
    index,
    size = "normal",
  }: {
    member: LeadershipMember;
    index: number;
    size?: "large" | "normal" | "small";
  }) => {
    const sizeClasses: Record<"large" | "normal" | "small", string> = {
      large: "w-48 h-48 md:w-56 md:h-56",
      normal: "w-40 h-40 md:w-48 md:h-48",
      small: "w-36 h-36 md:w-40 md:h-40",
    };

    return (
      <motion.div
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={cardVariants}
        className="group relative flex flex-col items-center h-full"
      >
        <div className={`relative ${sizeClasses[size]} mb-4 overflow-hidden`}>
          <div
            className="absolute inset-0 border border-white/10 group-hover:border-white/40 transition-all duration-500 bg-linear-to-br from-white/5 to-transparent"
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
            <Image
              src={member.image}
              alt={`${member.name} - ${member.role}`}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 border-t border-l border-white/30 group-hover:border-white/60 transition-colors"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 border-b border-r border-white/30 group-hover:border-white/60 transition-colors"></div>
        </div>

        <div className="text-center flex flex-col items-center flex-1 w-full">
          <h3 className="font-orbitron text-white text-sm md:text-base font-bold tracking-wider uppercase mb-1 min-h-[2.5rem] md:min-h-[2.75rem] flex items-end justify-center">
            {member.name}
          </h3>
          <p className="font-rajdhani text-slate-400 text-sm md:text-base tracking-wide min-h-[1.5rem] flex items-start justify-center">
            {member.role}
          </p>
          {(member.facebook || member.linkedin) && (
            <div className="flex justify-center gap-3 mt-auto pt-4">
              {member.facebook && (
                <a
                  href={member.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/15 bg-white/[0.04] text-slate-300 hover:text-white hover:border-white/40 hover:bg-white/[0.1] transition-all"
                  aria-label={`${member.name} Facebook`}
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/15 bg-white/[0.04] text-slate-300 hover:text-white hover:border-white/40 hover:bg-white/[0.1] transition-all"
                  aria-label={`${member.name} LinkedIn`}
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/20 to-transparent animate-[scan_2s_linear_infinite]"></div>
        </div>
      </motion.div>
    );
  };

  return (
    <section
      id="leadership"
      className="py-24 bg-black relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionTitle title="Leadership" subtitle={LEADERSHIP_SUBTITLE} />

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            {LEADERSHIP_BATCHES.map((batch) => (
              <button
                key={batch}
                onClick={() => setActiveBatch(batch)}
                className={`px-5 py-2 font-orbitron text-xs tracking-widest uppercase rounded-full transition-all duration-300 ${
                  activeBatch === batch
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {batch}
              </button>
            ))}
          </div>
        </div>

        {batchMembers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-rajdhani text-xl">
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
            <div className="h-px w-8 sm:w-16 bg-linear-to-r from-transparent to-white/30"></div>
            <span className="px-4 font-orbitron text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-slate-500 uppercase">
              {LEADERSHIP_EXEC_LABEL}
            </span>
            <div className="h-px w-8 sm:w-16 bg-linear-to-l from-transparent to-white/30"></div>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {executives.map((member, index) => (
              <LeaderCard
                key={member.batch + '-' + member.name}
                member={member}
                index={index}
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
            <div className="h-px w-8 sm:w-16 bg-linear-to-r from-transparent to-white/20"></div>
            <span className="px-4 font-orbitron text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-slate-600 uppercase">
              {LEADERSHIP_CHIEF_LABEL}
            </span>
            <div className="h-px w-8 sm:w-16 bg-linear-to-l from-transparent to-white/20"></div>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {chiefs.map((member, index) => (
              <LeaderCard
                key={member.batch + '-' + member.name}
                member={member}
                index={index + executives.length}
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
              <div className="h-px w-8 sm:w-16 bg-linear-to-r from-transparent to-white/10"></div>
              <span className="px-4 font-orbitron text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-slate-700 uppercase">
                {LEADERSHIP_JOINT_LABEL}
              </span>
              <div className="h-px w-8 sm:w-16 bg-linear-to-l from-transparent to-white/10"></div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {joints.map((member, index) => (
                <LeaderCard
                  key={member.batch + '-' + member.name}
                  member={member}
                  index={index + executives.length + chiefs.length}
                  size="small"
                />
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>

      <div className="absolute top-1/4 left-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
      <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-white/3 blur-3xl rounded-full"></div>
    </section >
  );
};

export default Leadership;
