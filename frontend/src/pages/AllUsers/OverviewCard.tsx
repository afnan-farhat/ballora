import React, { useState, useMemo } from "react";
import GradientButton from "../../component/GradientButton";
import { Eye, X } from "lucide-react";
import type { OverviewCardProps } from "../../component/Interfaces";

// Firestore imports (used to load the Business Model data dynamically)
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const OverviewCard: React.FC<OverviewCardProps> = ({
  ideaInfo,
  getStateColor,
}) => {
  // Controls the visibility of the Business Model modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Firestore BMC states: data, loading, and error handling
  const [bmc, setBmc] = useState<Record<string, any> | null>(null);
  const [bmcLoading, setBmcLoading] = useState(false);
  const [bmcError, setBmcError] = useState<string | null>(null);

  /**
   * Opens the modal and loads the Business Model Canvas from Firestore.
   * - Prevents re-fetching if data already exists.
   * - Ensures an idea ID is available before requesting.
   */
  const openModal = async () => {
    setIsModalOpen(true);

    // If BMC is already loaded or ID is missing, skip the fetch
    if (bmc || !ideaInfo?.id) return;

    try {
      setBmcLoading(true);
      setBmcError(null);

      // Fetch the document from Firestore
      const snap = await getDoc(doc(db, "ideas", ideaInfo.id));

      if (snap.exists()) {
        const data = snap.data() as any;
        setBmc(data?.bmc ?? null);
      } else {
        setBmcError("Business Model not found for this idea.");
      }
    } catch (err: any) {
      setBmcError(err?.message || "Failed to load Business Model.");
    } finally {
      setBmcLoading(false);
    }
  };

  /**
   * Ordered structure of the Business Model Canvas sections.
   * Ensures that even if Firestore returns unordered keys,
   * the display remains consistent.
   */
  const ORDER = [
    "Customer Segments",
    "Value Proposition",
    "Channels",
    "Customer Relationships",
    "Revenue Sources",
    "Key Activities",
    "Key Resources",
    "Key Partnerships",
    "Cost Structure",
  ];
  const BMC_FIELD_MAP: Record<string, string> = {
    "Customer Segments": "customer_segments",
    "Value Proposition": "value_propositions",
    "Channels": "channels",
    "Customer Relationships": "customer_relationships",
    "Revenue Sources": "revenue_streams",
    "Key Activities": "key_activities",
    "Key Resources": "key_resources",
    "Key Partnerships": "key_partners",
    "Cost Structure": "cost_structure",
  };

  /**
   * Memoized transformation of BMC data to a clean display format.
   * Re-runs only when `bmc` changes.
   */
  const sections = useMemo(() => {
    if (!bmc) return [];
    return ORDER.map((title) => ({
      title,
      value: bmc[BMC_FIELD_MAP[title]] ?? "No data available",
    }));
  }, [bmc]);

  return (
    <div>
      {/* ---------------- TOP SECTION: Idea Overview ---------------- */}
      <div className="mb-8 flex justify-between items-start flex-wrap">
        <div className="flex flex-1 items-start space-x-6 min-w-0">

          {/* Idea Logo */}
          <div className="w-[130px] h-[130px] border border-[#7C838A] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {ideaInfo.logoText ? (
              <img
                src={ideaInfo.logoText}
                alt={`${ideaInfo.ideaName} Logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-sm">No Logo</div>
            )}
          </div>

          {/* Idea Name + Metadata */}
          <div className="pt-2 flex-1 min-w-0">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-petrona truncate">
              {ideaInfo.ideaName}
            </h2>

            {/* State - Level - Field */}
            <div className="flex items-center space-x-8 text-base flex-wrap">
              {/* Idea State */}
              <div className="flex items-center space-x-2 min-w-0">
                <div
                  className={`w-2.5 h-2.5 ${getStateColor(
                    ideaInfo.state
                  )} rounded-full`}
                ></div>
                <span className="text-black font-semibold">State:</span>
                <span className="text-gray-700 truncate">{ideaInfo.state}</span>
              </div>

              {/* Readiness Level */}
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-2.5 h-2.5 bg-[#248D9D] rounded-full"></div>
                <span className="text-black font-semibold">Idea level:</span>
                <span className="text-gray-700 truncate">
                  {ideaInfo.readinessLevel}
                </span>
              </div>

              {/* Fields */}
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-2.5 h-2.5 bg-[#3D6A89] rounded-full"></div>
                <span className="text-black font-semibold">Field:</span>
                <span className="text-gray-700 truncate">
                  {ideaInfo.fields?.length
                    ? ideaInfo.fields.join(", ")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Button that opens the Business Model modal */}
        <div className="pt-2 flex-shrink-0">
          <GradientButton
            iconRight={<Eye className="w-4 h-4" />}
            onClick={openModal}
          >
            Business Model
          </GradientButton>
        </div>
      </div>

      {/* ---------------- DESCRIPTION SECTION ---------------- */}
      <div>
        {ideaInfo.description ? (
          <p className="text-gray-700 leading-relaxed max-w-3xl">
            {ideaInfo.description}
          </p>
        ) : (
          <p className="text-gray-400 italic">No description provided.</p>
        )}
      </div>

      {/* ---------------- MODAL: Business Model Canvas ---------------- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsModalOpen(false)} // close on backdrop click
        >
          <div
            className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6"
            onClick={(e) => e.stopPropagation()} // prevents modal closing when clicking inside
          >
            {/* Close modal button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold mb-4 text-center">
              Business Model Canvas
            </h3>

            {/* Loading state */}
            {bmcLoading && (
              <p className="text-center text-gray-600">Loading…</p>
            )}

            {/* Error state */}
            {bmcError && (
              <p className="text-center text-red-600">{bmcError}</p>
            )}

            {/* BMC Content */}
            {!bmcLoading && !bmcError && bmc && (
              <div className="space-y-4 text-gray-700">
                {sections.map(({ title, value }, idx) => (
                  <div key={idx}>
                    <strong>{idx + 1}. {title}:</strong>

                    {/* Array-based values */}
                    {Array.isArray(value) ? (
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {value.length > 0
                          ? value.map((v, i) => <li key={i}>{v}</li>)
                          : <li>No data available</li>}
                      </ul>
                    ) : (
                      /* Single value string */
                      <p className="mt-1">
                        {value || "No data available"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacing for cleaner layout */}
      <br />
      <br />
      <br />
    </div>
  );
};

export default OverviewCard;
