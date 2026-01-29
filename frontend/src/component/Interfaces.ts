// Centralized Type Definitions
// NOTE 1: All related interfaces (Idea, Team, Activity, etc.) are now moved
// into this single file to keep type definitions organized and easy to maintain.

import type { ReactNode } from "react";
import {Timestamp, FieldValue } from 'firebase/firestore';


export interface IdeaInfo {
  id: string;
  email: string;
  ideaName: string;
  description: string;
  state: "Waiting" | "Incubation state" | "Ready To Invest state";
  readinessLevel: "Prototype" | "MVP" | "Beta" | "Production";
  fields: string[];
  logoText: string;
  logoColor: string;
  attachmentFile?: {
    name: string;
    size: string;
    url: string;
  };
  additionalFileUrl?: string;
  ideaImageUrl?: string;
  team: boolean;
  teamMembers: TeamMember[];
  activities: Activity[];
  businessModel: Record<string, string[]>; // BMC data structure
  summary: string;
}


export interface IdeaType {
  id: string;
  email: string;
  ideaName: string;
  description: string;
  state: string;
  fields: string[];
  readinessLevel: string;
  problem: string;
  solution: string;
  competitiveAdvantage: string;
  logoUrl?: string | null;
  teamMembers?: TeamMember[];
  activities?: Activity[];
  logoText: string;
  logoColor: string;
  ideaImageUrl?: string | null;
}

// Represents each team member involved in the idea
export interface TeamMember {
  id?: string;
  name: string;
  email: string;
  university: string;
  career: string;
  specialty: string;
  role: "Leader" | "Member";
}

export type ActivityState = "Waiting" | "Review" | "Done";

// Represents a project activity 
export interface Activity {
  id: string;
  taskName: string;
  duration: string;
  templateFile: {
    name: string;
    url: string;
  } | null; // can be null after deletion
  uploadedFile?: {
    name: string;
    url: string;
    id?: string;
  } | null; // can be null after deletion
  state: ActivityState;
  comment?: string;
  
}


// Represents a tab item in the UI 
export interface Tab {
  id: string;
  label: string;
  title?: string;
}



export interface Investor {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  investmentType: string;
  About_me: string;
  photoURL: string;
  phoneNumber: string;
  email?: string;
}



// Represents the data structure for an Idea Owner's profile
export interface IdeaOwnerData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  university: string;
  career: string;
  specialty: string;
}

// Represents the data structure for an Investor's profile
export interface InvestorData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  investmentType: string;
  photoURL: string;
  Role: string;
  aboutMe: string;
}


export interface AdminActivityTableProps {
  activities: Activity[];
  onFileUpload: (index: number, file: File) => void;
  onFileDelete: (index: number) => void;
  onStatusChange: (index: number, newStatus: ActivityState) => void;
  onCommentSubmit: (index: number, newComment: string) => void; // إضافة دالة إرسال الكومنت
}


export interface AttachmentCardProps {
  additionalFileUrl?: string | null;
}


export interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: string;
  onCommentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
}

export interface OverviewCardProps {
  ideaInfo: IdeaInfo;
  getStateColor: (state: string) => string;
}

export type ServerStatus = 'checking' | 'connected' | 'disconnected' | 'error';



export interface StatusBadgeProps {
  status: "Accept" | "Waiting" | "Reject" | "Incubation state" | "Ready To Invest state" | "Review" | "Done";
}


export interface IdeaOwnerActivityTableProps {
  activities: Activity[];
  onFileUpload: (index: number, file: File) => void;
  onFileDelete: (index: number) => void;
}


export interface ResponsiveWrapperProps {
  children: ReactNode;
  baseWidth?: number; // default design width
}


export interface UpdateStateProps {
  ideaId: string;
}

export interface AdminActivitiesProps {
  ideaId: string;
  ideaState?: string;
}


export interface IdeaOwnerActivitiesProps {
  ideaId: string;
  ideaState?: string;
}



export interface IdeasProps {
  userRole: string | null;
}



export interface IdeaData {
  ideaName: string;
  problem: string;
  solution: string;
  readinessLevel: string;
  advantages: string;
  fields: string[];
}


// Defines the structure of rejection feedback from backend (AI model)
export interface RejectionTips {
  similarity_score: number;
  nearest_match: string;
  improvement_tips: Record<string, string[]>;
  [key: string]: any;
}

// Props passed to this component from parent
export interface AddIdeaFormProps {
  addIdea: (idea: IdeaData) => void;
}

// Define the structure of an Idea object
export interface Idea {
  ideaName: string;
  problem: string;
  solution: string;
  readinessLevel?: string;
  advantages?: string;
  fields?: string[];
  summary?: string;
  bmc?: any;
}


export interface FormDataState {
    teamMember: string[];
    ideaImage: File | null;
    additionalFile: File | null;
}


// Modal component props
export interface ViewCommentProps {
  isOpen: boolean;
  comment: string;
  onClose: () => void;
}


export type UserProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  [key: string]: unknown; // optional extra fields from Firebase
};

export type Conversation = {
  id: string;
  participants: string[];
  title?: string;
  lastMessage?: string;
  lastUpdated?: Timestamp;
  createdAt?: Timestamp;
  unread?: boolean;
  otherId?: string | null;
  displayName?: string | null;
};

export type Message = {
  id: string;
  senderId: string;
  type: 'text' | 'file' | 'image';
  text?: string;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  fileData?: string;
  createdAt?: Timestamp | FieldValue;
};


export type SubscriptionModalsProps = {
  showPremiumModal: boolean;
  setShowPremiumModal: React.Dispatch<React.SetStateAction<boolean>>;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: React.Dispatch<React.SetStateAction<boolean>>;

  formData: {
    name: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      cardNumber: string;
      expiryDate: string;
      cvv: string;
    }>
  >;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  plans: { id: string; name: string; price: string }[];
  selectedPlan: string;
  setSelectedPlan: (value: string) => void;
  handleStartFreeTrial: () => void;
}

