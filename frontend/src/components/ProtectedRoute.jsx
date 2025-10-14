import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../Pages/Users/UserContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) return <div>Loading...</div>; // wait for session check

  if (!user) return <Navigate to="/users/login" replace />; // not logged in

  return children; // logged in, render protected page
}
