import { useState } from 'react';
import { X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import GradientButton from '../../component/GradientButton';
import { useEffect } from "react";
import { useUser } from "../authentication/UserContext";
import { db } from "../../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export default function NDATemplate() {
  // Track checkbox state for user agreement
  const [isChecked, setIsChecked] = useState(false);

  // Track loading state while fetching user data
  const [, setIsLoadingUser] = useState(true);

  // Stores whether the user has previously agreed to the NDA
  const [, setIsAgree] = useState(false);

  // Get logged-in user id from context
  const { userId } = useUser();

  const location = useLocation();
  const navigate = useNavigate();

  // Extract passed values from previous page
  const ideaId = location.state?.ideaId;
  const userRole = location.state?.userRole;
  const popupContent = location.state?.popupContent ?? "";


  // Prevent modal closing when clicking inside the modal container
  const handleModalClick = (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
  };

  /**
   * Handle Agree button click
   * - Validates checkbox state
   * - Updates the user's NDA agreement status in Firestore
   * - Navigates to the idea details page
   */
  const handleButtonClick = async () => {
    if (!isChecked) return;
    if (!userId || !ideaId) return;

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);


      let ndaAgreements: Record<string, boolean> = {};

      // If user document exists → load existing data
      if (userSnap.exists()) {
        const data = userSnap.data();
        ndaAgreements = { ...(data.ndaAgreements as Record<string, boolean> ?? {}) };
      }


      // Now this works with no error:
      ndaAgreements[ideaId] = true;

      // Save back
      await updateDoc(userRef, { ndaAgreements });

      navigate("/ideaDetails", {
        state: { ideaId, userRole, fromNDA: true },
      });
    } catch (error) {
      console.error("Error updating NDA agreement:", error);
    }
  };



  // Close modal and return to previous page
  const handleClose = () => {
    navigate(-1);
  };

  /**
   * Fetch stored NDA agreement status when component loads
   * - Reads 'isAgree' value from Firestore
   * - Updates component state accordingly
   */
  useEffect(() => {
    const fetchNDAAgreement = async () => {
      if (!userId || !ideaId) return;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const ndaAgreements = userSnap.data().ndaAgreements || {};
        setIsAgree(ndaAgreements[ideaId] === true);
      }
      setIsLoadingUser(false);
    };
    fetchNDAAgreement();
  }, [userId, ideaId]);


  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-[600px] w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={handleModalClick}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center text-center p-4 border-b border-gray-200 gap-2">
            <h2 className="text-lg font-bold text-gray-700">
              Non-Disclosure Agreement (NDA)
            </h2>
          </div>

          {/* NDA Content */}
          <div className="p-6">
            <div
              className="text-xs text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: popupContent }}
            />

            {/* Agreement Checkbox */}
            <div className="mt-6">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-4 h-4 mt-0.5 mr-2 border border-gray-300 rounded accent-teal-600"
                />

                <span
                  className="text-xs text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html:
                      'I agree to the <span class="text-teal-600 underline">Non-Disclosure Agreement (NDA)</span>',
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="flex justify-center p-4 border-t border-gray-200">
          <GradientButton
            size="md"
            disabled={!isChecked}
            onClick={handleButtonClick}
            className="px-6"
          >
            Agree
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
