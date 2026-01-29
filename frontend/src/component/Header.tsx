import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import GradientButton from "./GradientButton";
import WhiteButton from "./WhiteButton";
import UserDropdown from "../pages/AllUsers/ProfileDropdown";
import { useUser } from "../pages/authentication/UserContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null); // Typed instead of "any"
  const { userRole } = useUser();

  // Track authentication state (listen for login/logout)
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setFirebaseUser(user);
      } else {
        setIsLoggedIn(false);
        setFirebaseUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Helper to check if the current route matches the given path
  const isActive = (path: string) => location.pathname === path;

  // Dynamically determine the "Ideas" link based on login state and user role
  const ideasLink = (() => {
    if (!isLoggedIn) return "/IdeasGuest"; // Not logged in
    if (!userRole) return "#"; // Role not yet loaded
    if (userRole === "idea-owner") return "/IdeasOwner";
    if (["investor", "admin"].includes(userRole)) return "/NoIdeas";
    return "/IdeasGuest"; // Default fallback
  })();

  return (
    <section className="relative z-50 py-0 px-0">
      
      <header className="relative top-0 left-0 w-full">
        <div className="max-w-full mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center space-x-8">
              <img src="ballora_logo.png" width={"80px"} alt="Ballora Logo" />
              <nav className="bg-transparent hidden z-30 md:flex px-10 space-x-8 ">
                <Link
                  to="/"
                  className={`text-[16px] font-semibold ${
                    isActive("/")
                      ? "text-[#378692] underline underline-offset-4"
                      : "text-black hover:text-[#33726D]"
                  }`}
                >
                  Home
                </Link>

                <Link
                  to={ideasLink}
                  className={`text-[16px] font-semibold ${
                    isActive(ideasLink)
                      ? "text-[#378692] underline underline-offset-4"
                      : "text-black hover:text-[#33726D]"
                  }`}
                >
                  Ideas
                </Link>

                <Link
                  to="/investors"
                  className={`text-[16px] font-semibold ${
                    isActive("/investors")
                      ? "text-[#378692] underline underline-offset-4"
                      : "text-black hover:text-[#33726D]"
                  }`}
                >
                  Investors
                </Link>

                {(userRole === "investor" || userRole === "idea-owner") && (
                  <Link
                    to="/chat"
                    className={`text-[16px] font-semibold ${
                      isActive("/chat")
                        ? "text-[#378692] underline underline-offset-4"
                        : "text-black hover:text-[#33726D]"
                    }`}
                  >
                    Chat
                  </Link>
                )}
              </nav>
            </div>

            {/* Right Side (Auth / Dropdown) */}
            <div className="flex items-center justify-center gap-3 relative z-30">
              {isLoggedIn ? (
                <UserDropdown
                  user={
                    firebaseUser
                      ? {
                          uid: firebaseUser.uid,
                          displayName: firebaseUser.displayName || undefined,
                          email: firebaseUser.email || undefined,
                          photoURL: firebaseUser.photoURL || undefined,
                        }
                      : null
                  }
                  onLogout={handleLogout}
                />
              ) : (
                <>
                  <WhiteButton
                    onClick={() => navigate("/signin")}
                    className="px-8 py-1"
                    size="md"
                  >
                    Sign in
                  </WhiteButton>
                  <GradientButton
                    onClick={() => navigate("/joinus")}
                    className="px-8 py-1"
                    size="md"
                  >
                    Join us
                  </GradientButton>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </section>
  );
}
