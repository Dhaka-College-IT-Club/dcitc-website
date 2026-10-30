import React from "react";
import { ArrowRight } from "lucide-react";

const CTAButtons: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start overflow-hidden max-w-full px-2">
      <a
        href="/signup"
        className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-orbitron font-bold tracking-wider hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 -skew-x-10 group"
      >
        <span className="skew-x-10 text-sm sm:text-base">JOIN DCITC</span>
        <ArrowRight className="w-4 h-4 skew-x-10 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  );
};

export default CTAButtons;