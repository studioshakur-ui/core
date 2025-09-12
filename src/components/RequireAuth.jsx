import React from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/shared/session.jsx";

export function RequireAuth({ children }) {
  const { user, loading } = useSession();
  if (loading) return <div className="p-6 text-sm text-secondary">Caricamento…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireRole({ children, role }) {
  const { user, loading, role: current } = useSession();
  if (loading) return <div className="p-6 text-sm text-secondary">Caricamento…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && current !== role) return <Navigate to={current === "manager" ? "/manager" : "/capo"} replace />;
  return children;
}
