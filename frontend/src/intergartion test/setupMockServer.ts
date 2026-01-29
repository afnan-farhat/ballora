// -------------------------------------------------------------
// Setup Mock Service Worker (MSW) for Vitest in a Node environment.
// This server intercepts network requests during tests and returns
// mock responses to ensure consistent, isolated, and reliable testing.
// -------------------------------------------------------------

import { setupServer } from "msw/node";
import { handlers } from "./validateIdeaUniqueness.mock";

// Create a mock server instance using the defined request handlers
export const server = setupServer(...handlers);

// Tell Vitest to start the mock server before running any tests
beforeAll(() => server.listen());

// Reset handlers after each test to avoid state leakage between tests
afterEach(() => server.resetHandlers());

// Shut down the mock server after all tests have finished
afterAll(() => server.close());
