import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, updateProfile } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import GradientButton from "../../component/GradientButton";
import WhiteButton from "../../component/WhiteButton";
import { useUser } from "../authentication/UserContext";
import { Upload as UploadClient } from "upload-js";
import type { IdeaOwnerData, InvestorData } from "../../component/Interfaces";
import Swal from "sweetalert2";

// Profile component: allows both Investor and Idea Owner to edit their profile
const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // 'investor' or 'idea-owner'
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  // State for Idea Owner's profile data
  const [ideaOwnerData, setIdeaOwnerData] = useState<IdeaOwnerData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    university: "",
    career: "",
    specialty: "",
  });
  // State for Investor's profile data
  const [investorData, setInvestorData] = useState<InvestorData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    investmentType: "",
    photoURL: "",
    Role: "",
    aboutMe: "",
  });

  const formData = userRole === "investor" ? investorData : ideaOwnerData;

  const { setIsSaving } = useUser();

  // Initialize upload client
  const upload = UploadClient({
    apiKey: "public_W23MTRB4KCyCEpHHZigugRnUKhMS",
  });

  // Fetch user & role
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role || "idea-owner";
            setUserRole(role);

            if (userData.photoURL) setImageUrl(userData.photoURL);

            if (role === "investor") {
              setInvestorData({
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                email: currentUser.email || "",
                phoneNumber: userData.phoneNumber || "",
                investmentType: userData.investmentType || "",
                aboutMe: userData.aboutMe || "",
                photoURL: userData.photoURL || "",
                Role: userData.role || "",
              });
            } else {
              setIdeaOwnerData({
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                email: currentUser.email || "",
                phoneNumber: userData.phoneNumber || "",
                university: userData.university || "",
                career: userData.career || "",
                specialty: userData.specialty || "",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          alert("Failed to fetch user data. Please try again later.");
        }
      } else {
        navigate("/signin");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (userRole === "investor") {
      setInvestorData((prev) => ({ ...prev, [name]: value }));
    } else {
      setIdeaOwnerData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    setIsSaving(true);

    try {
      let uploadedPhotoURL = imageUrl;

      // Upload image if changed
      if (imageFile) {
        const { fileUrl } = await upload.uploadFile(imageFile);
        uploadedPhotoURL = fileUrl;
      }

      // Update Firebase Auth
      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        photoURL: uploadedPhotoURL,
      });

      // Update Firestore user document
      const updateData: { [key: string]: string | undefined } = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        photoURL: uploadedPhotoURL,
      };

      if (userRole === "investor") {
        updateData.investmentType = investorData.investmentType;
        updateData.aboutMe = investorData.aboutMe;
      } else {
        updateData.university = ideaOwnerData.university;
        updateData.career = ideaOwnerData.career;
        updateData.specialty = ideaOwnerData.specialty;
      }

      await updateDoc(doc(db, "users", user.uid), updateData);

      // Show confirmation modal/message
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile changes have been saved successfully.',
        confirmButtonColor: '#378692',
        showCloseButton: true,
      });

    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Save',
        text: 'There was an error saving your profile. Please try again later.',
        confirmButtonColor: '#e53e3e',
        showCloseButton: true,
      });
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };


  const handleCancel = () => navigate("/");

  //Loading state
  if (!user || userRole === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#33726D] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  //UI Design for Profile Page
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-transparent via-[#EEF9F8] to-transparent">
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="bg-white rounded-lg shadow-lg px-10">
          <div className="p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-petrona font-bold text-gray-900 mb-2">
                Edit Profile
              </h1>
              <p className="text-gray-600">
                Update your personal information as{" "}
                {userRole === "investor" ? "an Investor" : "an Idea Owner"}
              </p>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                <label
                  htmlFor="profileImage"
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#378692] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2a5e5a] transition-colors"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-m font-bold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-m font-bold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-m font-bold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-m font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    🇸🇦 +966
                  </span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50"
                  />
                </div>
              </div>

              {userRole === "investor" ? (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-m font-bold text-gray-700 mb-2">
                      Investment Type
                    </label>
                    <input
                      type="text"
                      name="investmentType"
                      value={investorData.investmentType}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-m font-bold text-gray-700 mb-2">
                      About Me
                    </label>
                    <textarea
                      name="aboutMe"
                      value={investorData.aboutMe}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50 resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-m font-bold text-gray-700 mb-2">
                      University
                    </label>
                    <input
                      type="text"
                      name="university"
                      value={ideaOwnerData.university}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-m font-bold text-gray-700 mb-2">
                      Career
                    </label>
                    <input
                      type="text"
                      name="career"
                      value={ideaOwnerData.career}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-m font-bold text-gray-700 mb-2">
                      Specialty
                    </label>
                    <input
                      type="text"
                      name="specialty"
                      value={ideaOwnerData.specialty}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#33726D] focus:border-[#33726D] disabled:opacity-50"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <WhiteButton
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border-2"
              >
                Cancel
              </WhiteButton>
              <GradientButton
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-6 py-3"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  "Save"
                )}
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;