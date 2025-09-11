import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./layouts/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Capo from "./pages/Capo.jsx";
import Manager from "./pages/Manager.jsx";
import Catalog from "./pages/Catalog.jsx";
import Login from "./pages/Login.jsx";

/* Route protégée (simple, basée sur localStorage) */
function ProtectedRoute({ children, role }) {
  const auth = JSON.parse(localStorage.getItem("core_auth_v1") || "{}");
  const user = auth?.user || null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/capo"
          element={
            <ProtectedRoute role="capo">
              <Capo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <Manager />
            </ProtectedRoute>
          }
        />
        <Route path="/catalog" element={<Catalog />} />
        {/* évite écran blanc si route inconnue */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppShell>
  );
}
