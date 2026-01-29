// src/utils/sendMessage.ts

import { collection, doc, addDoc, updateDoc, serverTimestamp, FieldValue } from "firebase/firestore";
import type { User } from "firebase/auth"; // Import User type
import { db } from "../firebase";


type SendMessagePayload = {
  text?: string;
  fileName?: string;
  fileData?: string;
  fileUrl?: string;
  fileSize?: string;
};

// Define the base properties for any message
interface BaseMessage {
  senderId: string;
  createdAt: FieldValue;
  type: "text" | "file" | "image";
}

// Define the specific type for a text message
interface TextMessage extends BaseMessage {
  type: "text";
  text?: string;
}

// Define the specific type for a file or image message
interface FileOrImageMessage extends BaseMessage {
  type: "file" | "image";
  fileName?: string;
  fileData?: string;
  fileUrl?: string;
  fileSize?: string;
}

// Union type for all possible message types
type Message = TextMessage | FileOrImageMessage;

export async function sendMessageLogic(
  currentUser: User, // Specify User type
  conversationId: string,
  type: "text" | "file" | "image",
  payload: SendMessagePayload
) {
  if (!currentUser || !conversationId) return;

  const messagesCol = collection(db, "conversations", conversationId, "messages");

  let msg: Message; // Declare msg with the union type

  if (type === "text") {
    msg = {
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      type: "text",
      text: payload.text,
    };
  } else {
    // type is "file" or "image"
    msg = {
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      type: type, // This correctly assigns "file" or "image"
      fileName: payload.fileName,
      fileData: payload.fileData,
      fileUrl: payload.fileUrl,
      fileSize: payload.fileSize,
    };
  }

  await addDoc(messagesCol, msg);

  // Update conversation
  const convRef = doc(db, "conversations", conversationId);
  const lastText =
    type === "text" ? payload.text : payload.fileName || "File";

  await updateDoc(convRef, {
    lastMessage: lastText,
    lastUpdated: serverTimestamp(),
  });
}
