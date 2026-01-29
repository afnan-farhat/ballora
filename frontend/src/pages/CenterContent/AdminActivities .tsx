import React, { useEffect, useState } from "react";
import { collection, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useLocation } from "react-router-dom";
import type { Activity, ActivityState } from "../../component/Interfaces";
import AdminActivityTable from "./AdminActivityTable";



const AdminActivities: React.FC = () => {
    const location = useLocation();
    const ideaId = location.state?.ideaId;
    // Retrieve the current idea’s state (e.g., Incubation)
    const ideaState = location.state?.ideaState;

    const [activitiesState, setActivitiesState] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);



    /**
    * Handles updating the activity status (e.g., "Done", "Review", "Waiting").
    * Updates the local state and synchronizes the change with Firestore.
    */

    const handleStatusChange = (index: number, newStatus: ActivityState) => {
        const updatedActivities = [...activitiesState];
        updatedActivities[index].state = newStatus;
        setActivitiesState(updatedActivities);

        const activityId = updatedActivities[index].id;
        const activityRef = doc(db, "ideas", ideaId, "Activities", activityId);
        updateDoc(activityRef, { state: newStatus });
    };

    /**
    * Handles submitting or editing an admin comment for a specific activity.
    * Updates the local state and pushes the comment to Firestore.
    */
    const handleCommentSubmit = (index: number, newComment: string) => {
        const updatedActivities = [...activitiesState];
        updatedActivities[index].comment = newComment;
        setActivitiesState(updatedActivities);

        const activityId = updatedActivities[index].id;
        const activityRef = doc(db, "ideas", ideaId, "Activities", activityId);
        updateDoc(activityRef, { comment: newComment });
    };


    /**
    * Sets up a real-time listener to fetch and monitor all activities
    * related to the selected idea from Firestore.
    * Automatically updates the UI when changes occur.
    */
    useEffect(() => {
        if (!ideaId) return;

        const activitiesCollectionRef = collection(db, "ideas", ideaId, "Activities");

        const unsubscribe = onSnapshot(activitiesCollectionRef, (snapshot) => {
            try {
                if (snapshot.empty) {
                    console.log("No activities yet for this idea.");
                    setActivitiesState([]);
                } else {
                    const activitiesData: Activity[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        taskName: doc.data().taskName || "",
                        duration: doc.data().duration || "",
                        templateFile: doc.data().templateFile || { name: "", url: "" },
                        uploadedFile: doc.data().uploadedFile || null,  // Explicitly handle null case
                        state: doc.data().state || "Waiting",
                        comment: doc.data().comment || "",
                    }));

                    // Remove duplicates based on task name
                    const uniqueActivities = activitiesData.filter(
                        (item, index, self) =>
                            index === self.findIndex((a) => a.taskName === item.taskName)
                    );

                    setActivitiesState(uniqueActivities);
                }
            } catch (err) {
                console.error(" Error in activities snapshot:", err);
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error(" Error setting up activities listener:", error);
            setLoading(false);
        });

        // If idea is not in "Incubation" phase, stop listening for updates
        if (ideaState !== "Incubation") {
            setLoading(false);
            return;
        }

        // Cleanup listener when component unmounts
        return () => unsubscribe();

    }, [ideaId, ideaState]);

    /**
     * Placeholder handler – admins cannot upload & delete files directly.
     * File uploads & deletion are managed by idea owners.
     */
    const handleFileUpload = (_index: number, _file: File) => {
        console.log("File uploads can only be handled by idea owners");
    };

    const handleFileDelete = (_index: number) => {
        console.log("File deletion can only be handled by idea owners");
    };


    /**
     * Conditional rendering:
     * - Show loading state while fetching data.
     * - Restrict access if the idea is not in "Incubation" phase.
     * - Display table when activities are available.
     */
    if (loading) {
        return <div className="text-center text-gray-500 py-12">Loading activities...</div>;
    }

    return (
        <div>
            {/* Message based on idea state */}
            {ideaState !== "Incubation" && (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <p className="text-center font-semibold text-lg">
                        {ideaState === "Waiting" && (
                            <>
                                This idea is currently in the{" "}
                                <span className="font-bold text-orange-300">Waiting</span> phase.
                                <br></br>No activity yet to display until it moves to the{" "}
                                <span className="font-bold text-[#B5766F]">Incubation</span> phase.
                            </>
                        )}
                        {ideaState === "Ready To Invest" && (
                            <>
                                This idea is in the{" "}
                                <span className="font-bold text-text-green-600">Ready To Invest</span> phase.
                                <br></br> No activity tracking is required.
                            </>
                        )}
                    </p>
                </div>
            )}


            {/* Loading state */}
            {loading && (
                <div className="text-center text-gray-500 py-12">
                    Loading activities...
                </div>
            )}


            {/* Activities table */}
            {!loading && activitiesState.length > 0 && ideaState === "Incubation" && (
                <AdminActivityTable
                    activities={activitiesState}
                    onFileUpload={handleFileUpload}
                    onFileDelete={handleFileDelete}
                    onStatusChange={handleStatusChange}
                    onCommentSubmit={handleCommentSubmit}
                />
            )}
        </div>
    );
};

export default AdminActivities;