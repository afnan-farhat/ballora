import React, { useState } from "react";
import { MessageSquareText, Download } from "lucide-react";
import CommentModal from "./SendComment";
import GradientButton from "../../component/GradientButton";
import type { ActivityState, AdminActivityTableProps } from "../../component/Interfaces";

/**
 * AdminActivityTable Component
 * ------------------------------------
 * Displays a table of all activities associated with a specific idea.
 * Allows admins to:
 *  - View uploaded and template files.
 *  - Update activity statuses.
 *  - Add or edit comments through a modal.
 */

const AdminActivityTable: React.FC<AdminActivityTableProps> = ({
  activities,
  onStatusChange,
  onCommentSubmit,
}) => {
  // Modal and comment state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);


  // Handle status change (Waiting, Review, Done)
  const handleStatusChange = (
    index: number,
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = event.target.value as ActivityState;
    onStatusChange(index, newStatus);
  };

  // Open comment modal with existing comment if any
  const handleCommentClick = (
    index: number,
    existingComment: string | undefined
  ) => {
    setCurrentIndex(index);
    setCurrentComment(existingComment || "");
    setIsModalOpen(true);
  };

  // Submit comment and close modal
  const handleCommentSubmit = () => {
    if (currentIndex !== null) {
      onCommentSubmit(currentIndex, currentComment);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <th className="px-6 py-3">Activity Name</th>
            <th className="px-6 py-3">Duration</th>
            <th className="px-6 py-3">Activity Template</th>
            <th className="px-6 py-3">Download File</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Comment</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <React.Fragment key={index}>
              <tr className="border-b border-gray-200 last:border-b-0">
                {/* Task Name */}
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {activity.taskName}
                </td>

                {/* Duration */}
                <td className="px-6 py-4 text-sm text-gray-600 ">
                  {activity.duration} weeks
                </td>

                {/* Activity Template */}
                <td className="px-6 py-4 ">
                  {activity.templateFile ? (
                    <button
                      onClick={() =>
                        window.open(activity.templateFile!.url, "_blank")
                      }
                      className="flex items-center gap-2 text-sm text-[#378692] hover:text-[#3D6A89] underline"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {activity.templateFile.name}
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>

                {/* Uploaded File Download */}
                <td className="px-6 py-4 text-center align-middle">
                  {activity.uploadedFile && activity.uploadedFile.url ? (
                    <div className="flex items-center justify-center">
                      <GradientButton
                        size="md"
                        iconLeft={<Download className="w-4 h-4" />}
                        onClick={() =>
                          activity.uploadedFile?.url && window.open(activity.uploadedFile.url, "_blank")
                        }
                      >
                        Download
                      </GradientButton>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <GradientButton
                        size="md"
                        className=" !bg-gray-300 !text-gray-500 cursor-not-allowed"
                        iconLeft={<Download className="w-4 h-4" />}
                        disabled
                      >
                        No File
                      </GradientButton>
                    </div>
                  )}
                </td>

                {/* Status Dropdown */}
                <td className="px-4 py-2">
                  {(() => {
                    const stateColors: Record<string, string> = {
                      Waiting: "bg-yellow-100 text-yellow-700",
                      Review: "bg-[#D7EFF2] text-[#378692]", // Terquoise color
                      Done: "bg-green-100 text-green-700",
                    };

                    const arrowColors: Record<string, string> = {
                       Waiting: "%23ca8a04",
                      Review: "%23378692", // Terquoise color
                      Done: "%2315803d",
                    };

                    const colorClass = stateColors[activity.state] || "bg-gray-100 text-gray-700";
                    const arrowColor = arrowColors[activity.state] || "%236b7280";

                    return (
                      <select
                        value={activity.state}
                        onChange={(e) => handleStatusChange(index, e)}
                        className={`p-2 pr-8  px-4 py-2 rounded-lg text-xs font-medium ${colorClass} focus:outline-none focus:ring-0 appearance-none bg-no-repeat bg-right border-none`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='${arrowColor}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.25rem center',
                          backgroundSize: '1.5em 1.5em',
                          
                        }}
                      >
                        <option value="Waiting" className={stateColors["Waiting"]}>Waiting</option>
                        <option value="Done" className={stateColors["Done"]}>Done</option>
                        <option value="Review" className={stateColors["Review"]}>Review</option>
                      </select>
                    );
                  })()}
                </td>

                {/* Comment Button*/}
                <td className="px-6 py-4 text-sm text-gray-600">
                  {activity.state === "Review" && (
                    <button
                      onClick={() =>
                        handleCommentClick(index, activity.comment)
                      }
                      className="p-2 text-gray-600 hover:text-[#378692] transition-colors"
                    >
                      <MessageSquareText className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Comment Modal */}
      {isModalOpen && (
        <CommentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          comment={currentComment}
          onCommentChange={(e) => setCurrentComment(e.target.value)}
          onSubmit={handleCommentSubmit}
        />
      )}
    </>
  );
};

export default AdminActivityTable;