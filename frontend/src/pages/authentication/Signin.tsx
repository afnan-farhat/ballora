import { useState, type ChangeEvent } from "react";
import GradientButton from "../../component/GradientButton";

// Firebase imports
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

// Context and navigation
import { useUser } from "../authentication/UserContext.tsx";
import { useNavigate } from "react-router-dom";

// ================================
// Types
// ================================

// Structure of form data
interface FormData {
  email: string;
  password: string;
}

// Possible validation errors
type Errors = Partial<Record<keyof FormData, string>>;

// ================================
// Signin Component
// ================================
export default function Signin() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUserRole } = useUser();

  // ================================
  // Handlers
  // ================================
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ================================
  // Handle sign-in logic
  // ================================
  const handleSubmit = async () => {
    const newErrors: Errors = {};

    // Validate input fields
    if (!formData.email.trim()) {
      newErrors.email = "Email or ID cannot be empty";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    // Only continue if there are no validation errors

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        let emailToUse = formData.email;

        // Check if user entered a numeric ID
        const isId = /^[0-9]{6}$/.test(formData.email);
        if (isId) {

          // Try finding ID in admins collection
          const adminRef = doc(db, "admins", formData.email);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            const adminData = adminSnap.data();
            if (!adminData.email) {
              throw new Error("invalid-admin-data");
            }
            emailToUse = adminData.email;
          } else {

            // If not found, check in users collection
            const usersRef = doc(db, "users", formData.email);
            const userSnap = await getDoc(usersRef);

            if (!userSnap.exists()) {
              throw new Error("invalid-id");
            }

            const userData = userSnap.data();
            if (!userData.email) {
              throw new Error("invalid-user-data");
            }
            emailToUse = userData.email;
          }
        }

        // Attempt to sign in with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(
          auth,
          emailToUse,
          formData.password
        );
        const user = userCredential.user;

        // Check user role from Firestore
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setUserRole("admin");
        } else {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as { role?: string };
            setUserRole(data.role || null);
          } else {
            setUserRole(null);
          }
        }

        // Navigate to home after successful login
        navigate("/");
        setFormData({ email: "", password: "" });
      } catch (error: unknown) {
        console.error("Error signing in:", error);

        let errorMessage = "An error occurred during login.";

        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error
        ) {
          const firebaseError = error as { code: string };
          switch (firebaseError.code) {
            case "auth/user-not-found":
              errorMessage = "Email not registered.";
              break;
            case "auth/wrong-password":
              errorMessage = "Incorrect password.";
              break;
          }
        }
        setErrors({ email: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
  };

 
  return (
    <div className="flex items-center justify-center p-4 min-h-screen bg-gradient-to-b from-transparent via-[#EEF9F8] to-transparent">
      <div className="w-full max-w-[650px] mx-auto">
        <div className="bg-white rounded-[12px] shadow-lg px-40 py-5">
          <div className="text-center mb-5">
            <h1 className="text-[43px] font-petrona font-bold text-[#1E4263] mb-2">
              Sign in
            </h1>
            <p className="text-gray-600 text-lg">
              Please login to continue to your account
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault(); 
              handleSubmit(); 
            }}
          >
            {/* Email Field */}
            <div>
              <label className="block text-m font-bold text-gray-700 mb-2">
               Email{" "}
                {errors.email && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-[12px] disabled:opacity-50"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-m font-bold text-gray-700 mb-2">
                Password{" "}
                {errors.password && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-[12px] disabled:opacity-50"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.01-3.306M6.223 6.223A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-.93 1.925M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3l18 18"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/ResetPassword")} 
                className="text-[#619994] hover:text-[#83aca8] text-sm font-semibold underline"
              >
                Forgot Password?
              </button>
            </div>
            {/* Log in Button */}
            <GradientButton
              type="submit"
              className="w-full h-10 text-[16px]"
              disabled={isLoading}
            >
              Log in
            </GradientButton>

            {/* Create Account Link */}
            <div className="text-center">
              <span className="text-gray-600 text-m">
                Don't have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => navigate("/joinus")} 
                className="text-[#619994] hover:text-[#83aca8] text-m font-semibold underline"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
