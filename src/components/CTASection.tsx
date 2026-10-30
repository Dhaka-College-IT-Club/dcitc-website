"use client";
import React from "react";

const CTASection: React.FC = () => {
  return (
    <section
      id="join"
      className="py-20 sm:py-32 relative overflow-hidden flex items-center justify-center border-t border-white/5"
    >
      <div className="absolute inset-0 bg-white/5"></div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-full">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-orbitron font-bold text-white mb-4 sm:mb-6">
          READY TO <span className="text-slate-400">INITIATE?</span>
        </h2>

        <p className="text-slate-400 font-rajdhani text-base sm:text-xl mb-8 sm:mb-10 max-w-xl mx-auto px-4">
          Join the elite tech enthusiasts of Dhaka College.
        </p>

        <a
          href="https://facebook.com/DCITC"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-orbitron font-bold tracking-wider hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2 -skew-x-10 group shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-[1.02] cursor-pointer mx-auto"
        >
          <span className="skew-x-12">JOIN DCITC</span>
        </a>
      </div>
    </section>
  );
};

export default CTASection;
