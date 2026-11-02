import { Globe, Palette, PenLine, ShieldCheck, Bot, Braces } from "lucide-react";
import { NavItem, DomainFeature, Achievement } from "./types";

export const CLUB = {
  VERSION: "2.0.0",
  NAME: "Dhaka College Information & Technology Club",
  SHORT: "DCITC",
  MOTTO: "Shaping Tomorrow Today",
  FOUNDED: "2025",
  LOGO_URL: "/logo.png",
  MISSION: {
    STATEMENT:
      'To enrich higher secondary level DCians with core and deep knowledge of Robotics, Programming, Cybersecurity, and Artificial Intelligence. We dig into the world of technology with our motto "Shaping Tomorrow Today".',
  },
};

/**
 * Both legal pages read the review date from here so /privacy and /terms cannot
 * drift apart. Bump LAST_UPDATED and LAST_UPDATED_ISO together when either
 * document's copy changes.
 */
export const LEGAL = {
  LAST_UPDATED: "1 November 2026",
  LAST_UPDATED_ISO: "2026-11-01",
  CONTACT_EMAIL: "dhakacollegeitclubofficial@gmail.com",
} as const;

/** Public profiles that exist today; reused by the footer and JSON-LD. */
export const SOCIAL_URLS = {
  facebook: "https://www.facebook.com/DCITC",
  instagram: "https://www.instagram.com/dcitc_official/",
  linkedin: "https://www.linkedin.com/company/dhaka-college-it-club/",
  youtube: "https://www.youtube.com/@DhakacollegeITClub",
} as const;

export const NAV_ITEMS: NavItem[] = [
  { label: "Departments", href: "/#departments" },
  { label: "Leadership", href: "/#leadership" },
  { label: "Achievements", href: "/achievements" },
  { label: "Intel", href: "/intel" },
];

/** Footer links point at the dedicated pages instead of the homepage anchors. */
export const FOOTER_LINKS: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Departments", href: "/departments" },
  { label: "Leadership", href: "/leadership" },
  { label: "Achievements", href: "/achievements" },
  { label: "Intel", href: "/intel" },
];

export const DEPARTMENTS: DomainFeature[] = [
  {
    title: "Web Development",
    description:
      "Engineering modern, responsive web platforms and digital experiences that power DCITC's online presence.",
    icon: Globe,
    color: "text-cyan-300",
  },
  {
    title: "Graphics & Design",
    description:
      "Designing visual identities, event collateral, and digital assets that represent the club across all media.",
    icon: Palette,
    color: "text-pink-300",
  },
  {
    title: "Content Writing & Publication",
    description:
      "Crafting compelling technical and creative content, publications, and communications that shape the voice of DCITC.",
    icon: PenLine,
    color: "text-yellow-300",
  },
  {
    title: "Cyber Security",
    description:
      "Safeguarding the club's digital infrastructure through cybersecurity practices and awareness.",
    icon: ShieldCheck,
    color: "text-red-300",
  },
  {
    title: "Robotics & Programming",
    description:
      "Building software and robotics projects, from algorithms to autonomous systems, powering innovation at DCITC.",
    icon: Bot,
    color: "text-purple-300",
  },
  {
    title: "Competitive Programming",
    description:
      "Sharpening algorithmic problem-solving skills through contests, training sessions, and collaborative practice.",
    icon: Braces,
    color: "text-orange-300",
  },
];

export const LEADERSHIP = {
  MEMBERS: [
    {
      name: "AHNAF HASAN",
      role: "President",
      image: "/leadership/panel2025/president_2025.jpg",
      tier: "executive",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "MUHAMMAD HASIN RAIHAN",
      role: "General Secretary",
      image: "/leadership/panel2025/general_secretary_2025.jpg",
      tier: "executive",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "MALOY ROY ORKO",
      role: "Vice President",
      image: "/leadership/panel2025/vice_president_2025.jpg",
      tier: "executive",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "HUSAIN ZUHAIR ZUHAN",
      role: "Chief Executive of Administration",
      image: "/leadership/panel2025/chief_executive_of_administration_2025.jpg",
      tier: "chief",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "MUHTASIM MUIN",
      role: "Chief Executive of Graphics and Design",
      image: "/leadership/panel2025/CE of grahics and design 2025.jpg",
      tier: "chief",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "MD. JUNAYET HASSAN",
      role: "Chief Executive of Robotics and Programming",
      image: "/leadership/panel2025/CE of robotics and programming 2025.jpg",
      tier: "chief",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "KAZI MD MAINUL ISLAM TANVIR",
      role: "Chief Executive of Web and App Development",
      image: "/leadership/panel2025/CE of web and app developement 2025.jpg",
      tier: "chief",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "MUHAMMAD ARMAN",
      role: "Chief Executive of Public Relations",
      image: "/leadership/panel2025/CE of Public relation 2025.jpg",
      tier: "chief",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "SOLAIMAN TANVIR RAJ",
      role: "Treasurer",
      image: "/leadership/panel2025/treasurer 2025.jpg",
      tier: "joint",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "SADID HASAN DHURBAK",
      role: "Joint Executive of Graphics and Design",
      image: "/leadership/panel2025/joint execurive of graphics and design 2025.jpg",
      tier: "joint",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "KAZI MD AMIMUL AHSAN TAMIM",
      role: "Joint Executive of Web and App Development",
      image: "/leadership/panel2025/joint executive of web and app developement 2025.jpg",
      tier: "joint",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "ABDULLAH AL MAHI",
      role: "Joint Executive of Robotics and Programming",
      image: "/leadership/panel2025/joint executive of robotics and programming 2025.jpg",
      tier: "joint",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "MD. TANZILUR RAHMAN FAKIR",
      role: "Joint Executive of Public Relations",
      image: "/leadership/panel2025/joint executive of public relation 2025.jpg",
      tier: "joint",
      batch: "DC-25",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "M M Mushfiq Bin Musa",
      role: "President",
      image: "/leadership/panel 2026/president.png",
      tier: "executive",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "Tahasin Raj Khan",
      role: "Vice President",
      image: "/leadership/panel 2026/vice-president.png",
      tier: "executive",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "Sakhwat Hossain Saikot",
      role: "General Secretary",
      image: "/leadership/panel 2026/gs.png",
      tier: "executive",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "Jannato Adon Soaeb",
      role: "Chief Executive of Administration",
      image: "/leadership/panel 2026/CEA.png",
      tier: "chief",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "Arpon Saha",
      role: "Chief Executive of Content Writing & Publication",
      image: "/leadership/panel 2026/CECWP.png",
      tier: "chief",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "MD An Nafi",
      role: "Chief Executive of Graphics & Design",
      image: "/leadership/panel 2026/CEGD.png",
      tier: "chief",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "MD Rudro Biswas",
      role: "Chief Executive of Web Development & Cyber Security",
      image: "/leadership/panel 2026/CEWC.png",
      tier: "chief",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "Srijon Kumar Shill",
      role: "Chief Executive of Programming & Robotics",
      image: "/leadership/panel 2026/CEPR.png",
      tier: "chief",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "Nazmul Alom Shanto",
      role: "Joint Executive of Programming & Robotics",
      image: "/leadership/panel 2026/JEPR.png",
      tier: "joint",
      batch: "DC-26",
      facebook: "#",
      linkedin: "#",    },
    {
      name: "Md. Farhan Shahriar",
      role: "President",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "executive",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Tahmid Ahmed",
      role: "Vice President",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "executive",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Safayet Hossain",
      role: "General Secretary",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "executive",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Morshed Tahmid",
      role: "Chief Executive of Administration",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Md. Samiul Islam",
      role: "Chief Executive of Web Development",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Tanvir Mahtab",
      role: "Chief Executive of Graphics & Design",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Rizwan Ul Islam",
      role: "Chief Executive of Content Writing & Publication",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Md. An Nafiu Rahman Kabbo",
      role: "Chief Executive of Cyber Security",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Faiaz Tafsir",
      role: "Chief Executive of Robotics & Programing",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Md. Eyasin Arafat",
      role: "Chief Executive of Competitive Programing",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Shazid Al Hossain",
      role: "Chief Executive of Public Relations & Sponsorships",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "chief",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Ishraq Tanvir",
      role: "Joint Secretary of Web Development",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "joint",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Isfar Azmain",
      role: "Joint Secretary of Graphics & Design",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "joint",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
    {
      name: "Md. Tahmid Mashrur",
      role: "Treasurer",
      image: "/leadership/panel 2026/placeholder.png",
      tier: "joint",
      batch: "DC-27",
      facebook: "#",
      linkedin: "#",
    },
  ],
  SUBTITLE: "The commanding officers steering DCITC towards innovation",
  LABELS: {
    EXECUTIVE: "Executive Board",
    CHIEF: "Chief Executives",
    JOINT: "Joint Executives",
  },
};

export const DEMO_ACHIEVEMENTS: Achievement[] = [
  {
    year: "2025",
    title: "National Robotics Championship Finalist",
    detail:
      "Ranked in the top 6 teams nationwide with an autonomous line-following bot.",
    image: "/hero.png",
  },
  {
    year: "2024",
    title: "Inter-College Hackathon Champions",
    detail: "Built an AI-powered attendance and analytics system in 24 hours.",
    image: "/hero.png",
  },
  {
    year: "2024",
    title: "Cybersecurity CTF Top 10",
    detail: "Secured a top 10 spot in a national capture-the-flag competition.",
    image: "/hero.png",
  },
];

export const DEMO_BLOG_POSTS = [
  {
    slug: "getting-started-with-dcitc",
    title: "Getting Started with DCITC",
    excerpt: "How to join, what to expect, and how we operate as a tech squad.",
    tag: "Onboarding",
    date: "Nov 2025",
    image: "/hero.png",
    content:
      "This is a demo article explaining how a new member can get started with DCITC. Replace this with real content later.",
  },
  {
    slug: "behind-the-robotics-lab",
    title: "Behind the Robotics Lab",
    excerpt: "A peek into how we prototype bots, from CAD to code.",
    tag: "Robotics",
    date: "Oct 2025",
    image: "/hero.png",
    content:
      "This is a demo article about what happens inside the robotics lab. Replace with stories, photos, and logs of your projects.",
  },
  {
    slug: "defending-the-digital-frontier",
    title: "Defending the Digital Frontier",
    excerpt: "What our Cyber Security team practices to stay ahead of threats.",
    tag: "Cyber Security",
    date: "Sep 2025",
    image: "/hero.png",
    content:
      "This is a demo article describing the cybersecurity mindset of the club. Swap this text for real write-ups later.",
  },
];
