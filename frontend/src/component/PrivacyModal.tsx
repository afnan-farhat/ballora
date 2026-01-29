import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: Props) {
  // Don't render the modal if it's not open
  if (!isOpen) return null;

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    // Overlay background with blur effect
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6" onClick={handleModalClick}>
        {/* Close button */}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-4 text-center text-black">
          Privacy Policy
        </h3>

        {/* Content */}
        <div className="space-y-4 text-gray-700">
          <div>
            <p>
              Balora is committed to protecting the privacy of its users and
              maintaining the confidentiality of all information provided. The
              data collected is used solely to enhance our services, verify
              ideas, and generate business models using AI technologies.
            </p>
          </div>

          <div>
            <p>
              We guarantee that no personal information or idea-related data
              will be shared with third parties without explicit user consent,
              except as required by law or through official partnerships with
              university innovation and entrepreneurship centers.
            </p>
          </div>

          <div>
            <p>
              Users have the right to request modification or deletion of their
              data at any time through account settings or by contacting our
              support team.
            </p>
          </div>

          <div>
            <p>
              By using the platform, you agree to this Privacy Policy and any
              future updates, which will be announced through the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
