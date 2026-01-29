// IdeaDetails.tsx
// This component fetches and displays detailed information about a specific idea, including its overview, team members, attachments, and activities.
// Tabs are conditionally rendered based on the user's role (admin, idea-owner, or investor).
// It also handles starting a chat with the idea leader and manages state for idea details and team members.
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, collection, addDoc, getDoc, getDocs, query, where, serverTimestamp, type DocumentData, } from "firebase/firestore";
import { db, auth } from "../../firebase";
import UpdateState from "../CenterContent/UpdateState"; // adjust path as needed
// Components
import Tabs from "../../component/Tabs";
import OverviewCard from "./OverviewCard";
import TeamTable from "./TeamTable";
import AttachmentCard from "../CenterContent/AttachmentCard";
import type { IdeaInfo, TeamMember, Activity, Tab, IdeaOwnerData, } from "../../component/Interfaces";
import IdeaOwnerActivities from "../ideaOwnerContent/IdeasPage/IdeaOwnerActivities ";
import AdminActivities from "../CenterContent/AdminActivities ";
import ContactCard from "../InvestorContent/ContactCard";

interface DetailsInvestorProps {
  userRole: string;
}
// State for idea details, team members, active tab
const IdeaDetails: React.FC<DetailsInvestorProps> = ({ userRole }) => {
  const [ideaInfo, setIdeaInfo] = useState<IdeaInfo | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const navigate = useNavigate();
  const location = useLocation();

  const ideaId = location.state?.ideaId;// get idea ID from router state
  const roleFromState = location.state?.userRole;
  const effectiveRole = userRole || roleFromState || "investor";

  // Conditionally define tabs based on user role
  const tabs: Tab[] =
    effectiveRole === "admin"
      ? [
        { id: "overview", label: "Overview" },
        { id: "team", label: "Team Information" },
        { id: "update", label: "Update State" },
        { id: "activity", label: "Activity" },
      ]
      : effectiveRole === "idea-owner"
        ? [
          { id: "overview", label: "Overview" },
          { id: "team", label: "Team Information" },
          { id: "activity", label: "Activity" },
        ]
        : [
          { id: "overview", label: "Overview" },
          { id: "team", label: "Team Information" },
          { id: "contact", label: "Contact" },
        ];

  //Fetch Idea Details, Team, and Activities
  useEffect(() => {
    const fetchIdea = async () => {
      if (!ideaId) return;



      // --------------------------------------------------------------
      // 1- Fetch idea details from Firestore
      // --------------------------------------------------------------

      try {
        const docRef = doc(db, "ideas", ideaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const ideaData = docSnap.data() as DocumentData;


          // --------------------------------------------------------------
          // 2- Map Firestore data to IdeaInfo structure
          // --------------------------------------------------------------

          setIdeaInfo({
            id: docSnap.id,
            email: ideaData.email ?? "",
            ideaName: ideaData.ideaName ?? "",
            description: ideaData.description ?? "",
            readinessLevel:
              ideaData.readinessLevel ?? "",

            fields: Array.isArray(ideaData.fields) ? ideaData.fields : [],
            // logo fields (logoUrl is optional in your interface)
            logoText: ideaData.ideaImageUrl ?? "",
            logoColor: ideaData.logoColor ?? "bg-gray-300",
            logoUrl: ideaData.logoUrl ?? null,
            additionalFileUrl: ideaData.additionalFileUrl
              ? {
                File: "File",
                url: ideaData.additionalFileUrl as string,
              }
              : undefined,
            state:
              ideaData.state === "Incubation" ||
                ideaData.state === "Ready To Invest" ||
                ideaData.state === "Waiting"
                ? (ideaData.state as
                  | "Waiting"
                  | "Incubation"
                  | "Ready To Invest")
                : "Waiting",



            // -------------------------------------------------------------------
            // 3- Ensure activities and businessModel have correct types
            // -------------------------------------------------------------------

            activities: Array.isArray(ideaData.activities)
              ? (ideaData.activities as Activity[])
              : [],
            // businessModel expected Record<string,string[]>
            businessModel:
              ideaData.businessModel &&
                typeof ideaData.businessModel === "object"
                ? (ideaData.businessModel as Record<string, string[]>)
                : {},
            // summary required by interface
            summary: ideaData.summary ?? "",
            // optional fields mentioned in interface
            ideaImageUrl: ideaData.ideaImageUrl ?? null,
            team: !!ideaData.team,
            teamMembers: Array.isArray(ideaData.teamMembers)
              ? (ideaData.teamMembers as TeamMember[])
              : [],
          } as IdeaInfo);





          // -------------------------------------------------------------------
          // 4-Fetch team members info from "users" collection
          // -------------------------------------------------------------------

          const teamEmails: string[] = ideaData.teamMember || [];
          if (teamEmails.length === 0) {
            setTeamMembers([]);
          } else {
            const membersData: (TeamMember | null)[] = await Promise.all(
              teamEmails.map(async (email, index) => {
                const usersSnapshot = await getDocs(collection(db, "users"));
                const userDoc = usersSnapshot.docs.find((docItem) => docItem.data().email === email);
                if (!userDoc) return null;

                const userData = userDoc.data();
                const userRole = index === 0 ? "Leader" : "Member";

                return {
                  id: userDoc.id,
                  name: `${userData.firstName} ${userData.lastName}`,
                  email: userData.email,
                  university: userData.university || "-",
                  career: userData.career || "-",
                  specialty: userData.specialty || "-",
                  role: userRole,
                } as TeamMember;
              })
            );

            // Remove nulls and set state
            setTeamMembers(membersData.filter((m): m is TeamMember => m !== null));
          }



          // -------------------------------------------------------------------
          // 5- Fetch activities from subcollection
          // -------------------------------------------------------------------

          const activitiesData: Activity[] = [];
          const activitiesSnapshot = await getDocs(
            collection(db, "ideas", ideaId, "Activities")
          );
          for (const activityDoc of activitiesSnapshot.docs) {
            const activitySnap = await getDoc(
              doc(db, "ideas", ideaId, "Activities", activityDoc.id)
            );
            if (activitySnap.exists()) {
              activitiesData.push({
                id: activitySnap.id,
                ...activitySnap.data(),
              } as Activity);
            }
          }

        } else {
          console.log(" No such idea!");
        }
      } catch (err) {
        console.error("Error fetching idea details:", err);
      }
    };

    fetchIdea();
  }, [ideaId, effectiveRole]);



  // ----------------------------------------------------------------------------------------------------------
  // 6- Handle tab switching, state color mapping
  // ----------------------------------------------------------------------------------------------------------

  const handleTabClick = (tabId: string) => setActiveTab(tabId);

  const getStateColor = (state: string) => {
    switch (state) {
      case "Waiting":
        return "bg-orange-300";
      case "Incubation":
        return "bg-[#B5766F]";
      case "Ready To Invest":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };




  // ----------------------------------------------------------------------------------------------------------
  // 7- Handle starting chat with idea leader
  // ----------------------------------------------------------------------------------------------------------


  const handleStartChat = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/signin");
        return;
      }

      const currentUserId = currentUser.uid;

      // Fetch idea document (already guaranteed to exist)
      const ideaRef = doc(db, "ideas", ideaId);
      const ideaSnap = await getDoc(ideaRef);
      const ideaData = ideaSnap.data() as DocumentData;

      // Determine leader ID from teamMember (array of emails)
      let leaderId: string | null = null;

      if (Array.isArray(ideaData.teamMember) && ideaData.teamMember.length > 0) {
        const leaderEmail = ideaData.teamMember[0];

        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", leaderEmail)
        );

        const usersSnap = await getDocs(usersQuery);
        if (!usersSnap.empty) {
          leaderId = usersSnap.docs[0].id;
        }
      }

      if (!leaderId) {
        alert("Could not determine idea leader");
        return;
      }






      // ----------------------------------------------------------------------------------------------------------
      // 8- Check for existing conversation or create new one
      // ----------------------------------------------------------------------------------------------------------

      const convsQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUserId)
      );
      const convsSnap = await getDocs(convsQuery);

      let conversationId: string | null = null;

      for (const c of convsSnap.docs) {
        const data = c.data() as DocumentData;
        const participants: string[] = data.participants || [];
        if (participants.includes(leaderId)) {
          conversationId = c.id;
          break;
        }
      }

      // Create conversation if none exists
      if (!conversationId) {
        const newConvRef = await addDoc(collection(db, "conversations"), {
          participants: [currentUserId, leaderId],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
        conversationId = newConvRef.id;
      }

      // Fetch leader profile
      let leaderProfile: IdeaOwnerData | null = null;
      try {
        const userDoc = await getDoc(doc(db, "users", leaderId));
        if (userDoc.exists()) {
          leaderProfile = userDoc.data() as IdeaOwnerData;
        }
      } catch (error) {
        console.warn("Failed to fetch leader profile:", error);
      }

      // Navigate to chat
      navigate(`/chat/${conversationId}`, {
        state: { conversationId, leaderId, leaderProfile },
      });






    } catch (err: any) {
      if (err?.code === "permission-denied") {
        console.error("Permission denied. Please check Firestore rules.", err);
      } else {
        console.error("Failed to start chat:", err);
      }
    }

  };

  // Render content for the active tab
  const renderTabContent = () => {

    if (!ideaInfo) return null;

    switch (activeTab) {
      case "overview":
        return (
          <>
            <OverviewCard ideaInfo={ideaInfo} getStateColor={getStateColor} />
            <AttachmentCard
              additionalFileUrl={
                ideaInfo.additionalFileUrl as
                | { name: string; size?: string; url: string }
                | undefined
              }
            />          
            </>
        );

      case "team":
        return <TeamTable teamMembers={teamMembers} />;

      case "contact":
        if (effectiveRole === "investor") {
          return <ContactCard handleStartChat={handleStartChat} />;
        }
        return null;

      case "update":
        return effectiveRole === "admin" ? (
          <UpdateState ideaId={ideaId} />
        ) : null;

      case "activity":
        if (effectiveRole === "admin")
          return <AdminActivities />;
        if (effectiveRole === "idea-owner")
          return <IdeaOwnerActivities />;
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-8 py-8">
        {!ideaInfo ? (
          <div className="text-center text-gray-400 py-12 text-lg">
            Loading idea details...
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-start mb-8">
                <h1 className="text-[44px] -mt-1 font-petrona font-bold text-[#1E4263]">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h1>
                {/* Tabs component */}
                <Tabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabClick={handleTabClick}
                />
              </div>

              {/* Show team member count if on team tab */}
              {activeTab === "team" && teamMembers.length > 0 && (
                <div className="flex justify-end mb-0">
                  <div className="px-4 py-1.5 rounded-[8px] border-2 border-[#DCF0ED] bg-[#DCF0ED] text-[#1E4263] font-medium text-sm">
                    {teamMembers.length}{" "}
                    {teamMembers.length === 1 ? "Member" : "Members"}
                  </div>
                </div>
              )}
            </div>
            {renderTabContent()}
          </>
        )}
      </div>
    </div>
  );
};
export default IdeaDetails;
