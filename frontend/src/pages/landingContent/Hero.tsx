import { useState, useRef, useEffect } from "react";
import GradientButton from "../../component/GradientButton";

/*
 Hero Component: 
 * Landing section with interactive text-to-video transition
  - Displays introductory text with Ballora logo
  - Clicking "Discover" switches to video view
 */

export default function Hero() {
  const [currentView, setCurrentView] = useState("text");
  const [showVideoOnly, setShowVideoOnly] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const navbar = document.querySelector("nav");
    const footer = document.querySelector("footer");

    if (currentView === "video") {
      // Hide everything during video
      document.body.style.overflow = "hidden";
      if (navbar) (navbar as HTMLElement).style.display = "none";
      if (footer) (footer as HTMLElement).style.display = "none";
    } else {
      // Return to original page only during hero time
      document.body.style.overflow = "auto";
      if (navbar) (navbar as HTMLElement).style.display = "";
      if (footer) (footer as HTMLElement).style.display = "";
    }
  }, [currentView]);

  // Switch to video view
  const handleDiscover = () => {
    // Scroll to the top of the hero section
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setCurrentView("video");
    setShowVideoOnly(false);
  };

  // Go back to text view and reset video
  const handleBack = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setCurrentView("text");
    setShowVideoOnly(false);
  };

  // Launch full-screen video
  const handleLaunch = () => {
    setShowVideoOnly(true);
    if (videoRef.current) videoRef.current.play();
  };

  return (
    <section className="relative overflow-hidden min-h-screen">
      {/* Hero Content */}
      <div
        className={`absolute inset-0 transition-transform duration-1000 ease-in-out z-20 ${currentView === "video" ? "-translate-x-full" : "translate-x-0"
          }`}
      >
        {/* Background Elements */}
        <div className="absolute bottom-0 w-full left-0 h-[1000px] bg-[url('/bg_hero1.png')] bg-cover bg-center z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-[500px] bg-[url('/bg4.png')] bg-contain bg-no-repeat bg-center z-0"></div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 lg:px-18">
          <div className="max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl lg:text-[52px] font-medium font-petrona text-[#2D4E6D] leading-tight mb-10 -mt-28">
              Turn your Idea into Reality with{" "}
              <span className="font-bold bg-gradient-to-r from-[#3D6A89] to-[#5AB3B6] bg-clip-text text-transparent">
                {/* Ballora */}
                <img
                  src="/ballora_logo_darkBlue.png"
                  alt="Ballora"
                  className="inline-block w-80 h-auto -mt-2"
                />
              </span>
            </h1>
            <GradientButton
              size="xl"
              className="mb-10 ml-90"
              onClick={handleDiscover}
            >
              Discover →
            </GradientButton>
          </div>
        </div>
      </div>

      {/* Video Screen */}
      <div
        className={`absolute inset-0 transition-transform duration-1000 ease-in-out z-10 ${currentView === "video" ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Full Screen Video Background */}
        <video
          ref={videoRef}
          src="/ballora-platform.mp4"
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40"></div>

        {/* Video Content */}
        <div
          className={`relative z-30 flex flex-col justify-center items-center min-h-screen px-6 text-center transition-opacity duration-500 ${showVideoOnly ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        >
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="absolute top-8 left-8 bg-black/30 backdrop-blur-2xl text-white hover:bg-black/50 transition-all duration-300 flex items-center gap-3 text-lg font-semibold px-6 py-2 rounded-[8px] border border-white/20 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            Back
          </button>

          {/* Main Video Content */}
          <div className="max-w-5xl w-full">
            <div className="mb-12">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold font-petrona text-white mb-6 leading-tight">
                See How{" "}
                <span className="bg-gradient-to-r from-[#5AB3B6] to-[#3D6A89] bg-clip-text text-transparent">
                  Ballora
                </span>{" "}
                Work
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <GradientButton
                className="!text-xl !px-10 !py-5 "
                onClick={handleLaunch}
              >
                Launch
              </GradientButton>
            </div>
          </div>
        </div>

        {/* Video Only Mode */}
        {showVideoOnly && (
          <div className="absolute top-8 left-8 z-40">
            <button
              onClick={handleBack}
              className="bg-black/50 backdrop-blur-2xl text-white hover:bg-black/70 transition-all duration-300 flex items-center gap-3 text-lg font-semibold px-6 py-2 rounded-[8px] border border-white/30 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">
                ←
              </span>
              Back
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
