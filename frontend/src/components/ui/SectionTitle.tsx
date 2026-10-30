"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, align = 'center' }) => {
  const alignmentClass = align === 'left' ? 'text-left items-start' : align === 'right' ? 'text-right items-end' : 'text-center items-center';

  return (
    <div className={`flex flex-col ${alignmentClass} mb-16 relative z-10`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-bold text-white tracking-widest uppercase mb-4 relative inline-block">
          <span className="relative z-10">{title}</span>
          <span className="absolute -bottom-2 left-0 w-full h-1 bg-linear-to-r from-transparent via-slate-500 to-transparent"></span>
          <span className="absolute -top-6 -left-6 text-5xl sm:text-6xl text-slate-800 opacity-20 select-none blur-sm pointer-events-none">
            {title}
          </span>
        </h2>
        {subtitle && (
          <p className="text-slate-400 font-rajdhani text-xl tracking-wide max-w-2xl mt-4">
            {subtitle}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default SectionTitle;