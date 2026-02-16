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
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userRole } = useUser();

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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const ideasLink = (() => {
    if (!isLoggedIn) return "/IdeasGuest";
    if (!userRole) return "#";
    if (userRole === "idea-owner") return "/IdeasOwner";
    if (["investor", "admin"].includes(userRole)) return "/NoIdeas";
    return "/IdeasGuest";
  })();

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link
        to="/"
        className={`text-[16px] font-semibold ${isActive("/") ? "text-[#378692] underline underline-offset-4" : "text-black hover:text-[#33726D]"
          } ${mobile ? "py-2 w-full text-center" : ""}`}
      >
        Home
      </Link>
      <Link
        to={ideasLink}
        className={`text-[16px] font-semibold ${isActive(ideasLink) ? "text-[#378692] underline underline-offset-4" : "text-black hover:text-[#33726D]"
          } ${mobile ? "py-2 w-full text-center" : ""}`}
      >
        Ideas
      </Link>
      <Link
        to="/investors"
        className={`text-[16px] font-semibold ${isActive("/investors") ? "text-[#378692] underline underline-offset-4" : "text-black hover:text-[#33726D]"
          } ${mobile ? "py-2 w-full text-center" : ""}`}
      >
        Investors
      </Link>
      {(userRole === "investor" || userRole === "idea-owner") && (
        <Link
          to="/chat"
          className={`text-[16px] font-semibold ${isActive("/chat") ? "text-[#378692] underline underline-offset-4" : "text-black hover:text-[#33726D]"
            } ${mobile ? "py-2 w-full text-center" : ""}`}
        >
          Chat
        </Link>
      )}
    </>
  );

  return (
    <section className="relative z-50 py-0 px-0 bg-white border-b border-gray-100">
      <header className="relative top-0 left-0 w-full">
        <div className="max-w-full mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-16">

            <div className="flex items-center space-x-4">
              {/* Hamburger Icon */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 focus:outline-none"
              >
                {isMenuOpen ? (
                  <span className="text-2xl">✕</span>
                ) : (
                  <span className="text-2xl">☰</span>
                )}
              </button>

              <img src="ballora_logo.png" className="w-[60px] md:w-[80px]" alt="Ballora Logo" />

              <nav className="hidden md:flex px-10 space-x-8">
                <NavLinks />
              </nav>
            </div>

            {/* Right Side (Auth / Dropdown) */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 relative z-30">
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
                /* Hidden on mobile screens to keep the header clean, moved to sandwich menu */
                <div className="hidden md:flex gap-2">
                  <WhiteButton
                    onClick={() => navigate("/signin")}
                    className="px-6 py-1"
                    size="md"
                  >
                    Sign in
                  </WhiteButton>
                  <GradientButton
                    onClick={() => navigate("/joinus")}
                    className="px-6 py-1"
                    size="md"
                  >
                    Join us
                  </GradientButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-lg z-40 flex flex-col items-center py-6 space-y-4 border-t">
            <NavLinks mobile={true} />

            {/* Auth Buttons inside the Mobile Menu (only if not logged in) */}
            {!isLoggedIn && (
              <div className="flex flex-col items-center w-full px-10 pt-4 space-y-3 border-t border-gray-100">
                <WhiteButton
                  onClick={() => navigate("/signin")}
                  // Changed w-full to w-40 for a smaller, fixed width
                  className="w-40 py-2"
                  size="md"
                >
                  Sign in
                </WhiteButton>
                <GradientButton
                  onClick={() => navigate("/joinus")}
                  // Changed w-full to w-40 for a smaller, fixed width
                  className="w-40 py-2"
                  size="md"
                >
                  Join us
                </GradientButton>
              </div>
            )}
          </div>
        )}
      </header>
    </section>
  );
}