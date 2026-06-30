import Hero from "@/components/marketing/Hero";
import BeforeAfter from "@/components/marketing/BeforeAfter";
import Bento from "@/components/marketing/Bento";
import HowItWorks from "@/components/marketing/HowItWorks";
import Pricing from "@/components/marketing/Pricing";
import FAQ from "@/components/marketing/FAQ";
import FinalCTA from "@/components/marketing/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BeforeAfter />
      <HowItWorks />
      <Bento />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}
