import { useState } from "react";

/*
Features Component:
* Displays Ballora's main features as interactive cards with hover effects
  - Highlights core services: Business Model Generation, Incubation Support, Investor Matching, AI Validation
  - Uses `hoveredIndex` state to track which card is hovered
  - Changes background image and text color on hover
*/
export default function Features() {

  // List of features with title, description, default background, and hover background
  const features = [
    {
      title: "Business Model Generation",
      description: "Creates a ready Business Model Canvas automatically.",
      bg: "/f_money.png",
      hoverBg: "/money_hover.png",
    },
    {
      title: "Incubation Support",
      description:
        "Offers mentorship and structured tasks to refine ideas during incubation.",
      bg: "/idea.png",
      hoverBg: "/idea_hover.png",
    },
    {
      title: "Investor Matching",
      description: "Connects ideas with suitable investors efficiently.",
      bg: "/smart.png",
      hoverBg: "/smart_hover.png",
    },
    {
      title: "AI Validation",
      description: "Ensures idea uniqueness and reduces duplication.",
      bg: "/ai.png",
      hoverBg: "/ai_hover.png",
    },
  ];


  // State to track which feature card is hovered
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="py-10 -mt-38 ">
          <h1 className="text-[50px] font-bold font-petrona text-[#1E4263] text-center">
            Features
          </h1>
          <p className="text-[21px] py-5 text-gray-600 text-center">
            Ballora features smart tools to validate, develop, and connect ideas
            with investors.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4  justify-items-center w-[850px] mx-auto">
          {features.map((feature, index) => {
            const isHovered = hoveredIndex === index;
            const textColor =
              isHovered && [0, 2, 3].includes(index)
                ? "text-white"
                : "text-gray-900";

            return (
              // Individual Feature Card
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-[380px] h-[200px] rounded-xl border border-[#B6B8B7] p-5 flex flex-col justify-center items-start bg-cover bg-center`}
                style={{
                  backgroundImage: `url(${isHovered ? feature.hoverBg : feature.bg
                    })`,
                }}
              >

                {/* Card Content */}
                <div className="flex flex-col ml-1 space-y-4">
                  <div className="mr-50">
                    <h3 className={`text-[20px] font-bold mb-1 ${textColor}`}>
                      {feature.title}
                    </h3>
                  </div>
                  <div className="mr-50">
                    <p className={`text-[13px] leading-relaxed ${textColor}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
