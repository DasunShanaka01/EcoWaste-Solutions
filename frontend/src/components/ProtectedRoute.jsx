import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Example: check if SESSIONID cookie exists
  const isAuthenticated = document.cookie.includes("SESSIONID");

  if (!isAuthenticated) {
    // If not logged in, redirect to login
    return <Navigate to="/users/login" replace />;
  }

  // If logged in, render the children (protected page)
  return children;
}
