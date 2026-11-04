"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { FOOTER_LINKS, SOCIAL_URLS } from "../constants";

const Footer: React.FC = () => {
  const socialLinks = [
    { icon: Facebook, href: SOCIAL_URLS.facebook, label: "Facebook" },
    { icon: Instagram, href: SOCIAL_URLS.instagram, label: "Instagram" },
    { icon: Linkedin, href: SOCIAL_URLS.linkedin, label: "LinkedIn" },
    { icon: Youtube, href: SOCIAL_URLS.youtube, label: "YouTube" },
    { icon: Mail, href: "mailto:dhakacollegeitclubofficial@gmail.com", label: "Email" },
  ];

  return (
    <footer className="bg-bg border-t border-line relative overflow-hidden">
      <div
        aria-hidden="true"
        className="tech-grid pointer-events-none absolute inset-0 opacity-[0.04]"
      />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="DCITC Logo" width={48} height={48} className="object-contain" />
              <div>
                <h4 className="type-h3 font-bold text-text tracking-wider">
                  DCITC
                </h4>
                <p className="type-caption text-faint tracking-widest uppercase">
                  Shaping Tomorrow Today
                </p>
              </div>
            </div>
            <p className="type-body-sm text-subtle tracking-wide max-w-xs">
              To enrich higher secondary level DCians with core and deep knowledge of Robotics, Programming, Cybersecurity, and Artificial Intelligence.
            </p>
          </div>

          <div>
            <h4 className="type-overline mb-4 text-subtle">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="type-body-sm text-subtle tracking-wide hover:text-text transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/#contact" className="type-body-sm text-subtle transition-colors hover:text-text">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="type-overline mb-4 text-subtle">
              Contact
            </h4>
            <ul className="type-body-sm space-y-2 text-subtle">
              <li>Dhaka College, Dhaka, Bangladesh</li>
              <li>
                <a href="mailto:dhakacollegeitclubofficial@gmail.com" className="hover:text-text transition-colors break-all">
                  dhakacollegeitclubofficial@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="type-overline mb-4 text-subtle">
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
                  className="flex h-10 w-10 items-center justify-center border border-line text-subtle transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-center type-caption text-faint md:flex-row md:text-left">
          <p>
            &copy; {new Date().getFullYear()} Dhaka College Information & Technology Club. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-4">
            <Link
              href="/privacy"
              className="type-caption text-faint transition-colors hover:text-text"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="type-caption text-faint transition-colors hover:text-text"
            >
              Terms of Service
            </Link>
          </nav>
          <p>
            Designed &amp; Developed by <span className="text-accent">DCITC Team</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;