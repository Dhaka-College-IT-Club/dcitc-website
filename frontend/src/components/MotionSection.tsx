"use client";

import React from "react";
import { motion } from "framer-motion";
import SectionTitle from "./UI/SectionTitle";

interface MotionSectionProps {
  id: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const MotionSection: React.FC<MotionSectionProps> = ({
  id,
  title,
  subtitle,
  children,
  className = "py-24 bg-black relative",
}) => {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {title && subtitle && (
          <SectionTitle title={title} subtitle={subtitle} />
        )}

        {children}
      </div>
    </motion.section>
  );
};

export default MotionSection;
