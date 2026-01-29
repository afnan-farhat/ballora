import { useState, type ChangeEvent } from "react";
import GradientButton from "../../component/GradientButton";

// Firebase imports
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";

// Router navigation
import { useNavigate } from "react-router-dom";

// Define the structure of form data
interface FormData {
  email: string;
}

// Define possible error messages (each field can have an error)
type Errors = Partial<Record<keyof FormData, string>>;

// ================================
// ForgetPassword Component
// ================================
export default function ForgetPassword() {

  // State for form, errors, and UI feedback
  const [formData, setFormData] = useState<FormData>({
    email: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Handle input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors({});
    setSuccessMessage("");
  };


  // Validate and send password reset email
  const handleSubmit = async () => {
    const newErrors: Errors = {};

    // email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email cannot be empty";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, formData.email);
        setSuccessMessage(
          "Password reset email sent! Please check your inbox."
        );
        setFormData({ email: "" });

        // Redirect after success
        setTimeout(() => navigate("/signin"), 4000);
      } catch (error: unknown) {
        console.error("Error sending reset email:", error);

        let errorMessage = "Something went wrong while sending the email.";

        // Handle Firebase error codes

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
            case "auth/invalid-email":
              errorMessage = "Invalid email format.";
              break;
            case "auth/too-many-requests":
              errorMessage = "Too many requests. Try again later.";
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
              Forgot Password
            </h1>
            <p className="text-gray-600 text-lg">
              Enter your email to reset your password
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault(); // Prevent page reload

              handleSubmit(); 
            }}
          >
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-[12px]">
                <p className="text-sm">{successMessage}</p>
              </div>
            )}

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
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-[12px] disabled:opacity-50"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Send Reset Email Button */}
            <GradientButton
              type="submit"
              className="w-full h-10 text-[16px]"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Email"}
            </GradientButton>

            {/* Back to Sign In Link */}
            <div className="text-center">
              <span className="text-gray-600 text-m">
                Remember your password?{" "}
              </span>
              <button
                type="button"
                onClick={() => navigate("/signin")} 
                className="text-[#619994] hover:text-[#83aca8] text-m font-semibold underline"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}