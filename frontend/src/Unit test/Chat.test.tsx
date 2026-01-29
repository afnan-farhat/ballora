// ---------------------------------------------------------------------------
// sendMessageLogic.test.ts – Unit Tests for sendMessageLogic()
// ---------------------------------------------------------------------------
// This test suite verifies the behavior of sendMessageLogic() without making
// real calls to Firebase. Firestore functions are fully mocked using Vitest.
// It covers:
//   • Sending text messages
//   • Sending file messages
// Ensures that messages are added to the correct collection and that the
// conversation document is updated with the last message and timestamp.
// ---------------------------------------------------------------------------

import { describe, test, expect, vi, beforeEach } from "vitest";
import { DocumentReference, type DocumentData } from "firebase/firestore"; 
import type { User } from "firebase/auth"; 

// ---------------------------
// 1) Mock Firestore Functions
// ---------------------------
const mockAddDoc = vi.fn(); // Mock for addDoc()
const mockUpdateDoc = vi.fn(); // Mock for updateDoc()
const mockCollection = vi.fn(); // Mock for collection()
const mockDoc = vi.fn(); // Mock for doc()
const mockServerTimestamp = vi.fn(() => "SERVER_TIME"); // Mock server timestamp

// Mock Firebase core module
vi.mock("../../firebase", () => ({
  db: "MOCK_DB",
  auth: { currentUser: { uid: "TEST_USER" } },
}));

// Mock Firestore functions
interface MockFirestoreModule {
  collection: (db: string, ...pathSegments: string[]) => string;
  doc: (db: string, ...pathSegments: string[]) => string;
  addDoc: (collectionRef: string, data: object) => Promise<DocumentReference<DocumentData>>;
  updateDoc: (docRef: string, data: object) => Promise<void>;
  serverTimestamp: () => string;
  getFirestore: () => string;
}

vi.mock("firebase/firestore", (): MockFirestoreModule => ({
  collection: (db: string, ...pathSegments: string[]) => mockCollection(db, ...pathSegments),
  doc: (db: string, ...pathSegments: string[]) => mockDoc(db, ...pathSegments),
  addDoc: (collectionRef: string, data: object) => mockAddDoc(collectionRef, data),
  updateDoc: (docRef: string, data: object) => mockUpdateDoc(docRef, data),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: vi.fn(() => "MOCK_DB") as () => string,
}));

// ---------------------------
// 2) Import the REAL logic (not component)
// ---------------------------
import { sendMessageLogic } from "../utils/sendMessage";

// ---------------------------------------------------
// TEST CASES
// ---------------------------------------------------
describe("sendMessageLogic() – Firestore Message Logic", () => {

  const mockUser = { uid: "USER123" } as User;
  const conversationId = "1";

  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
    // Set default return values for mocks
    mockCollection.mockReturnValue("MSG_COLLECTION_REF");
    mockDoc.mockReturnValue("DOC_REF");
  });

  // TEST 1 — Sending a TEXT message
  test("Sends TEXT message correctly", async () => {
    await sendMessageLogic(
      mockUser,
      conversationId,
      "text",
      { text: "Hello" }
    );

    // Verify message is added to Firestore collection
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).toHaveBeenCalledWith(
      "MSG_COLLECTION_REF",
      expect.objectContaining({
        senderId: "USER123",
        type: "text",
        text: "Hello",
        createdAt: "SERVER_TIME",
      })
    );

    // Verify conversation doc is updated with last message and timestamp
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      "DOC_REF",
      expect.objectContaining({
        lastMessage: "Hello",
        lastUpdated: "SERVER_TIME",
      })
    );
  });

  // TEST 2 — Sending a FILE message
  test("Sends FILE message correctly", async () => {
    await sendMessageLogic(
      mockUser,
      conversationId,
      "file",
      {
        fileName: "report.pdf",
        fileUrl: "http://file.com/report.pdf",
        fileSize: "2MB",
      }
    );

    // Verify file message is added to Firestore
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).toHaveBeenCalledWith(
      "MSG_COLLECTION_REF",
      expect.objectContaining({
        senderId: "USER123",
        type: "file",
        fileName: "report.pdf",
        fileUrl: "http://file.com/report.pdf",
        fileSize: "2MB",
        createdAt: "SERVER_TIME",
      })
    );

    // Verify conversation doc updated with file name as last message
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      "DOC_REF",
      expect.objectContaining({
        lastMessage: "report.pdf",
        lastUpdated: "SERVER_TIME",
      })
    );
  });

});
