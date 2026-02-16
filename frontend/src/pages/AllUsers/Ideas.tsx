import { Filter, Gem, Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";

import WhiteButton from "../../component/WhiteButton";
import GradientButton from "../../component/GradientButton";
import type { IdeaType } from "../../component/Interfaces";

import { useUser } from "../authentication/UserContext";
import Subscription from "../AllUsers/Subscription";
import IdeaFilter from "../InvestorContent/Filter";
import { ndaContent } from "../../utils/ndaContent";

export default function Idea() {
  const navigate = useNavigate();
  // Category Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [appliedCategories, setAppliedCategories] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  // NDA/Popup States

  // General UI/Loading States
  const [, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState(false);
  const { userRole, userId } = useUser();

  // State filter for admin (Admin Tabs)

  const [appliedStates, setAppliedStates] = useState<string[]>([]);

  // Premium & Payment states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("unlimited");
  const [formData, setFormData] = useState({
    name: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  // Ideas Data State
  const [ideas, setIdeas] = useState<IdeaType[]>([]);
  // Fetch user premium status
  useEffect(() => {
    const fetchUserPremiumStatus = async () => {
      try {
        if (!userId) return;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setIsPremiumUser(userData.isPremium === true);
        }
      } catch (error) {
        console.error(" Error fetching premium status:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserPremiumStatus();
  }, [userId]);

  // Fetch ideas based on user role
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);

        let q;
        if (userRole === "admin") {
          q = query(collection(db, "ideas"));
        } else if (userRole === "investor") {
          q = query(
            collection(db, "ideas"),
            where("state", "==", "Ready To Invest")
          );
        } else if (userRole === "idea-owner" && userId) {
          const userEmail = auth.currentUser?.email;
          if (!userEmail) return;

          q = query(
            collection(db, "ideas"),
            where("teamMember", "array-contains", userEmail)
          );
        } else {
          return;
        }

        const querySnapshot = await getDocs(q);
        const mappedIdeas: IdeaType[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || "",
            ideaName: data.ideaName || "",
            description: data.description || "",
            state: data.state || "Waiting",
            fields: Array.isArray(data.fields) ? data.fields : [],
            readinessLevel: data.readinessLevel || "",
            problem: data.problem || "",
            solution: data.solution || "",
            competitiveAdvantage: data.competitiveAdvantage || "",
            ideaImageUrl: data.ideaImageUrl || null,
            teamMembers:
              data.emailMembers?.map((email: string) => ({ email })) || [],
            activities: [],
            logoText: data.ideaName
              ? data.ideaName
                .split(" ")
                .slice(0, 2)
                .map((word: string) => word.charAt(0).toUpperCase())
                .join("")
              : "I",
            logoColor: data.logoColor || "bg-gray-300",
          };
        });

        console.log("Fetched ideas:", mappedIdeas);

        setIdeas(mappedIdeas);
      } catch (error) {
        console.error("Error fetching ideas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [userId, userRole]); // Dependencies to re-fetch when role or ID changes



  // Memoized list of ideas after applying filters (categories and admin states)
  const filteredIdeas = useMemo<IdeaType[]>(() => {
    let filtered = ideas;

    if (appliedCategories.length > 0) {
      filtered = filtered.filter((idea) =>
        idea.fields.some((field) => appliedCategories.includes(field))
      );
    }

    // Apply state filter only for admins
    if (userRole === "admin" && appliedStates.length > 0) {
      filtered = filtered.filter((idea) => appliedStates.includes(idea.state));
    }

    return filtered;
  }, [appliedCategories, appliedStates, ideas, userRole]);

  // List of all possible category fields
  const categories = [
    "AI & Big Data",
    "Health & Biotechnology",
    "Education",
    "Environment & Sustainability",
    "Tourism & Entertainment",
    "Fintech & Business Services",
    "Retail & E-commerce",
    "Creative Industries",
    "Logistics & Supply Chain",
    "Smart Cities & Infrastructure",
    "Other",
  ];
  // Utility function to get color based on idea state
  const getStateColor = (state: string): string => {
    switch (state) {
      case "Waiting":
        return "bg-orange-300";
      case "Incubation":
        return "bg-[#B5766F]";
      case "Ready To Invest":
        return "bg-green-600";
      default:
        return "bg-gray-400";
    }
  };

  // Handler for clicking idea details
  const handleDetailsClick = (ideaId: string, ideaState: string) => {
    if (userRole === "admin" || userRole === "idea-owner") {
      navigate("/ideaDetails", { state: { ideaId, userRole, ideaState } });
      return;
    }
    // Investor flow: check premium status first
    if (isPremiumUser) {
      // Investor navigates to NDA popup (template) if premium
      navigate("/popup-template", {
        state: {
          ideaId,
          popupType: "nda",
          popupContent: ndaContent,
        },
      });
    } else {
      // Show premium modal if not premium
      setShowPremiumModal(true);
    }
  };

  // Premium logic: update user status in DB and local state
  const handleStartFreeTrial = async () => {
    try {
      if (!userId) {
        console.error(" User ID not found");
        return;
      }
      setIsPremiumUser(true);
      setShowSubscriptionModal(false);

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isPremium: true,
      });

      console.log("User upgraded to premium successfully");
    } catch (error) {
      console.error(" Error updating premium status:", error);
    }
  };

  // Subscription plans data
  const plans = [
    { id: "basic", name: "Basic Access", price: "37.52 SAR For 10 Ideas" },
    { id: "premium", name: "Premium Access", price: "56.28 SAR For 20 Ideas" },
    {
      id: "unlimited",
      name: "Unlimited Access",
      price: "187.61 SAR For Unlimited Ideas",
    },
  ];


  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* TOP ROW: Title and Add Idea Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-petrona">
            Ideas
          </h1>

          {userRole === "idea-owner" && (
            <GradientButton
              size="mid"
              className="w-32 md:w-40 !py-2 md:!py-3"
              onClick={() => navigate("/IdeaForm")}
            >
              <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                Add Idea
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </span>
            </GradientButton>
          )}

          {/* BOTTOM ROW: Filters (Admin Tabs / Investor Controls) */}
          {/* Admin Tabs */}
          {userRole === "admin" && (
            <div className="w-full md:w-auto overflow-x-auto overflow-y-hidden border-b border-gray-200">
              <div className="flex min-w-max">
                {["All", "Waiting", "Incubation", "Ready To Invest"].map((tab) => {
                  const isActive = tab === "All" ? appliedStates.length === 0 : appliedStates.includes(tab);
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        if (tab === "All") setAppliedStates([]);
                        else setAppliedStates([tab]);
                      }}
                      className={`px-4 sm:px-5 py-2 text-xs font-medium -mb-px border-b-2 transition-colors whitespace-nowrap                           ${isActive
                        ? "border-[#1F7E90] text-[#1F7E90] font-semibold"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      {tab} {tab !== "All" && tab === "Waiting" ? "state" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Investor Controls */}
          {(userRole === "investor") && (
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                onClick={() => setShowFilterDropdown(true)}
              >
                <Filter className="w-6 h-6 scale-x-[-1] text-[#1F7E90]" />
              </button>

              <GradientButton
                className="!py-2 md:!py-3 px-4 w-auto"
                disabled={isLoadingUser || isPremiumUser}
                onClick={() => !isPremiumUser && setShowSubscriptionModal(true)}
              >
                <span className="flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                  {isLoadingUser || isPremiumUser ? "Already Premium" : "Upgrade subscription"}
                  <Gem className="w-5 h-5" />
                </span>
              </GradientButton>
            </div>
          )}
        </div>

        {/* Ideas list starts here... */}
        {/* Ideas list (Rendered ideas based on current filters) */}{" "}
        <div className="space-y-6">
          {(showAll ? filteredIdeas : filteredIdeas.slice(0, 5)).map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-lg p-6 shadow-sm shadow-[#7C838A] w-full min-h-[240px] flex flex-col justify-between"            >

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                  {/* Idea Logo */}
                  <div
                    className={`w-24 h-24 sm:w-32 sm:h-32 ${idea.logoColor} rounded-lg flex items-center justify-center text-gray-400 font-bold text-base flex-shrink-0 overflow-hidden`}
                  >
                    {idea.ideaImageUrl ? (
                      <img
                        src={idea.ideaImageUrl}
                        alt={idea.ideaName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      idea.logoText
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex-1 min-w-0"> {/* min-w-0 helps with text truncation in flex */}
                      <h3 className="text-xl font-bold text-gray-900 truncate">
                        {idea.ideaName || "No Name Found"}
                      </h3>{" "}
                    </div>
                    {/* Idea Metadata */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStateColor(idea.state)}`}></div>
                        <b className="ml-2">State:&nbsp;</b>
                        <span>{idea.state}</span>
                      </div>

                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 bg-[#248D9D] rounded-full"></div>
                        <b className="ml-2">Idea level:&nbsp;</b>
                        <span>{idea.readinessLevel}</span>
                      </div>

                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 bg-[#2B5C7E] rounded-full"></div>
                        <b className="ml-2">Fields:&nbsp;</b>
                        <span>
                          {idea.fields && idea.fields.length > 0
                            ? idea.fields.join(", ")
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mt-3 line-clamp-2 md:line-clamp-3">
                      {idea.description}
                    </p>
                  </div>
                </div>
                {/* Details Button */}
                <div className="flex sm:flex-col justify-end items-end mt-4 sm:mt-0">
                  <WhiteButton
                    size="mid"
                    onClick={() => handleDetailsClick(idea.id, idea.state)}
                    className="whitespace-nowrap"
                  >
                    Details
                  </WhiteButton>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Idea Filter Component*/}
        <IdeaFilter
          showFilterDropdown={showFilterDropdown}
          setShowFilterDropdown={setShowFilterDropdown}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          setAppliedCategories={setAppliedCategories}
          ideasCount={ideas.length}
          filteredCount={
            ideas.filter((idea) =>
              idea.fields.some((field) => selectedCategories.includes(field))
            ).length
          }
          categories={categories}
          setShowAll={setShowAll}
        />
        {/* Subscription Modals Component */}
        <Subscription
          showPremiumModal={showPremiumModal}
          setShowPremiumModal={setShowPremiumModal}
          showSubscriptionModal={showSubscriptionModal}
          setShowSubscriptionModal={setShowSubscriptionModal}
          formData={formData}
          setFormData={setFormData}
          plans={plans}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          handleStartFreeTrial={handleStartFreeTrial}
          handleInputChange={function (): void {
            throw new Error("Function not implemented.");
          }}
        />

        <div className="flex justify-center mt-8">
          {/* Show 'More' button only if more than 5 ideas and not showing all */}
          {!showAll && filteredIdeas.length > 5 && (
            <div className="flex justify-center mt-8">
              <GradientButton size="mid" onClick={() => setShowAll(true)}>
                More
              </GradientButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
