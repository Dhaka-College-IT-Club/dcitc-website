import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DCITC - Dhaka College Information & Technology Club",
  description: "Official website for Dhaka College Information & Technology Club",
  icons: {
    icon: "/favicon.ico",
  },
};

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GetInTouch from "@/components/GetInTouch";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} font-sans antialiased bg-black text-slate-200 selection:bg-white selection:text-black min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="grow">
          {children}
        </main>
        <GetInTouch />
        <Footer />
      </body>
    </html>
  );
}
