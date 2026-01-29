import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileNotification from "./ProfileNotification";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../authentication/UserContext";

// Component states
export default function NoIdeas() {
  const navigate = useNavigate();
  const { userRole, loading: userLoading } = useUser(); // Access user role and loading state from context
  const [showProfileNotification, setShowProfileNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noIdeas, setNoIdeas] = useState(false);
  const [hasIdeas, setHasIdeas] = useState(false);

  // Effect to check for available ideas based on user role
  useEffect(() => {
    // Wait until user role is fully loaded
    if (userLoading) return;

    const checkIdeas = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        // If user is not logged in, show profile notification
        if (!user) {
          setShowProfileNotification(true);
          setLoading(false);
          return;
        }

        // If user role is missing, show notification as well
        if (!userRole) {
          console.log("No role assigned to user");
          setShowProfileNotification(true);
          setLoading(false);
          return;
        }

        console.log("User role:", userRole);

        let q;
        // If admin → fetch all ideas
        if (userRole === "admin") {
          console.log("Admin: fetching all ideas...");
          q = query(collection(db, "ideas"));

          // If investor → fetch only "Ready To Invest" ideas
        } else {
          console.log("Investor: fetching Ready to invest ideas...");
          q = query(
            collection(db, "ideas"),
            where("state", "==", "Ready To Invest")
          );
        }
        // Fetch ideas from Firestore
        const snap = await getDocs(q);
        console.log("Number of ideas found:", snap.size);
        // Log idea data for debugging
        snap.docs.forEach((doc) => console.log(doc.id, doc.data()));

        // Update component state based on query result
        if (!snap.empty) {
          setHasIdeas(true); // There are ideas
        } else {
          setNoIdeas(true); // No ideas found
        }

        setLoading(false);
      } catch (err) {
        console.error("Error checking ideas:", err);
        setShowProfileNotification(true);
        setLoading(false);
      }
    };

    checkIdeas();
  }, [userRole, userLoading]);
  // Redirect to /Ideas when ideas are available
  useEffect(() => {
    if (!loading && hasIdeas) {
      console.log("Redirecting to /Ideas...");
      navigate("/Ideas");
    }
  }, [hasIdeas, loading, navigate]);

  // Show loading screen while waiting for user ideas
  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Show "No ideas" message when no ideas are found
  if (noIdeas) {
    return (
      <section className="relative">
        {showProfileNotification && (
          <ProfileNotification
            message={"Please complete your profile to view ideas"}
          />
        )}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-[50px] -mt-6 font-petrona font-bold text-[#1E4263] mb-8">
            Ideas
          </h1>
          <div className="flex flex-col items-center justify-center py-20">
            <Lightbulb className="w-16 h-16 text-[#3D6A89] mx-auto" />
            <p className="text-lg text-gray-600 mb-8 py-4">
              There are no ideas available to display at this time
            </p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
