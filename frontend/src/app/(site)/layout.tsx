import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WordmarkBand from "@/components/WordmarkBand";
import GlyphBackground from "@/components/ui/backgrounds-glyph";
import JsonLd from "@/components/seo/JsonLd";
import { CLUB, LEGAL, SOCIAL_URLS } from "@/constants";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Dhaka College IT Club",
      alternateName: ["DCITC", "DC ITC", "Dhaka College Information Technology Club"],
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: "Dhaka College IT Club",
      alternateName: [
        "Dhaka College IT Club",
        "DCITC",
        "Dhaka College Information Technology Club",
      ],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon.png`,
      email: LEGAL.CONTACT_EMAIL,
      foundingDate: CLUB.FOUNDED,
      parentOrganization: { "@type": "CollegeOrUniversity", name: "Dhaka College" },
      sameAs: Object.values(SOCIAL_URLS),
    },
  ],
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={SITE_JSON_LD} />
      {/* One field for the whole public site, fixed behind the content. */}
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <GlyphBackground
          className="h-full w-full opacity-50"
          glowColor="#22d3ee"
          shapeColor="#67e8f9"
          fontSize={9}
        />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="grow">{children}</main>
        <Footer />
        <WordmarkBand />
      </div>
    </>
  );
}