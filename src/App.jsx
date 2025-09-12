import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/layouts/AppShell.jsx";

import Dashboard from "@/pages/Dashboard.jsx";
import Capo from "@/pages/Capo.jsx";
import Catalogo from "@/pages/Catalog.jsx";
import Login from "@/pages/Login.jsx";
import Manager from "@/manager/Manager.jsx";

import { SessionProvider } from "@/shared/session.js";
import { RequireAuth, RequireRole } from "@/components/RequireAuth.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />

            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/capo" element={<RequireRole role="capo"><Capo /></RequireRole>} />
            <Route path="/manager" element={<RequireRole role="manager"><Manager /></RequireRole>} />

            <Route path="/catalogo" element={<RequireAuth><Catalogo /></RequireAuth>} />
            <Route path="*" element={<div style={{padding:24}}>404</div>} />
          </Routes>
        </AppShell>
      </SessionProvider>
    </BrowserRouter>
  );
}
