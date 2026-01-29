// -------------------------------------------------------------
// Mock API handler for the /ideas POST endpoint.
// This simulates FastAPI backend responses for testing purposes.
// It helps ensure predictable and isolated testing without calling
// the real backend server during development or unit tests.
// -------------------------------------------------------------

import { http, HttpResponse } from "msw";

// Define the expected structure of the POST request body
interface IdeaPayload {
  ideaName: string;
  problem?: string | null;
  solution?: string | null;
  advantages?: string | null;
  readinessLevel?: string | null;
  fields?: string[];
}

export const handlers = [
  http.post("http://localhost:8000/ideas", async ({ request }) => {
    // Explicitly inform TypeScript that the request body is of type IdeaPayload
    const body = (await request.json()) as IdeaPayload;

    // Case 1: Exact match → Accepted response
    if (body.ideaName === "Smart Tourism Guide Aseer") {
      return HttpResponse.json({
        status: "accepted",
        ideaName: body.ideaName,
        businessModel: {},
        summary: "test summary"
      });
    }

    // Case 2: Similar idea → Rejected with similarity details
    if (body.ideaName === "Aseer Digital Tour Twin") {
      return HttpResponse.json({
        status: "rejected",
        similarity_score: 0.92,
        nearest_match: "Smart Tourism Guide Aseer",
        improvement_tips: {
          why_similar: ["Both target tourism in Aseer"],
          niche_pivots: ["Focus on heritage-only routes"],
          feature_differentiators: ["3D culture explorer"],
          gtm_strategies: ["Partner with local tour guides"],
          risks_and_mitigations: ["Avoid seasonality risks"]
        }
      });
    }

    // Case 3: Any other idea → Accepted as a different idea
    return HttpResponse.json({
      status: "accepted",
      ideaName: body.ideaName,
      businessModel: {},
      summary: "different idea summary"
    });
  }),
];
