"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CLUB } from "../constants";
import CTAButtons from "./CTAButtons";

const CLUB_NAME: string = CLUB.NAME;
const FOUNDED: string = CLUB.FOUNDED;

const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen sm:pb-10 flex items-center justify-center overflow-hidden bg-black pt-16 sm:pt-20"
    >
      <div className="absolute inset-0 bg-size-[50px_50px] bg-tech-grid opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black pointer-events-none"></div>

      <div className="absolute top-0 left-1/4 w-px h-full bg-linear-to-b from-transparent via-slate-500 to-transparent opacity-20 animate-pulse hidden md:block"></div>
      <div className="absolute top-0 right-1/4 w-px h-full bg-linear-to-b from-transparent via-slate-500 to-transparent opacity-20 animate-pulse delay-75 hidden md:block"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col items-center gap-8 md:hidden py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative flex justify-center w-full"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] border border-slate-800 rounded-full animate-spin-slow opacity-30 border-dashed"></div>
              <div
                className="absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] border border-slate-700 rounded-full animate-spin-slow opacity-20"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "20s",
                }}
              ></div>
            </div>

            <div className="relative w-56 h-56 sm:w-72 sm:h-72 group">
              <div className="absolute inset-0 bg-slate-500/10 blur-[50px] rounded-full group-hover:bg-slate-500/20 transition-all duration-500"></div>
              <Image
                src="/hero.png"
                alt="DCITC Shield Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] grayscale contrast-125 brightness-110"
                priority
              />

              <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-slate-400"></div>
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-slate-400"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-center w-full px-4"
          >


            <h1 className="text-4xl sm:text-5xl font-bold font-orbitron text-white leading-tight mb-4">
              SHAPING <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-slate-300 to-slate-500">
                TOMORROW
              </span>{" "}
              <br />
              TODAY
            </h1>

            <p className="text-slate-400 font-rajdhani text-base sm:text-lg mb-6 tracking-wide max-w-lg mx-auto px-2">
              {CLUB_NAME}
            </p>

            <CTAButtons />
          </motion.div>
        </div>

        <div className="hidden md:grid md:grid-cols-2 gap-12 lg:gap-16 items-center py-12">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >


              <h1 className="text-5xl lg:text-7xl font-bold font-orbitron text-white leading-tight mb-6">
                SHAPING <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-slate-300 to-slate-500">
                  TOMORROW
                </span>{" "}
                <br />
                TODAY
              </h1>

              <p className="text-slate-400 font-rajdhani text-xl lg:text-2xl mb-8 tracking-wide max-w-xl mx-auto lg:mx-0">
                {CLUB_NAME}
              </p>

              <CTAButtons />
            </motion.div>
          </div>
          <div className="flex justify-center lg:justify-end relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[400px] h-[400px] lg:w-[500px] lg:h-[500px] border border-slate-800 rounded-full animate-spin-slow opacity-30 border-dashed"></div>
              <div
                className="absolute w-[320px] h-[320px] lg:w-[400px] lg:h-[400px] border border-slate-700 rounded-full animate-spin-slow opacity-20"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "20s",
                }}
              ></div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative z-10"
            >
              <div className="relative w-80 h-80 lg:w-96 lg:h-96 group">
                <div className="absolute inset-0 bg-slate-500/10 blur-[50px] rounded-full group-hover:bg-slate-500/20 transition-all duration-500"></div>
                <Image
                  src="/hero.png"
                  alt="DCITC Shield Logo"
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] grayscale contrast-125 brightness-110"
                  priority
                />

                <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-slate-400"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-slate-400"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-4 sm:bottom-2 left-1/2 -translate-x-1/2 text-slate-500 hidden sm:flex flex-col items-center gap-2 z-30"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[10px] font-orbitron tracking-[0.3em] uppercase">
          Scroll to Initialize
        </span>
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
};

export default Hero;
