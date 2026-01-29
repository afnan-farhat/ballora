import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useLocation } from "react-router-dom";
import { Upload } from "upload-js"; //  Upload.io
import IdeaOwnerActivityTable from "../IdeasPage/IdeaOwnerActivityTable";
const upload = Upload({ apiKey: "public_W23MTRB4KCyCEpHHZigugRnUKhMS" }); //  Key from  Upload.io
import type { Activity } from "../../../component/Interfaces";

/*
 -  IdeaOwnerActivities Component
 --Displays a list of assigned incubation activities for a specific idea.
 --Allows the idea owner to upload or delete activity-related files.
 --Data is fetched and updated from Firebase Firestore and Upload.io.
 */
const IdeaOwnerActivities: React.FC = () => {
  const location = useLocation();
  const ideaId = location.state?.ideaId;
  const ideaState = location.state?.ideaState;
  const [activitiesState, setActivitiesState] = useState<Activity[]>([]);

  const [loading, setLoading] = useState(true);

  //Fetch activities from Firestore (only when idea is in "Incubation" phase)
  useEffect(() => {
    const fetchActivities = async () => {
      if (!ideaId) return;

      try {
        const activitiesCollectionRef = collection(
          db,
          "ideas",
          ideaId,
          "Activities"
        );
        const activitiesSnapshot = await getDocs(activitiesCollectionRef);

        if (activitiesSnapshot.empty) {
          setActivitiesState([]);
          // Map Firestore documents into Activity objects
        } else {
          const activitiesData: Activity[] = activitiesSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              taskName: doc.data().taskName || "",
              duration: doc.data().duration || "",
              templateFile: doc.data().templateFile || { name: "", url: "" },
              uploadedFile: doc.data().uploadedFile || null,
              state: doc.data().state || "Waiting",
              comment: doc.data().comment || "",
            })
          );
          // Filter out duplicate task names to avoid repeated rows

          const uniqueActivities = activitiesData.filter(
            (item, index, self) =>
              index === self.findIndex((a) => a.taskName === item.taskName)
          );

          setActivitiesState(uniqueActivities);
        }
      } catch (err) {
        console.error(" Error fetching activities:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ideaState === "Incubation") fetchActivities();
    else setLoading(false);
  }, [ideaId, ideaState]);

  // Uploads a file using Upload.io, updates Firestore with the new file link,
  const handleFileUpload = async (index: number, file: File) => {
    try {
      const result = await upload.uploadFile(file);
      // result may include fileId depending on SDK; try common fields
      // store both URL and file id when available so server can delete later
      type UploadResult = {
        fileUrl?: string;
        url?: string;
        fileId?: string;
        id?: string;
        file?: { id?: string };
      };
      const r = result as UploadResult;
      const fileUrl = r.fileUrl || r.url || "";
      const fileId = r.fileId || r.id || r.file?.id || null;

      // Temporary debug logs: print SDK upload result so we can confirm which field holds the file ID
      // REMOVE THESE LOGS AFTER DEBUGGING
      try {
        console.log("[temp-log] upload result:", r);
        console.log("[temp-log] resolved fileUrl:", fileUrl, "fileId:", fileId);
      } catch {
        // swallow logging errors
      }
      const fileName = file.name;

      const updatedActivities = [...activitiesState];
      updatedActivities[index] = {
        ...updatedActivities[index],
        uploadedFile: { name: fileName, url: fileUrl, id: fileId ?? undefined },
      };

      setActivitiesState(updatedActivities);

      // Update Firestore document with new uploaded file data
      const ref = doc(
        db,
        "ideas",
        ideaId,
        "Activities",
        updatedActivities[index].id
      );
      const uploadedField = fileId
        ? { name: fileName, url: fileUrl, id: fileId }
        : { name: fileName, url: fileUrl };
      await updateDoc(ref, {
        uploadedFile: uploadedField,
      });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleFileDelete = async (index: number) => {
    try {
      const activity = activitiesState[index];
      if (!ideaId || !activity.id) return;

      const uploaded = activity.uploadedFile;
      if (!uploaded) return;

      // prefer stored file id, otherwise send url to server for extraction
      const payload: Record<string, string> = {};
      if (uploaded.id) payload.fileId = uploaded.id;
      else if (uploaded.url) payload.fileUrl = uploaded.url;

      // Call backend endpoint to delete from Upload.io
      try {
        await fetch("http://localhost:5000/delete-upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Error calling delete endpoint:", err);
        // continue to remove reference locally/Firestore even if server call failed
      }

      // Remove file reference from Firestore
      const ref = doc(db, "ideas", ideaId, "Activities", activity.id);
      await updateDoc(ref, { uploadedFile: null });

      // Update UI state to reflect deletion
      const updated = [...activitiesState];
      updated[index] = { ...updated[index], uploadedFile: null };
      setActivitiesState(updated);

      console.log(
        " File deleted from Upload.io & Firestore (reference removed)"
      );
    } catch (error) {
      console.error(" Error deleting uploaded file:", error);
    }
  };

  // UI Rendering

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-12">
        Loading activities...
      </div>
    );
  }



  // Render the main table component for activities
 if (ideaState !== "Incubation") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-center font-semibold text-lg">
          {ideaState === "Waiting" && (
            <>
              Your idea is currently in the{" "}
              <span className="font-bold text-orange-300">Waiting</span> phase. 
              <br></br>You will see the activities once your idea moves to the{" "}
              <span className="font-bold text-[#B5766F]">Incubation</span> phase.
            </>
          )}
          {ideaState === "Ready To Invest" && (
            <>
              Congratulations! Your idea is now in the{" "}
              <span className="font-bold text-green-600">Ready To Invest</span> phase. 
              <br></br>You don’t need to track activities.
            </>
          )}
        </p>
      </div>
    );
  }

  
  return (
    <IdeaOwnerActivityTable
      activities={activitiesState}
      onFileUpload={handleFileUpload}
      onFileDelete={handleFileDelete}
    />
  );
};

export default IdeaOwnerActivities;
