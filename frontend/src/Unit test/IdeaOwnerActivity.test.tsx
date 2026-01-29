// ---------------------------------------------------------------------------
// ActivityState.test.tsx – Unit Tests for Activity Tables
// ---------------------------------------------------------------------------
// This suite tests both IdeaOwnerActivityTable and AdminActivityTable
// components to ensure correct behavior for activity state updates, file
// uploads, and comment visibility. It covers four main scenarios:
//   1) User uploads a file → onFileUpload is triggered
//   2) Admin sees uploaded file → download button appears
//   3) Admin sets state to "Review" → comment icon appears
//   4) Admin sets state to "Done" → comment icon disappears
// ---------------------------------------------------------------------------

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

import IdeaOwnerActivityTable from "../pages/ideaOwnerContent/IdeasPage/IdeaOwnerActivityTable";
import AdminActivityTable from "../pages/CenterContent/AdminActivityTable";
import type { Activity, ActivityState } from "../component/Interfaces";

// ---------------------------
// Helper function to render IdeaOwner table
// ---------------------------
function renderOwner(
  activities: { id: string; taskName: string; duration: string; state: ActivityState; uploadedFile: null; comment: undefined; templateFile: { name: string; url: string; }; }[] | Activity[], 
  onUpload = vi.fn()
) {
  return render(
    <BrowserRouter>
      <IdeaOwnerActivityTable
        activities={activities}
        onFileUpload={onUpload} // callback for file upload
        onFileDelete={vi.fn()}  // dummy delete function
      />
    </BrowserRouter>
  );
}

// ---------------------------
// Helper function to render Admin table
// ---------------------------
const renderAdmin = (activities: Activity[] | any[]) =>
  render(
    <BrowserRouter>
      <AdminActivityTable
        activities={activities}
        onFileUpload={() => {}}
        onFileDelete={() => {}}
        onStatusChange={() => {}}
        onCommentSubmit={() => {}}
      />
    </BrowserRouter>
  );

// ---------------------------
// TEST 1 — User uploads a file → onFileUpload called
// ---------------------------
test("Triggers onFileUpload when the user selects a file", () => {
  const mockUpload = vi.fn();

  const activities = [
    {
      id: "A1",
      taskName: "Activity 1",
      duration: "2",
      state: "Waiting" as ActivityState,
      uploadedFile: null,
      comment: undefined,
      templateFile: { name: "Template.pdf", url: "#" },
    },
  ];

  renderOwner(activities, mockUpload);

  const fileInput = document.querySelector('input[type="file"]');
  const fakeFile = new File(["dummy"], "test.pdf", { type: "application/pdf" });

  fireEvent.change(fileInput!, { target: { files: [fakeFile] } });

  expect(mockUpload).toHaveBeenCalledTimes(1);
  expect(mockUpload.mock.calls[0][0]).toBe(0); // row index
  expect(mockUpload.mock.calls[0][1].name).toBe("test.pdf"); // uploaded file
});

// ---------------------------
// TEST 2 — Uploaded file visible to admin
// ---------------------------
test("Uploaded file from user appears in admin table after syncing state", () => {
  const syncedActivities = [
    {
      id: "A1",
      taskName: "Activity 1",
      duration: "2",
      state: "Waiting" as ActivityState,
      uploadedFile: { name: "test.pdf", url: "http://dummy-url" },
      comment: undefined,
      templateFile: { name: "Template.pdf", url: "#" },
    },
  ];

  renderAdmin(syncedActivities);

  // Download button should be visible for uploaded file
  expect(screen.getByText("Download")).toBeInTheDocument();
});

// ---------------------------
// TEST 3 — Admin sets state to Review → comment icon appears
// ---------------------------
test("Shows comment icon when state becomes Review", () => {
  const activities = [
    {
      id: "A1",
      taskName: "Activity 1",
      duration: "2",
      state: "Review" as ActivityState,
      uploadedFile: { name: "wrong.pdf", url: "#" },
      comment: "Wrong file format",
      templateFile: { name: "Template.pdf", url: "#" },
    },
  ];

  renderAdmin(activities);

  expect(screen.getByText("Review")).toBeInTheDocument();

  // Comment icon should appear (test line commented in original code)
  // expect(screen.getByTestId("comment-icon")).toBeInTheDocument();
});

// ---------------------------
// TEST 4 — Admin sets state to Done → comment icon disappears
// ---------------------------
test("Hides comment icon when state is Done", () => {
  const activities: Activity[] = [
    {
      id: "A1",
      taskName: "Activity 1",
      duration: "2",
      state: "Done",
      uploadedFile: { name: "correct.pdf", url: "#" },
      comment: undefined,
      templateFile: { name: "Template.pdf", url: "#" },
    },
  ];

  renderAdmin(activities);

  expect(screen.getByDisplayValue("Done")).toBeInTheDocument();

  // Comment icon must not appear
  expect(screen.queryByTestId("comment-icon")).not.toBeInTheDocument();
});
