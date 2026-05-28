import { BookingFaqFooter } from "../components/BookingFaqFooter";
import { GsapLanding } from "../components/GsapLanding";
import { Hero } from "../components/Hero";
import { PricingStatsGallery } from "../components/PricingStatsGallery";
import { StoryProcess } from "../components/StoryProcess";

export default function Page() {
  return (
    <main>
      <GsapLanding />
      <Hero />
      <StoryProcess />
      <PricingStatsGallery />
      <BookingFaqFooter />
    </main>
  );
}
