import HalftoneWordmarkBand from "./ui/halftone-wordmark-footer";

/**
 * The club wordmark as a halftone band, sitting between the page and the
 * footer. Copy is limited to what the site already states: the club name and
 * its location.
 */
export default function WordmarkBand() {
  return (
    <HalftoneWordmarkBand
      wordmark="dcitc"
      label="Dhaka College IT Club"
      meta="Dhaka College · Dhaka, Bangladesh"
      preset="night"
      palette={{ background: "#05070a", ink: "#f8fafc", warm: "#22d3ee" }}
      height="clamp(240px, 28vw, 360px)"
      dotGap={5}
      radius={90}
      crop={0.22}
      grain={0.4}
    />
  );
}
