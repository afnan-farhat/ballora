import React, { useState } from "react";
import type { Activity } from "../../../component/Interfaces";
import GradientButton from "../../../component/GradientButton";
import { Trash2, Upload, MessageSquareText } from "lucide-react";
// Modal that displays comments or feedback on an activity
import CommentModal from "./ViewComment";
import type {
  StatusBadgeProps,
  IdeaOwnerActivityTableProps,
} from "../../../component/Interfaces";

// Renders a small label with a color corresponding to the activity status.
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: Record<string, string> = {
    Accept: "bg-green-100 text-green-700",
    Waiting: "bg-yellow-100 text-yellow-700",
    Reject: "bg-red-100 text-red-700",
    "Incubation state": "bg-blue-100 text-blue-700",
    "Ready To Invest state": "bg-purple-100 text-purple-700",
    Review: "bg-[#D7EFF2] text-[#378692]",
    Done: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`${
        statusStyles[status] || "bg-gray-200 text-gray-700"
      } px-4 py-2 rounded-lg text-xs font-medium`}
    >
      {status}
    </span>
  );
};

// Displays all activities for the idea owner in a table format.
const IdeaOwnerActivityTable: React.FC<IdeaOwnerActivityTableProps> = ({
  activities,
  onFileUpload,
  onFileDelete,
}) => {
  const [commentModalIndex, setCommentModalIndex] = useState<number | null>(
    null
  );
  const [localActivities, setLocalActivities] =
    useState<Activity[]>(activities);

  //   Called when a user selects a file for upload.
  const handleFileUpload = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const updated = [...localActivities];
    updated[index] = {
      ...updated[index],
      uploadedFile: { name: file.name, url: URL.createObjectURL(file) },
    };

    setLocalActivities(updated);
    onFileUpload(index, file);
  };
  //  Clears the uploaded file both from local state and parent data source.
  const handleFileDeleteFromFirebase = async (
    _activity: Activity,
    index: number
  ) => {
    try {
      //  Update local state immediately for better UX (remove file and set state to Waiting)
      const updated = [...localActivities];
      updated[index] = {
        ...updated[index],
        uploadedFile: null,
      };

      setLocalActivities(updated);

      //  Call parent handler to update Firestore
      onFileDelete(index);

      console.log("File deleted successfully.");
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleTemplateDownload = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="bg-white rounded-[8px] shadow-md border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-100 text-sm font-semibold text-gray-700 ">
            <th className="px-4 py-3">Activity Name</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Activity Template</th>
            <th className="px-4 py-3">Upload File</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Comment</th>
          </tr>
        </thead>
        <tbody>
          {localActivities.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center text-gray-400 italic py-12 text-sm"
              >
                No activities yet.
              </td>
            </tr>
          ) : (
            localActivities.map((activity, index) => {
              const hasUploadedFile =
                activity.uploadedFile &&
                activity.uploadedFile.name &&
                activity.uploadedFile.url;

              // Ensure activity.state is one of the valid types for StatusBadge
              const badgeStatus = activity.state as StatusBadgeProps["status"];

              return (
                <React.Fragment key={index}>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-900 ">
                      {activity.taskName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {activity.duration} weeks
                    </td>
                    <td className="px-6 py-4 ">
                      <button
                        onClick={() =>
                          activity.templateFile &&
                          handleTemplateDownload(activity.templateFile.url)
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
                        {activity.templateFile?.name || "Download Template"}
                      </button>
                    </td>

                    {/*  Conditional rendering for upload/delete */}
                    <td className="px-4 py-3">
                      {!hasUploadedFile ? (
                        <div className="relative inline-block">
                          <GradientButton
                            size="md"
                            className="!w-28"
                            iconRight={<Upload className="w-4 h-4" />}
                            onClick={() =>
                              document
                                .getElementById(`fileInput-${index}`)
                                ?.click()
                            }
                          >
                            Upload
                          </GradientButton>

                          <input
                            id={`fileInput-${index}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(index, e)}
                            accept=".pdf,.doc,.docx"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm text-[#378692] underline cursor-pointer"
                            onClick={() =>
                              window.open(activity.uploadedFile?.url, "_blank")
                            }
                          >
                            {activity.uploadedFile?.name || "View File"}
                          </span>
                          {activity.state !== "Done" && (
                            <button
                              onClick={() =>
                                handleFileDeleteFromFirebase(activity, index)
                              }
                              className="p-1 text-red-500 hover:text-red-700  transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={badgeStatus} />
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {activity.comment && badgeStatus === "Review" && (
                        <button
                          onClick={() => setCommentModalIndex(index)}
                          className="p-2 text-gray-600 hover:text-[#378692] hover:bg-gray-50 rounded transition-colors"
                        >
                          <MessageSquareText className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>

                  {commentModalIndex === index && (
                    <CommentModal
                      isOpen={true}
                      comment={activity.comment || ""}
                      onClose={() => setCommentModalIndex(null)}
                    />
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default IdeaOwnerActivityTable;
