import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { AlwaysOn } from "@/components/AlwaysOn";
import { Origin } from "@/components/Origin";
import { WhatSheIs } from "@/components/WhatSheIs";
import { Archetypes } from "@/components/Archetypes";
import { Showcase } from "@/components/Showcase";
import { Footer } from "@/components/Footer";
import { GoblinCorruption } from "@/components/GoblinCorruption";

// JSON-LD structured data.
const SITE_URL = "https://gopal.ai";
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "gopal",
      description:
        "a realtime goblin voice and vision companion for Apple Vision Pro.",
      inLanguage: "en-US",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "gopal",
      url: SITE_URL,
      logo: `${SITE_URL}/gopal/gopal-wordmark.png`,
      sameAs: ["https://github.com/stephenhungg/gopal"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "gopal",
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "visionOS, Web",
      url: SITE_URL,
      description:
        "gopal sees and hears the room, then reacts through realtime voice as a goblin companion on Apple Vision Pro.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      image: `${SITE_URL}/gopal/gopal-wordmark.png`,
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "what is gopal?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "gopal is a realtime voice and vision companion for Apple Vision Pro. the page starts like angel, glitches, then reveals gopal.",
          },
        },
        {
          "@type": "Question",
          name: "is gopal just another AI agent?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "no. gopal is built around realtime voice, camera context, and embodied reactions instead of a normal chat interface.",
          },
        },
        {
          "@type": "Question",
          name: "what does gopal use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "gopal uses realtime voice models and vision context to react to what is happening around the wearer.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SmoothScroll />
      <GoblinCorruption />
      <main className="min-h-screen bg-paper">
        <Nav />
        <h1 className="sr-only">
          gopal: a realtime goblin voice and vision companion.
        </h1>
        <Hero />
        <AlwaysOn />
        <Origin />
        <WhatSheIs />
        <Archetypes />
        <Showcase />
        <Footer />
      </main>
    </>
  );
}
