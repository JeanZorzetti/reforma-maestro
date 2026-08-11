import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Authority } from "@/components/Authority";
import { FAQ } from "@/components/FAQ";
import { Reviews } from "@/components/Reviews";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Problem />
      <Solution />
      <Authority />
      <Reviews />
      <FAQ />
      <Pricing />
      <Footer />
    </main>
  );
}
