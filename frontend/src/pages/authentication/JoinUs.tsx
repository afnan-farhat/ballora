
// React & hooks

import React, { useState } from "react";
import type { ChangeEvent } from "react";

// Custom button component
import GradientButton from "../../component/GradientButton";

// Firebase auth & database
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

// Router hook for navigation
import { useNavigate } from "react-router-dom";

// Modal for privacy policy
import PrivacyModal from "../../component/PrivacyModal";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

// Form data shape
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  selectedRole: "idea-owner" | "investor";
  agreeToPrivacyPolicy: boolean;
};

// Validation errors
type Errors = Partial<Record<keyof FormData, string>>;

// Props for password input component
type PasswordInputProps = {
  label: string;
  name: string;
  value: string;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};


// Password input with show/hide toggle
const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  name,
  value,
  show,
  setShow,
  onChange,
  error,
}) => (
  <div>
    <label className="block text-m font-bold text-gray-700 mb-2">
      {label} {error && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-[12px]"
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-4 flex items-center"
        onClick={() => setShow((prev) => !prev)}
      >
        {show ? <AiOutlineEye size={20} className="text-gray-400" /> : <AiOutlineEyeInvisible size={20} className="text-gray-400" />}
      </button>
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);



export default function JoinUs(): React.ReactElement {
  // router helper to navigate after successful sign-up
  const navigate = useNavigate();

  // privacy modal open state
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  // form state for user input
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    selectedRole: "idea-owner",
    agreeToPrivacyPolicy: false,
  });

  // validation errors
  const [errors, setErrors] = useState<Errors>({});

  // toggles for showing/hiding password fields
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // form submission loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);


  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------



  // update formData for text inputs and checkbox
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // set the selected role (idea owner or investor)
  const handleRoleSelect = (role: "idea-owner" | "investor"): void => {
    setFormData((prev) => ({ ...prev, selectedRole: role }));
  };


  // _________________________________________________________________________________________
  // _________________________________________________________________________________________


  const handleSubmit = async (): Promise<void> => {
    const newErrors: Errors = {};

    // --- Validation ---
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.email.trim()) newErrors.email = "Email cannot be empty";
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email format";
    }

    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.agreeToPrivacyPolicy)
      newErrors.agreeToPrivacyPolicy = "You must agree to the privacy policy";

    setErrors(newErrors);

    // Only continue if no validation errors
    if (Object.keys(newErrors).length === 0) {
      try {
        setIsLoading(true);

        // Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const user = userCredential.user;

        // Update the user's display name
        await updateProfile(user, {
          displayName: `${formData.firstName} ${formData.lastName}`,
        });

        // Save minimal user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.selectedRole,
          uid: user.uid,
          isPremium: formData.selectedRole === "investor" ? false : null,
          isAgree: formData.selectedRole === "investor" ? false : null,

        });

        // User is automatically signed in, navigate to homepage
        navigate("/");

      } catch (error: unknown) {
        console.error("Error creating user:", error);

        let errorMessage = "Error creating account";

        if (typeof error === "object" && error !== null && "code" in error) {
          const firebaseError = error as { code: string };
          
          switch (firebaseError.code) {
            case "auth/email-already-in-use":
              errorMessage = "Email already in use";
              break;
            case "auth/invalid-email":
              errorMessage = "Invalid email";
              break;
            default:
              errorMessage = "Error creating account";
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
              Create Account
            </h1>
            <p className="text-gray-600 text-lg">
              Sign up to enjoy the feature of Ballora
            </p>
          </div>

          {/* registration form */}
          <form
            className="space-y-6"
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* First Name */}
            <div>
              <label className="block text-m font-bold text-gray-700 mb-2">
                First Name{" "}
                {errors.firstName && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-[12px] disabled:opacity-50"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-m font-bold text-gray-700 mb-2">
                Last Name{" "}
                {errors.lastName && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-[12px] disabled:opacity-50"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-m font-bold text-gray-700 mb-2">
                Email {errors.email && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
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

            {/* Password */}
            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              show={showPassword}
              setShow={setShowPassword}
              onChange={handleInputChange}
              error={errors.password}
            />

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
            />

            {/* Select Role */}
            <div>
              <label className="block text-m font-bold text-gray-700 mb-3">
                Select Role
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("idea-owner")}
                  disabled={isLoading}
                  className={`flex-1 h-10 rounded-[10px] text-m font-medium transition-colors disabled:opacity-50 ${formData.selectedRole === "idea-owner"
                    ? "bg-[#DEF0EF] text-[#33726D]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Idea owner
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("investor")}
                  disabled={isLoading}
                  className={`h-10 flex-1 rounded-[10px] text-m font-medium transition-colors disabled:opacity-50 ${formData.selectedRole === "investor"
                    ? "bg-[#DEF0EF] text-[#33726D]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  Investor
                </button>
              </div>
            </div>

            {/* Privacy Policy */}
            <div>
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  name="agreeToPrivacyPolicy"
                  checked={formData.agreeToPrivacyPolicy}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 text-[#33726D] focus:ring-[#33726D] border-gray-300 rounded-[12px] disabled:opacity-50"
                />
                <div className="text-m text-gray-700">
                  I agree to the{" "}
                  <button
                    className="text-[#619994] hover:text-[#83aca8] font-semibold underline"
                    type="button"
                    onClick={() => setIsPrivacyOpen(true)}
                  >
                    Privacy Policy
                  </button>
                </div>

                <PrivacyModal
                  isOpen={isPrivacyOpen}
                  onClose={() => setIsPrivacyOpen(false)}
                />
              </div>
              {errors.agreeToPrivacyPolicy && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.agreeToPrivacyPolicy}
                </p>
              )}
            </div>

            {/* Submit */}
            <GradientButton
              type="submit"
              className="w-full h-10 text-[16px]"
              disabled={isLoading}
            >
              Create Account
            </GradientButton>

            <div className="text-center">
              <span className="text-gray-600 text-m">
                Already have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="text-[#619994] hover:text-[#83aca8] text-m font-semibold underline"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
