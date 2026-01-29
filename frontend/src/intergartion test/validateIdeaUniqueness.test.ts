// -------------------------------------------------------------
// Integration Test: Backend Uniqueness Validation (Mocked API)
// This file tests the interaction between the frontend logic
// and the mocked FastAPI backend using Vitest, Axios, and MSW.
// Ensures the system behaves correctly without calling the real API.
// -------------------------------------------------------------

import "./setupMockServer.ts";
import { describe, it, expect } from "vitest";
import axios from "axios";

const BASE_URL = "http://localhost:8000";

// Reusing the same payload interface for POST /ideas
interface IdeaPayload {
  ideaName: string;
  problem?: string | null;
  solution?: string | null;
  advantages?: string | null;
  readinessLevel?: string | null;
  fields?: string[];
}

// Helper function to send POST requests to the mocked API
async function postIdea(idea: IdeaPayload) {
  const res = await axios.post(`${BASE_URL}/ideas`, idea);
  return res.data;
}

// -------------------------------------------------------------
// TEST CASES – Integration Behaviour
// -------------------------------------------------------------
describe("Ballora – Validate Idea Uniqueness (Mocked API)", () => {
  
  it("accepts the first unique idea (no existing ideas yet)", async () => {
    // Test payload representing a new, unique idea
    const firstIdea: IdeaPayload = {
      ideaName: "Smart Tourism Guide Aseer",
      problem: "Tourists struggle to find places",
      solution: "AI-guided tourism",
      advantages: "Gamification",
      readinessLevel: "Concept",
      fields: ["Tourism"]
    };

    // Send request and validate mock response
    const result = await postIdea(firstIdea);

    expect(result.status).toBe("accepted");
    expect(result.ideaName).toBe("Smart Tourism Guide Aseer");
    expect(result.businessModel).toBeTypeOf("object");
    expect(result.summary).toBeTypeOf("string");
  });

  it("rejects a very similar idea and returns improvement tips", async () => {
    // Simulated payload for a similar idea
    const similarIdea: IdeaPayload = {
      ideaName: "Aseer Digital Tour Twin",
      problem: "Visitors still struggle",
      solution: "AI assistant tourism",
      advantages: "Same focus",
      readinessLevel: "Concept",
      fields: ["Tourism"]
    };

    // Expect rejection with similarity details
    const result = await postIdea(similarIdea);

    expect(result.status).toBe("rejected");
    expect(result.similarity_score).toBeGreaterThan(0.8);
    expect(result.nearest_match).toBe("Smart Tourism Guide Aseer");
    expect(result.improvement_tips).toBeTypeOf("object");
  });

  it("accepts a clearly different idea from another domain", async () => {
    // Different idea from a non-tourism domain
    const differentIdea: IdeaPayload = {
      ideaName: "AI Contract Reviewer for Legal Teams",
      problem: "Legal review is slow",
      solution: "AI clause detection",
      advantages: "Reduce time",
      readinessLevel: "Prototype",
      fields: ["LegalTech"]
    };

    // Expect acceptance for unrelated idea
    const result = await postIdea(differentIdea);

    expect(result.status).toBe("accepted");
    expect(result.ideaName).toBe("AI Contract Reviewer for Legal Teams");
  });

});
