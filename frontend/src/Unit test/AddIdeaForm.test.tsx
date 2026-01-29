// ---------------------------------------------------------------------------
// AddIdeaForm.test.tsx – Unit Tests for AddIdeaForm Component
// ---------------------------------------------------------------------------
// This file contains a comprehensive suite of unit tests for the AddIdeaForm.
// The tests cover:
//   • Field selection rules (max 2 fields, "Other" exclusive behavior)
//   • Form validation logic (required fields, word limits, numeric-only inputs)
//   • Ensuring errors display correctly and validation blocks form submission
// These tests use React Testing Library + Vitest to simulate user behavior.
// ---------------------------------------------------------------------------

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AddIdeaForm from "../pages/ideaOwnerContent/IdeasPage/AddIdeaForm";
import { BrowserRouter } from "react-router-dom";
import { expect, vi } from "vitest";

// Mock function to track addIdea() submissions
const mockAddIdea = vi.fn();

// Helper render function
const renderForm = () =>
  render(
    <BrowserRouter>
      <AddIdeaForm addIdea={mockAddIdea} />
    </BrowserRouter>
  );


// ---------------------------------------------------------------------------
// FIELD SELECTION TESTS
// ---------------------------------------------------------------------------

// Validate that selecting more than 2 fields shows an error
test("Shows error when selecting more than 2 fields", async () => {
  const user = userEvent.setup();
  renderForm();

  const checkboxes = screen.getAllByRole("checkbox");

  // Select first 3 fields (only 2 should remain selected)
  await user.click(checkboxes[0]);
  await user.click(checkboxes[1]);
  await user.click(checkboxes[2]);

  // Error message must appear
  expect(
    screen.getByText(/you can select a maximum of 2 fields only./i)
  ).toBeInTheDocument();

  // Only 2 checkboxes should stay selected
  const selectedBoxes = checkboxes.filter((box) => (box as HTMLInputElement).checked);
  expect(selectedBoxes.length).toBe(2);
});


// Ensure selecting "Other" prevents selecting additional options
test('When "Other" is selected, user cannot select any additional field', async () => {
  const user = userEvent.setup();
  renderForm();

  const checkboxes = screen.getAllByRole("checkbox");

  const otherCheckbox = checkboxes[checkboxes.length - 1];
  const firstFieldCheckbox = checkboxes[0];

  // Select "Other"
  await user.click(otherCheckbox);
  expect(otherCheckbox).toBeChecked();

  // Attempt to select another option
  await user.click(firstFieldCheckbox);

  // "Other" must remain selected, and the new one must remain unchecked
  expect(firstFieldCheckbox).not.toBeChecked();
  expect(otherCheckbox).toBeChecked();
});


// Selecting "Other" should clear previously selected fields
test('Selecting "Other" clears all previous selected fields and keeps only "Other"', async () => {
  const user = userEvent.setup();
  renderForm();

  const checkboxes = screen.getAllByRole("checkbox");

  const firstField = checkboxes[0];
  const secondField = checkboxes[1];
  const otherCheckbox = checkboxes[checkboxes.length - 1];

  // Select two fields
  await user.click(firstField);
  await user.click(secondField);

  expect(firstField).toBeChecked();
  expect(secondField).toBeChecked();

  // Now select "Other"
  await user.click(otherCheckbox);

  // All previous fields should be cleared
  expect(firstField).not.toBeChecked();
  expect(secondField).not.toBeChecked();

  // Only "Other" remains selected
  expect(otherCheckbox).toBeChecked();
});


// ---------------------------------------------------------------------------
// VALIDATION TESTS – Based on validateForm()
// ---------------------------------------------------------------------------

// Test: When all fields are empty → validation should show all error messages
test("Shows correct validation errors when ALL fields are empty", async () => {
  const user = userEvent.setup();
  renderForm();

  const generateBtn = screen.getByRole("button", { name: /generate/i });
  await user.click(generateBtn);

  // Verify each required field error message appears
  expect(screen.getByText("Idea name is required.")).toBeInTheDocument();
  expect(screen.getByText("Problem is required.")).toBeInTheDocument();
  expect(screen.getByText("Solution is required.")).toBeInTheDocument();
  expect(screen.getByText("Competitive advantage is required.")).toBeInTheDocument();
  expect(screen.getByText("Readiness level is required.")).toBeInTheDocument();
  expect(screen.getByText("Please select at least one field.")).toBeInTheDocument();

  // Form should NOT call submit handler
  expect(mockAddIdea).not.toHaveBeenCalled();
});


// Test: Word limits are enforced correctly
test("Shows correct errors when word limits are exceeded", async () => {
  const user = userEvent.setup();
  renderForm();

  // Very long inputs
  const longIdeaName = "one two three four five six seven eight nine ten eleven"; // >10 words
  const long150Word = "w ".repeat(151).trim(); // >150 words

  // Fill inputs with excessive text
  await user.type(screen.getByPlaceholderText("Idea Name"), longIdeaName);
  await user.type(screen.getByPlaceholderText("Brief Description Of The Problem"), long150Word);
  await user.type(
    screen.getByPlaceholderText("Brief Summary of Proposed Solution (30 Words)"),
    long150Word
  );
  await user.type(screen.getByPlaceholderText("Advantages"), long150Word);

  await user.click(screen.getByRole("button", { name: /generate/i }));

  // Word limit validation messages
  expect(await screen.findByText("Idea name must not exceed 10 words.")).toBeInTheDocument();
  expect(await screen.findByText("Problem must not exceed 150 words.")).toBeInTheDocument();
  expect(await screen.findByText("Solution must not exceed 150 words.")).toBeInTheDocument();
  expect(await screen.findByText("Competitive advantage must not exceed 150 words.")).toBeInTheDocument();
}, 20000);


// Test: Valid inputs → no validation errors
test("Form submits (passes validation) when ALL FIELDS are valid", async () => {
  const user = userEvent.setup();
  renderForm();

  // Enter valid values
  await user.type(screen.getByPlaceholderText("Idea Name"), "Smart AI Assistant");
  await user.type(
    screen.getByPlaceholderText("Brief Description Of The Problem"),
    "This describes the main problem clearly and concisely."
  );
  await user.type(
    screen.getByPlaceholderText("Brief Summary of Proposed Solution (30 Words)"),
    "A well-structured AI system that solves this issue in a scalable way."
  );
  await user.type(
    screen.getByPlaceholderText("Advantages"),
    "Fast, accurate, and scalable solution."
  );

  // Select readiness level
  await user.click(screen.getByText("Select Level"));
  await user.click(await screen.findByText("Prototype"));

  // Select at least one field
  await user.click(screen.getAllByRole("checkbox")[0]);

  const generateBtn = screen.getByRole("button", { name: /generate/i });
  await user.click(generateBtn);

  // Ensure no validation errors appear
  expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/must not exceed/i)).not.toBeInTheDocument();

  // Should not submit to backend here (form might rely on AI before addIdea)
  expect(mockAddIdea).not.toHaveBeenCalled();
});


// Test: Inputs containing ONLY numbers should be rejected
test("Shows error when text fields contain only numbers", async () => {
  const user = userEvent.setup();
  renderForm();

  await user.type(screen.getByPlaceholderText("Idea Name"), "123456");
  await user.type(screen.getByPlaceholderText("Brief Description Of The Problem"), "987654");
  await user.type(
    screen.getByPlaceholderText("Brief Summary of Proposed Solution (30 Words)"),
    "456789"
  );
  await user.type(screen.getByPlaceholderText("Advantages"), "654321");

  await user.click(screen.getByRole("button", { name: /generate/i }));

  // Numeric-only validation errors
  expect(await screen.findByText("Idea name must contain letters, not only numbers.")).toBeInTheDocument();
  expect(await screen.findByText("Problem description must contain letters, not only numbers.")).toBeInTheDocument();
  expect(await screen.findByText("Solution must contain letters, not only numbers.")).toBeInTheDocument();
  expect(await screen.findByText("Competitive advantage must contain letters, not only numbers.")).toBeInTheDocument();
});
