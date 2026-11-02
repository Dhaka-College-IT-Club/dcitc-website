"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { CLUB, NAV_ITEMS, SOCIAL_URLS } from "../constants";

const Footer: React.FC = () => {
  const socialLinks = [
    { icon: Facebook, href: SOCIAL_URLS.facebook, label: "Facebook" },
    { icon: Instagram, href: SOCIAL_URLS.instagram, label: "Instagram" },
    { icon: Linkedin, href: SOCIAL_URLS.linkedin, label: "LinkedIn" },
    { icon: Youtube, href: SOCIAL_URLS.youtube, label: "YouTube" },
    { icon: Mail, href: "mailto:dhakacollegeitclubofficial@gmail.com", label: "Email" },
  ];

  return (
    <footer className="bg-black border-t border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="DCITC Logo" width={48} height={48} className="object-contain" />
              <div>
                <h4 className="font-orbitron font-bold text-lg text-white tracking-wider">
                  DCITC
                </h4>
                <p className="font-rajdhani text-xs text-slate-500 tracking-widest uppercase">
                  Shaping Tomorrow Today
                </p>
              </div>
            </div>
            <p className="font-rajdhani text-slate-400 text-sm tracking-wide max-w-xs">
              To enrich higher secondary level DCians with core and deep knowledge of Robotics, Programming, Cybersecurity, and Artificial Intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-rajdhani text-slate-400 text-sm tracking-wide hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#contact" className="font-rajdhani text-slate-400 text-sm tracking-wide hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase mb-4">
              Contact
            </h4>
            <ul className="space-y-2 font-rajdhani text-slate-400 text-sm tracking-wide">
              <li>Dhaka College, Dhaka, Bangladesh</li>
              <li>
                <a href="mailto:dhakacollegeitclubofficial@gmail.com" className="hover:text-white transition-colors break-all">
                  dhakacollegeitclubofficial@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-orbitron font-bold text-sm text-white tracking-widest uppercase mb-4">
              Connect
            </h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 flex items-center justify-center border border-slate-700 rounded hover:bg-white hover:text-black hover:border-white transition-all duration-300 text-slate-400"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs font-rajdhani text-slate-600 uppercase tracking-widest text-center md:text-left">
          <p>
            &copy; {new Date().getFullYear()} Dhaka College Information & Technology Club. All rights reserved.
            <span className="ml-2 text-slate-700">v{CLUB.VERSION}</span>
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-4">
            <Link
              href="/privacy"
              className="font-rajdhani text-[10px] md:text-xs uppercase tracking-widest text-slate-600 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="font-rajdhani text-[10px] md:text-xs uppercase tracking-widest text-slate-600 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Terms of Service
            </Link>
          </nav>
          <p>
            Designed & Developed by <span className="text-orange-500">DCITC Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;