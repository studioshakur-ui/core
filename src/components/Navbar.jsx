// src/components/Navbar.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "@/lib/supabase.js";
import { useSession } from "@/shared/session.jsx";

function UserBadge() {
  const { user, role } = useSession();

  if (!user) {
    return (
      <Link className="btn" to="/login">
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-secondary truncate max-w-[40vw]">
        {user.email} · <b>{role || "—"}</b>
      </span>
      <button className="btn ghost" onClick={() => supabase.auth.signOut()}>
        Logout
      </button>
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="w-full border-b bg-[rgba(12,14,20,0.6)] backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
      <div className="container flex items-center justify-between py-3 gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600" />
          <div className="font-semibold tracking-wide">CORE</div>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "chip active" : "chip"}>
            Dashboard
          </NavLink>
          <NavLink to="/manager" className={({isActive}) => isActive ? "chip active" : "chip"}>
            Manager
          </NavLink>
          <NavLink to="/capo" className={({isActive}) => isActive ? "chip active" : "chip"}>
            Capo
          </NavLink>
          <NavLink to="/catalogo" className={({isActive}) => isActive ? "chip active" : "chip"}>
            Catalogo
          </NavLink>
        </nav>

        <UserBadge />
      </div>
    </header>
  );
}
