import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/landing/Hero";
import SourceStrip from "@/components/landing/SourceStrip";
import Statement from "@/components/landing/Statement";
import Pillars from "@/components/landing/Pillars";
import Products from "@/components/landing/Products";
import ShopSection from "@/components/landing/ShopSection";
import Consultation from "@/components/landing/Consultation";
import Voices from "@/components/landing/Voices";
import Manifesto from "@/components/landing/Manifesto";
import FinalCTA from "@/components/landing/FinalCTA";
import Collective from "@/components/landing/Collective";
import ThreePaths from "@/components/landing/ThreePaths";
import Loop from "@/components/landing/Loop";
import Shelf from "@/components/landing/Shelf";

/*
 * BIOUPGRADE — landing page.
 * Design: Isomorphic Labs-inspired light mint editorial system with deep forest type,
 * signal-green controls, and Planhat-style golden-visor imagery.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <ThreePaths />
        <SourceStrip />
        <Statement />
        <Pillars />
        <Consultation />
        <Products />
        <ShopSection />
        <Voices />
        <Collective />
        <Loop />
        <Manifesto />
        <Shelf />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
