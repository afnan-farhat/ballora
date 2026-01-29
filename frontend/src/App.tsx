import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useUser } from "./pages/authentication/UserContext";
import { useEffect, useState } from "react";

// General Pages 
import LandingPage from "./pages/landingContent/landingPage";
import InvestorsPage from "./pages/AllUsers/InvestorsPage";
import JoinUs from "./pages/authentication/JoinUs";
import Signin from "./pages/authentication/Signin";
import Header from "./component/Header";
import Footer from "./component/Footer";

// Idea Owner pages
import IdeasOwner from "./pages/ideaOwnerContent/IdeasPage/IdeasOwner";
import AddIdeaForm from "./pages/ideaOwnerContent/IdeasPage/AddIdeaForm";
import SubmitIdea from "./pages/ideaOwnerContent/IdeasPage/SubmitIdea";
import UpdateState from "./pages/CenterContent/UpdateState";
import IdeaOwnerActivities from "./pages/ideaOwnerContent/IdeasPage/IdeaOwnerActivities ";


// Visitor or unauthorize user pages
import IdeasGuest from "./pages/AllUsers/IdeasGuest";
import IdeaDetails from "./pages/AllUsers/IdeaDetails";
import Chat from "./pages/InvestorContent/Chat";

// ProtectedRoute
import ProtectedRoute from "./pages/authentication/ProtectedRoute";
import Profile from "./pages/AllUsers/Profile";
import Ideas from "./pages/AllUsers/Ideas";

// invetsor pages
import PopupTemplate from "./pages/InvestorContent/PopupTemplate";
import NoIdeas from "./pages/AllUsers/IdeasAvailability";
import ResetPassword from "./pages/authentication/ResetPassword";
import ProfileNotification from "./pages/AllUsers/ProfileNotification";

function App() {
  const { userRole, loading } = useUser();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"></div>;
  }

  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/message`)
      .then(res => res.json())
      .then(data => {
        setMessage(data.message);
        console.log("Message from backend:", data.message); // prints in console to test the Backend connection
      })
      .catch(() => {
        setMessage("Error");
        console.error("Failed to fetch message");
      });
  }, []);

  return (
    <Router>
      <Header />
      <ProfileNotification />
      <p>{message}</p>

      <section className="min-h-[calc(100vh-96px)]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/investors" element={<InvestorsPage />} />
          <Route path="/joinus" element={<JoinUs />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/SubmitIdea" element={<SubmitIdea />} />

          <Route path="/ResetPassword" element={<ResetPassword />} />

          <Route
            path="/IdeasOwner"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <IdeasOwner />
              </ProtectedRoute>
            }
          />



          <Route
            path="/ideaform"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <AddIdeaForm addIdea={(idea) => console.log("Added idea:", idea)} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/SubmitIdea"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <SubmitIdea />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Profile"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["idea-owner", "investor"]}
                fallback={<Signin />}
              >
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Pass userRole to Ideas so it can decide which ideas to show */}
          <Route
            path="/Ideas"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["investor", "admin", "idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <Ideas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/IdeasGuest"
            element={
              !userRole ? (
                <IdeasGuest />
              ) : userRole === "idea-owner" ? (
                <IdeasOwner />
              ) : userRole === "investor" || userRole === "admin" ? (
                <Ideas />
              ) : (
                <IdeasGuest />
              )
            }
          />

          <Route
            path="/ideaDetails"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["investor", "admin", "idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <IdeaDetails userRole={""} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["investor", "idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Chat"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["investor", "idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/popup-template"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["investor"]}
                fallback={<IdeasGuest />}
              >
                <PopupTemplate />
              </ProtectedRoute>
            }
          />


          <Route
            path="/NoIdeas"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["investor", "admin"]}
                fallback={<IdeasGuest />}
              >
                <NoIdeas />
              </ProtectedRoute>
            }
          />
          <Route path="/update-state" element={<UpdateState ideaId={""} />} />

          <Route
            path="/ideaOwnerActivities"
            element={
              <ProtectedRoute
                userRole={userRole}
                allowedRoles={["idea-owner"]}
                fallback={<IdeasGuest />}
              >
                <IdeaOwnerActivities />
              </ProtectedRoute>
            }
          />



        </Routes>
      </section>
      <Footer />
    </Router>
  );
}

export default App;

