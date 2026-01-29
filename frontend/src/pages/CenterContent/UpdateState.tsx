import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, addDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import Swal from 'sweetalert2';
import { emailMessages } from '../../utils/emailMessages';
import GradientButton from "../../component/GradientButton";
import WhiteButton from "../../component/WhiteButton";
import type { UpdateStateProps } from '../../component/Interfaces';
/**
 * UpdateState Component
 * ---------------------
 * This React component allows updating the status of an idea and notifying the team leader via email.
 * 
 * Features:
 * 1. Dropdown to select idea state ('Incubation' or 'Ready To Invest').
 * 2. Modal confirmation before updating the state.
 * 3. Sends email notification to the team leader using a backend API.
 * 4. Updates Firestore with the new state.
 * 5. Automatically creates default "Activities" subcollection if state is 'Incubation'.
 * 6. Server health check before updating.
 */

const UpdateState: React.FC<UpdateStateProps> = ({ ideaId }) => {

  // State management
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [teamLeaderEmail, setTeamLeaderEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentState, setCurrentState] = useState<string | null>(null);

  // Define the server status messages
  const serverStatusMessages: { [key: string]: string } = {
    checking: 'Checking server...',
    connected: 'Server connected',
    disconnected: 'Server disconnected - Start backend server',
    error: 'Server error',
  };

  // Fetch idea details to get team leader email
  useEffect(() => {
    const fetchIdeaDetails = async () => {
      if (!ideaId) return;
      try {
        const ideaSnap = await getDoc(doc(db, "ideas", ideaId));
        if (ideaSnap.exists()) {

          const data = ideaSnap.data();

          const teamMembers: string[] = ideaSnap.data().teamMember || [];
          if (teamMembers.length > 0) setTeamLeaderEmail(teamMembers[0]);

          // Save the current idea state here
          setCurrentState(data.state || null);
        }

      } catch (err) {
        console.error("Error fetching leader email:", err);
      }
    };
    fetchIdeaDetails();
  }, [ideaId]);

  // Check server health
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {

          method: 'GET',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        });
        if (response.ok) setServerStatus('connected');
        else setServerStatus('error');
      } catch {
        setServerStatus('disconnected');
      }
    };
    checkServer();
  }, []);


  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  // Handle confirm update
  const handleConfirm = async () => {
    if (!selectedState || !ideaId) return;
    setModalOpen(false);

    if (serverStatus !== 'connected') {
      alert('Server is not connected.');
      return;
    }
    if (!teamLeaderEmail) {
      Swal.fire({ icon: 'warning', title: 'Missing Email', text: 'Cannot find team leader email.', confirmButtonColor: '#16787bff' });
      return;
    }

    setLoading(true);

    try {

      // Fetch current state from Firestore
      const ideaRef = doc(db, "ideas", ideaId);

      // Map selectedState to display value
      const stateValue = selectedState === "incubation" ? "Incubation" : "Ready To Invest";

      // Send email to team leader
      const res = await fetch(`${import.meta.env.VITE_API_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          to: teamLeaderEmail,
          subject: emailMessages[selectedState].subject,
          message: emailMessages[selectedState].message,
        }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      Swal.fire({ icon: 'success', title: 'Success!', text: 'State updated and email sent!', showConfirmButton: false, timer: 4000 });

      await updateDoc(ideaRef, { state: stateValue });

      // Add default activities for incubation
      if (stateValue === "Incubation") {
        const activitiesRef = collection(ideaRef, 'Activities');
        const defaultActivities = [
          { taskName: "Business Model Development", duration: 4, state: "Waiting", comment: "", templateFile: { name: "Business_Model_Template.pdf", url: "/activity_tamplete/Business_Model_Template.pdf" }, uploadedFile: { name: "", url: "" } },
          { taskName: "Marketing Research", duration: 4, state: "Waiting", comment: "", templateFile: { name: "Marketing_Research_Template.pdf", url: "/activity_tamplete/Marketing_Research_Template.docx" }, uploadedFile: { name: "", url: "" } },
          { taskName: "Financial Planning", duration: 4, state: "Waiting", comment: "", templateFile: { name: "Financial_Plan_Template.pdf", url: "/activity_tamplete/financial_plan_template.docx" }, uploadedFile: { name: "", url: "" } },
          { taskName: "Product Development", duration: 8, state: "Waiting", comment: "", templateFile: { name: "Product_Development_Template.pdf", url: "/activity_tamplete/product-development.pdf" }, uploadedFile: { name: "", url: "" } },
          { taskName: "Prototype Testing", duration: 8, state: "Waiting", comment: "", templateFile: { name: "Prototype_Test_Template.pdf", url: "/activity_tamplete/prototype-test.docx" }, uploadedFile: null },
          { taskName: "Final Presentation", duration: 4, state: "Waiting", comment: "", templateFile: { name: "Final_Presentation_Template.pdf", url: "/activity_tamplete/final presenation.pdf" }, uploadedFile: { name: "", url: "" } },
        ];
        for (const activity of defaultActivities) await addDoc(activitiesRef, activity);
      }

    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      console.error(err);
    } finally {
      setLoading(false);
      setSelectedState(null);
    }
  };


  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


  // Monitor server status changes
  useEffect(() => {
    console.log(serverStatusMessages[serverStatus]);
  }, [serverStatus]);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  // Get available options based on current state
  const getAvailableOptions = () => {
    if (!currentState) return [];

    if (currentState === "Waiting") {
      return ["incubation", "ready"];
    }

    if (currentState === "Incubation") {
      return ["ready"];
    }

    if (currentState === "Ready To Invest") {
      return ["incubation"];
    }

    return [];
  };

  return (
    <main className="font-roboto text-gray-800">
      <div className="max-w-screen-xl mx-auto p-8">
        {/* Instructions */}
        <div >


          {/* Dropdown */}
          {/* If idea is READY TO INVEST → show message instead of dropdown */}
          {currentState === "Ready To Invest" ? (
            <div className="flex items-center justify-center min-h-[50vh] w-full">
              <p className="text-center font-semibold text-lg text-gray-700">
                You reached the final stage. You cannot update the stage.
              </p>
            </div>
          ) : (

            /* Otherwise show the dropdown menu */
            <div className="relative mb-8" ref={dropdownRef}>
              <div className="rounded-lg max-w-2xl mr-auto">
                <p className="mb-6 text-base text-gray-700 font-medium">
                  Once the state is updated, the idea owner will be notified by email.
                </p>
                <div
                  className={`w-full p-4 border-2 rounded-md bg-white text-base cursor-pointer flex justify-between items-center transition-all duration-300
      ${selectedState ? 'border-[#4a90a4] text-gray-800' : 'border-gray-200 text-gray-400'}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>
                    {selectedState
                      ? (selectedState === "incubation"
                        ? "Incubation state"
                        : "Ready To Invest state")
                      : "Select Idea State"}
                  </span>
                  <span className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>

                {dropdownOpen && (
                  <div className=" w-full top-full left-0 right-0 bg-white border border-gray-400 border-t-0 rounded-b-md z-50 shadow-lg">
                    <div className="rounded-lg max-w-2xl mr-auto">

                      {getAvailableOptions().map((key) => (
                        <div
                          key={key}
                          className={`w-full p-4 cursor-pointer text-gray-500 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200 rounded-b-md z-50 shadow-lg
            ${selectedState === key ? ' w-full bg-teal-50 text-[#4a90a4] font-medium rounded-b-md z-50 shadow-lg' : ''}`}
                          onClick={() => {
                            setSelectedState(key);
                            setDropdownOpen(false);
                          }}
                        >
                          {key === "incubation" ? "Incubation state" : "Ready To Invest state"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Update Button */}
          {currentState !== "Ready To Invest" && (
            <GradientButton
              size="mid"
              className="w-40"
              disabled={!selectedState || loading || serverStatus !== 'connected'}
              onClick={() => setModalOpen(true)}
            >
              {loading ? <span>Processing...</span> : <span>Update</span>}
            </GradientButton>
          )}
        </div>



        {/* Confermation Modal*/}
        {modalOpen && (
          <div className="fixed inset-0  backdrop-blur bg-opacity-50 flex justify-center items-center z-[1000]">
            <div className="bg-white rounded-xl p-8 max-w-lg w-[90%] text-center shadow-2xl relative">
              <button className="absolute top-4 right-4 text-gray-600 text-2xl" onClick={() => setModalOpen(false)}>&times;</button>
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl text-white font-bold">!</div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Update</h2>
              <p className="text-gray-600 mb-8 text-sm">Are you sure you want to update the status?</p>
              <div className="flex gap-4 justify-center">
                <WhiteButton onClick={() => setModalOpen(false)}>Cancel</WhiteButton>
                <GradientButton onClick={handleConfirm}>Confirm</GradientButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UpdateState;
