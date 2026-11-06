import type { Metadata } from "next";
import { Inter, Orbitron, Rajdhani } from "next/font/google";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dhaka College IT Club (DCITC) - Official Website",
    template: "%s | Dhaka College IT Club",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Dhaka College IT Club",
  authors: [{ name: "Dhaka College IT Club" }],
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Dhaka College IT Club (DCITC) - Official Website",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhaka College IT Club (DCITC) - Official Website",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${orbitron.variable} ${rajdhani.variable} font-sans antialiased bg-bg text-muted selection:bg-accent selection:text-bg min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}