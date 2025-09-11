
import React from "react";
import { Navigate } from "react-router-dom";
import { getAuth } from "@/shared/auth.js";

export function ProtectedRoute({ children, role }){
  const { user } = getAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
