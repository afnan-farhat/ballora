import React, { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";


//  Context type definition
type UserContextType = {
  userRole: string | null; // user role (admin / user)
  userId: string | null; // Firebase user ID
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean; // loading state while fetching user data
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
};

// Create context with undefined as default
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Watch for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        // Check if user is admin
        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setUserRole("admin");
        } else {

          // Check if user is a ideaOwner or investor user
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserRole(data.role || null);
          } else {
            setUserRole(null);
          }
        }
      } else {

        // Reset states when user logs out
        setUserRole(null);
        setUserId(null);

      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userRole, userId, setUserRole, loading, isSaving, setIsSaving }}>
      {children}
    </UserContext.Provider>
  );
};

//  Custom hook for context access
// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};