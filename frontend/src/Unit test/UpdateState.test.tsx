/**
 * @vitest-environment jsdom
 */

// ---------------------------------------------------------------------------
// UpdateState.test.tsx – Unit Tests for UpdateState Component
// ---------------------------------------------------------------------------
// This suite tests the UpdateState component, including state dropdown options,
// state transitions, email sending, and activity creation. It mocks Firebase
// Firestore, fetch, and SweetAlert2, so no real backend calls are made.
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UpdateState from "../pages/CenterContent/UpdateState";
import { vi, describe, test, expect, type Mock } from "vitest";
import { getDoc, addDoc } from "firebase/firestore";

// --------------------
// Mock Firebase (No real DB calls)
// --------------------
vi.mock("firebase/firestore", () => {
  const mockFirestoreDb = {};
  return {
    getFirestore: vi.fn(() => mockFirestoreDb),
    doc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
  };
});

// --------------------
// Mock fetch (API calls like sending emails)
// --------------------
const mockFetch = vi.fn();
window.fetch = mockFetch.mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as Response)
) as unknown as typeof fetch;

// --------------------
// Mock SweetAlert2
// --------------------
vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

// --------------------
// Helper: Render component with a given initial state
// --------------------
const renderWithState = async (state: string | null) => {
  // 1. Mock initial Firestore getDoc call
  (getDoc as Mock).mockResolvedValueOnce({
    exists: () => true,
    data: () => ({ state, teamMember: ["leader@example.com"] }),
  });

  // 2. Render component
  render(<UpdateState ideaId="testId" />);

  // 3. Wait until component fetch completes
  await screen.findByText("Select Idea State");

  // 4. Clear all mocks to reset fetch/Swal history
  vi.clearAllMocks();
};

// --------------------
// Test Cases
// --------------------
describe("UpdateState Component - Vitest", () => {

  // Reset fetch implementation before each test
  beforeEach(() => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );
  });

  // --------------------
  // Case-1: Waiting state shows 'Incubation' and 'Ready To Invest'
  // --------------------
  test("Case-1: Waiting state shows 'Incubation' and 'Ready To Invest' options", async () => {
    await renderWithState("Waiting");

    const dropdownLabel = screen.getByText("Select Idea State");
    fireEvent.click(dropdownLabel);

    expect(screen.getByText("Incubation state")).toBeInTheDocument();
    expect(screen.getByText("Ready To Invest state")).toBeInTheDocument();
  });

  // --------------------
  // Case-2: Incubation state shows only 'Ready To Invest'
  // --------------------
  test("Case-2: Incubation state shows only 'Ready To Invest'", async () => {
    renderWithState("Incubation");

    const dropdownLabel = await screen.findByText("Select Idea State");
    fireEvent.click(dropdownLabel);

    expect(screen.queryByText("Incubation state")).not.toBeInTheDocument();
    expect(screen.getByText("Ready To Invest state")).toBeInTheDocument();
  });

  // --------------------
  // Case-3: Ready To Invest state shows only final message
  // --------------------
  test("Case-3: Ready To Invest state shows only message", async () => {
    renderWithState("Ready To Invest");

    const message = await screen.findByText(
      "You reached the final stage. You cannot update the stage."
    );
    expect(message).toBeInTheDocument();
  });

  // --------------------
  // Case-5: Update to 'Incubation' → sends email & creates default activities
  // --------------------
  test("Case-5: Update to 'Incubation' sends email and creates activities", async () => {
    await renderWithState("Waiting");

    // Mock second getDoc call during handleConfirm
    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ state: "Waiting" }),
    });

    // Select 'Incubation' in dropdown
    fireEvent.click(screen.getByText("Select Idea State"));
    fireEvent.click(screen.getByText("Incubation state"));

    // Click Update button
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    // Click Confirm in modal
    const confirmButton = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // Email API called with correct payload
      expect(window.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/send-email',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringMatching(
            /(?=.*"to":"leader@example.com")(?=.*"subject":"Congratulations! Your idea has entered the Incubation State 🎉🚀")/
          ),
        })
      );

      // Default activities created (6 calls to addDoc)
      expect(addDoc).toHaveBeenCalledTimes(6);
    });
  });

  // --------------------
  // Case-6: Update to 'Ready To Invest' → sends email
  // --------------------
  test("Case-6: Update to 'Ready To Invest' sends email", async () => {
    await renderWithState("Waiting");

    (getDoc as Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ state: "Waiting" }),
    });

    fireEvent.click(screen.getByText("Select Idea State"));
    fireEvent.click(screen.getByText("Ready To Invest state"));

    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    const confirmButton = screen.getByRole("button", { name: /Confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/send-email',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringMatching(
            /(?=.*"to":"leader@example.com")(?=.*"subject":"Congratulations! Your idea is now Ready To Invest 🎉🚀")/
          ),
        })
      );
    });
  });
});
