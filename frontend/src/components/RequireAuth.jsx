// src/components/RequireAuth.jsx
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    // Si NO hay token → mandar al login
    return <Navigate to="/" replace />;
  }

  return children;
}
