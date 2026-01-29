import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import GradientButton from "../../component/GradientButton";
import WhiteButton from "../../component/WhiteButton";

interface UserDropdownProps {
  user: {
    uid: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
  } | null;
  onLogout: () => void;
}

export default function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Toggle dropdown visibility when user clicks their name
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch the user's role from Firestore ( "idea-owner" or "investor")
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          console.log("User is admin");
          setUserRole("admin");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          console.log("User role from users collection:", role);
          setUserRole(role);
        } else {
          console.log("No user found");
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [user]);


  // Dropdown UI rendering  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center text-black text-[16px] hover:text-[#33726D] font-semibold"
      >
        <p>{user?.displayName || "Ballora"}</p>
        <svg
          className={`ml-2 w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Display user information */}
          <div className="p-6 text-center border-b border-gray-100">
            <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
              {userRole === "admin" ? (
                // Fixed admin image
                <img
                  src="/ballora_icon_colorful.png"  
                  alt="Admin"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : user?.photoURL ? (
                // Regular user image if available
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                // Default icon if no image exists
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {user?.displayName || "Ballora"}
            </h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          {/* Render action buttons */}
          <div className="p-4 space-y-2">
            {(userRole === "idea-owner" || userRole === "investor") && (
              <WhiteButton
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate("/Profile");
                }}
                className="w-full px-4 py-2"
              >
                Edit Profile
              </WhiteButton>
            )}

            <GradientButton
              onClick={() => {
                setIsDropdownOpen(false);
                onLogout();
              }}
              className="w-full !px-0.5 !py-1"
              iconRight={
                // Default user icon if no profile picture
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              }
            >
              Log Out
            </GradientButton>
          </div>
        </div>
      )}
    </div>
  );
}
