import React from "react";
import { X } from "lucide-react";
import type {ViewCommentProps} from "../../../component/Interfaces";

/**
  Displays a centered popup modal with a comment and a close button.
 */
const ViewComment: React.FC<ViewCommentProps> = ({ isOpen, comment, onClose }) => {
    //  If the modal is not open, render nothing
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blur bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Comment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-700 leading-relaxed">{comment}</p>
        </div>
      </div>
    </div>
  );
};

export default ViewComment;
