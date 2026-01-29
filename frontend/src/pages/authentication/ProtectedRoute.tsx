import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

// Props for the ProtectedRoute component
interface ProtectedRouteProps {
  userRole: string | null;      
  allowedRoles: string[];       
  children: ReactNode;           
  fallback?: ReactNode;          
}

// Component that protects routes based on user role
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  userRole,
  allowedRoles,
  children,
  fallback
}) => {

    // if user not logged in > redirect or show fallback
  if (!userRole) return fallback ? <>{fallback}</> : <Navigate to="/signin" />;

    // if user role not allowed > redirect home page
  if (!allowedRoles.includes(userRole)) return <Navigate to="/" />;

    // otherwise > render the page
  return <>{children}</>;
};

export default ProtectedRoute;
