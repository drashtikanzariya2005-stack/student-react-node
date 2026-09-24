import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Only lets the request through if a customer is logged in.
export function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
