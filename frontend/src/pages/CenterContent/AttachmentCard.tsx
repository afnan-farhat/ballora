// -------------------------------------------------------------
// AttachmentCard Component
// Displays an attachment section with a downloadable file (if available).
// -------------------------------------------------------------

import React from "react";
import { Download, FileText } from "lucide-react";

interface AttachmentCardProps {
  additionalFileUrl?: {
    name: string;
    size?: string;
    url: string;
  };
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({ additionalFileUrl }) => {
  
  // If no file exists, show a simple "No attachments" message
  if (!additionalFileUrl || !additionalFileUrl.url) {
    return (
      <div>
        <h6 className="text-2xl font-petrona font-bold text-[#1E4263]">
          Attachments
        </h6>
        <br />
        <div className="text-gray-400 italic">No attachments available</div>
      </div>
    );
  }

  // Render attachment card with download button
  return (
    <div className="border border-dashed border-[#7C838A] rounded-lg p-6 max-w-xl">
      <h2 className="text-2xl font-petrona font-bold text-[#1E4263] mb-4">
        Attachments
      </h2>

      <div className="space-y-4">
        {/* File row */}
        <div className="flex items-center justify-between">
          
          {/* File icon + info */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-10 bg-red-600 rounded flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>

            <div>
              <div className="font-medium text-gray-900 text-base">
                {additionalFileUrl.name}
              </div>
              <div className="text-sm text-gray-500">
                {additionalFileUrl.size ? additionalFileUrl.size : "PDF / Document"}
              </div>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={() => window.open(additionalFileUrl.url, "_blank")}
            className="p-2 text-[#3D6A89] hover:text-[#2A5A79] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentCard;
