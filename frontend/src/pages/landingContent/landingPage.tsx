import Hero from "./Hero";
import Features from "./Features";
import FAQSection from "./FAQSection";

export default function LandingPage() {
  return (
    <div className="relative">
      <div className="relative z-10">
      </div>

      {/* Hero / Home Section */}
      <div className="relative z-10">
        <Hero />
      </div>

      {/* Features Section */}
      <div className="relative z-10">
        <Features />
      </div>

      <div className="mt-10"></div>

      {/* Frequently Asked Questions Section */}
      <div className="relative z-10">
        <FAQSection />
      </div>

    </div>
  );
}