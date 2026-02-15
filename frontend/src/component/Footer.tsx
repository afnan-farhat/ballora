import { useState } from "react";
import { X } from "lucide-react";
import PrivacyModal from "./PrivacyModal";

export default function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    /* Change 1: Added a background color matching your wave (e.g., #1E4263) to prevent white gaps */
    <footer className="relative w-full"> 
      
      {/* Wave background image */}
      <img src="/footer.png" alt="Footer" className="w-full block h-auto min-h-[120px] object-cover" />

      {/* Change 2: Made 'absolute' apply to ALL screens, not just 'md:' */}
      {/* Change 3: Adjusted padding (pt-12 on mobile, pt-28 on desktop) to fit the wave curve */}
      <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-between px-8 py-4 text-white z-10 pt-12 md:pt-28">
        
        <p className="text-[10px] md:text-[12px]">Ballora 2025 © All Rights Reserved</p>
        
        <div className="flex space-x-4 md:space-x-6 mt-4 md:mt-0">
          <button
            onClick={() => setIsTermsOpen(true)}
            className="text-[10px] md:text-[12px] underline"
          >
            Terms & Conditions
          </button>

          <button
            className="text-[10px] md:text-[12px] underline"
            onClick={() => setIsPrivacyOpen(true)}
          >
            Privacy Policy
          </button>
          <PrivacyModal
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
          />
        </div>
      </div>

      {/* Terms & Conditions modal */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm p-4" onClick={() => setIsTermsOpen(false)}>
          <div className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button onClick={() => setIsTermsOpen(false)}>
              <X className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition" />
            </button>

            {/* Title */}
            <h3 className="text-2xl font-bold mb-4 text-center text-black">
              Terms & Conditions
            </h3>

            {/* Content */}
            <div className="space-y-4 text-gray-700 text-sm">
              <p>
                By using Balora, you agree to comply with the following Terms and
                Conditions:
              </p>

              <ul className="list-disc pl-5 space-y-2">
                <li>
                  The platform aims to support innovators and help transform ideas
                  into viable startups using AI technologies.
                </li>
                <li>
                  Users are responsible for the accuracy and validity of the
                  information they provide.
                </li>
                <li>
                  The platform reserves the right to modify or discontinue any of
                  its services without prior notice.
                </li>
                <li>
                  The platform may not be used for any illegal activity or any
                  action that infringes on the intellectual property rights of
                  others.
                </li>
                <li>
                  All intellectual property rights of the platform and its content
                  belong to Balora.
                </li>
                <li>
                  Any disputes arising will be resolved under the laws and
                  regulations of the Kingdom of Saudi Arabia.
                </li>
                <li>
                  By continuing to use the platform, you acknowledge that you have
                  read and fully agree to these Terms and Conditions.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
