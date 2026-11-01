"use client";
import React from "react";
import { DEPARTMENTS } from "../../constants";
import SectionTitle from "../ui/SectionTitle";
import { motion } from "framer-motion";

const Departments: React.FC = () => {
  return (
    <section id="departments" className="py-24 bg-black relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle
          title="Departments"
          subtitle="Specialized teams driving innovation"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEPARTMENTS.map((department, index) => (
            <motion.div
              key={department.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative bg-dc-panel p-8 border border-white/5 hover:border-white/30 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div
                className={`mb-6 p-4 rounded-lg bg-black/50 w-fit border border-white/10 group-hover:border-white/40 transition-colors`}
              >
                <department.icon className={`w-10 h-10 ${department.color}`} />
              </div>

              <h3 className="text-2xl font-orbitron font-bold text-white mb-3 group-hover:text-slate-200">
                {department.title}
              </h3>
              <p className="font-rajdhani text-slate-400 leading-relaxed">
                {department.description}
              </p>

              <div className="absolute bottom-0 right-0 p-2">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-white/20"></div>
                  <div className="w-1 h-1 bg-white/20"></div>
                  <div className="w-1 h-1 bg-white/20"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Departments;
