"use client";

import React from "react";
import MotionSection from "./MotionSection";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Intel } from "@/lib/api-types";

const BlogPreview: React.FC<{ items?: Intel[] }> = ({ items = [] }) => {
  return (
    <MotionSection
      id="intel"
      title="Intel"
      subtitle="Latest Insights from the DCITC"
      className="py-24 bg-dc-dark relative"
    >
      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-slate-500 font-rajdhani text-lg">
            No intelligence reports available at this time.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((post, index) => (
              <motion.a
                href={`/intel/${post.slug}`}
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group relative bg-dc-panel p-0 border border-white/5 hover:border-white/30 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 text-xs font-orbitron tracking-widest uppercase rounded bg-black/70 text-white`}
                  >
                    {post.tag || "Insight"}
                  </span>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-orbitron font-bold text-white mb-2 group-hover:text-slate-200 leading-tight">
                    {post.title}
                  </h3>
                  <p className="font-rajdhani text-slate-400 text-base mb-3 flex-grow">
                    {post.excerpt}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-auto">
                    <span className="text-xs font-rajdhani text-slate-500">
                      {post.date}
                    </span>
                    <span className="text-sm font-orbitron text-white/80 border-b border-transparent group-hover:border-white/50 transition-colors">
                      Read More →
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/intel"
              className="px-8 py-3 border-2 border-white/30 text-white font-orbitron font-bold tracking-wider hover:bg-white/10 transition-colors duration-300 -skew-x-12 inline-flex"
            >
              View All Intel
            </Link>
          </div>
        </>
      )}
    </MotionSection>
  );
};

export default BlogPreview;