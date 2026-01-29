import React from "react";
import { X } from "lucide-react";
import GradientButton from "../../component/GradientButton";
import type { CommentModalProps } from "../../component/Interfaces";

/**
 * CommentModal Component
 * ------------------------------------
 * Displays a modal for adding or editing comments.
 * - Allows users to write and submit comments.
 * - Appears only when `isOpen` is true.
 */


const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  comment,
  onCommentChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blur bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-lg">
        {/* Header with title and close button */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Comment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/*Text area for writing the comment */}
        <textarea
          value={comment}
          onChange={onCommentChange}
          placeholder="Write your comment here..."
          className="w-full h-28 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/*  Submit button */}
        <div className="flex justify-end mt-4">
          <GradientButton size="mid" onClick={onSubmit}>
            Send
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;