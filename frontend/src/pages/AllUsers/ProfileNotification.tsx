import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import WhiteButton from "../../component/WhiteButton";
import { AlertTriangle } from "lucide-react";
import { useUser } from "../authentication/UserContext";

type Props = {
  message?: string;
};

// This component displays a banner prompting users to complete their profile
// It also checks for missing fields in real time using Firestore snapshots.
export default function ProfileNotification({ message }: Props) {
  const [showIncompleteProfile, setShowIncompleteProfile] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const navigate = useNavigate();
  const { isSaving } = useUser();

  useEffect(() => {
    let unsubSnapshot: (() => void) | undefined;

    // Listen to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if the user is an admin — if yes, skip profile checks
          const adminRef = doc(db, "admins", user.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            setIsAdmin(true);
            setShowIncompleteProfile(false);
            setMissingFields([]);
            return;
          }

          // Otherwise, check user's profile completeness in the "users" collection
          setIsAdmin(false);

          const userRef = doc(db, "users", user.uid);
          // subscribe to realtime updates so the notification updates immediately when profile is saved
          unsubSnapshot = onSnapshot(
            userRef,
            (snap) => {
              if (!snap.exists()) {
                setMissingFields(["profile"]);
                setShowIncompleteProfile(true);
                return;
              }

              const data = snap.data() || {};
              const role = data.role || "idea-owner";

              // Define required fields based on the user's role
              const required = ["firstName", "lastName", "phoneNumber"];
              if (role === "investor") {
                required.push("investmentType", "aboutMe");
              } else {
                required.push("university", "specialty");
              }
              // Identify which required fields are missing
              const missing = required.filter((f) => {
                const v = data[f];
                return (
                  v === undefined ||
                  v === null ||
                  (typeof v === "string" && v.trim() === "")
                );
              });
              // Show or hide the notification depending on missing fields
              if (missing.length > 0) {
                setMissingFields(missing);
                setShowIncompleteProfile(true);
              } else {
                setShowIncompleteProfile(false);
              }
            },
            (err) => {
              console.error("Profile snapshot error:", err);
            }
          );
        } catch (err) {
          console.error("Error checking profile completeness:", err);
        }
      } else {
        // If the user is signed out, hide the notification
        setShowIncompleteProfile(false);
      }
    });

    // Clean up both auth and Firestore subscriptions when the component unmounts
    return () => {
      unsubscribe();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  return (
    <section className="relative ">
      {/* Only display the banner if the user is not admin and profile is incomplete */}
      {!isAdmin && showIncompleteProfile && (
        <div className="bg-[#F7EDEC] text-black border-l-6 border-red-600">
          <div className="flex items-center justify-between px-2 py-3">
            <div className="w-[500px] flex items-center gap-3 whitespace-nowrap overflow-hidden">
              <span className="flex-shrink-0 text-red-600" aria-hidden="true">
                <AlertTriangle className="w-5 h-5 " />
              </span>
              <div className="truncate">
                <span className="font-medium inline">
                  {message ?? "Please complete your profile."}
                  <br></br>
                </span>
                {/* Show missing field names if available */}
                {missingFields && missingFields.length > 0 && (
                  <div className="text-sm text-gray-700 mt-1">
                    Missing: {missingFields.join(", ")}
                  </div>
                )}
              </div>
            </div>
            <div className="gap-10">
              {isSaving ? (
                <button
                  disabled
                  className="h-[40px] w-[180px] mx-4 rounded-[8px] border-2 bg-white text-red-900 font-semibold flex items-center justify-center gap-2 opacity-80"
                >
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Saving...
                </button>
              ) : (
                <WhiteButton
                  onClick={() => navigate("/Profile")}
                  className="h-[40px] w-[180px] mx-4  hover:text-red-800 text-red-900 hover:border-red-800 "
                >
                  Complete Profile
                </WhiteButton>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
