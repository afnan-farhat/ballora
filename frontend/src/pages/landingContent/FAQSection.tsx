import  { useState } from "react";

/* 
 FAQSection Component:
 - Two-column FAQ with toggleable answers
  - responsive layout
 - and TailwindCSS styling
*/



export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // FAQ data: list of questions and answers
  const faqData = [
    {
      question: "What is a Business Model?",
      answer:
        "A business model is a structured framework that explains how a project or company creates, delivers, and captures value. It includes key components such as the value proposition, target customers, revenue streams, cost structure, and essential resources and activities.",
    },
    {
      question: "How does Ballora evaluate ideas?",
      answer:
        "Ideas submitted to Ballora are analyzed using AI-based models to verify uniqueness and avoid duplication. If an idea is similar to existing ones, the platform suggests improvements. If the idea is unique, Ballora generates a Business Model Canvas and uploads it to the platform.",
    },
    {
      question: "What happens after submitting an idea?",
      answer:
        "Once an idea is submitted, the Innovation and Entrepreneurship Center reviews it to decide whether to incubate the idea or present it directly to potential investors.",
    },
    {
      question: "Can investors invest more than one project?",
      answer:
        "Yes, Ballora allows investors to explore and invest in multiple projects at the same time.",
    },
    {
      question: "What does Ballora offer to investors?",
      answer:
        "Ballora provides investors with interface that showcases only validated and qualified projects. Investors gain access to business models and can directly communicate with idea owners.",
    },
    {
      question: "Is there a fee for using the platform?",
      answer:
        "Currently, idea submission is free for entrepreneurs. However, some premium services for investors may require subscription plans.",
    },
  ];

  // Toggle open/close state for FAQ item
  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Split FAQ data into two columns
  const half = Math.ceil(faqData.length / 2);
  const leftColumn = faqData.slice(0, half);
  const rightColumn = faqData.slice(half);

  return (
    <section className="bg-white py-8">
      <div className="max-w-6xl mx-auto px-4 ">
        {/* Section Title */}
        <div className="text-center -mt-28 ">
          <h1 className="text-[50px] py-5 font-bold font-petrona text-[#1E4263] text-center mb-12">
            Frequently Asked Questions
          </h1>
        </div>

        {/* FAQ Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 justify-center">
          {/* Left Column */}
          <div className="flex flex-col gap-6 items-center">
            {leftColumn.map((faq, index) => {
              const actualIndex = index;
              const isOpen = openIndex === actualIndex;
              return (
                <div
                  key={actualIndex}
                  className="bg-white w-[535px] h-auto rounded-lg shadow-md"
                >

                  {/* Question Button */}
                  <button
                    onClick={() => toggleItem(actualIndex)}
                    className="w-full px-6 py-4 text-left flex items-center justify-start transition-colors"
                  >
                    <div className="w-7 h-7 bg-[#fdce567c] rounded-md mt-1 flex items-center justify-center">
                      {/* Icon changes based on open/closed state */}
                      {isOpen ? (
                        <svg
                          className="w-6 h-6 text-[#E0A817] transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M20 12H4"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-[#E0A817] transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </div>

                    <span className="text-[16px] font-bold text-gray-900 text-sm pl-4">
                      {faq.question}
                    </span>
                  </button>

                  {/* Answer Section */}
                  {isOpen && (
                    <div className="px-20 pb-4">
                      <p className="text-gray-600 text-m leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6 justify-center">
            {rightColumn.map((faq, index) => {
              const actualIndex = index + half;
              const isOpen = openIndex === actualIndex;
              return (
                <div
                  key={actualIndex}
                  className="bg-white w-[535px] h-auto rounded-lg shadow-md"
                >
                  <button
                    onClick={() => toggleItem(actualIndex)}
                    className="w-full px-6 py-4 text-left flex items-center justify-start transition-colors"
                  >
                    <div className="ml-4">
                      <div className="w-7 h-7 bg-[#fdce567c] rounded-md mt-1 flex items-center justify-center">
                        {isOpen ? (
                          <svg
                            className="w-6 h-6 text-[#E0A817] transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M20 12H4"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6 text-[#E0A817] transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-[16px] font-bold text-gray-900 text-sm pl-4">
                      {faq.question}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-20 pb-4">
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
