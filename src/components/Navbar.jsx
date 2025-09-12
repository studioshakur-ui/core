import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSession } from "@/shared/session.js";
import { supabase } from "@/lib/supabase.js";

function UserBadge() {
  const { user, role } = useSession();
  if (!user) return <a className="btn" href="/login">Login</a>;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-secondary">{user.email} · {role || "—"}</span>
      <button className="btn ghost" onClick={()=>supabase.auth.signOut()}>Logout</button>
    </div>
  );
}
/**
 * Navbar CORE
 * - Liens: Dashboard, Capo, Manager, Catalogo, Login
 * - Badge utilisateur (nom · rôle) si connecté, sinon bouton "Accedi"
 * - Bouton "Esci" qui vide l'auth locale et redirige vers /login
 */

const linkCls = ({ isActive }) =>
  [
    "px-3 py-2 rounded-xl border",
    "transition",
    isActive
      ? "bg-white/80 text-slate-900 border-white/80 shadow-sm"
      : "bg-white/30 dark:bg-white/10 border-white/30 hover:bg-white/60 hover:border-white/60",
  ].join(" ");

function getUser() {
  try {
    const auth = JSON.parse(localStorage.getItem("core_auth_v1") || "{}");
    return auth?.user || null;
  } catch {
    return null;
  }
}

function UserBadge() {
  const nav = useNavigate();
  const user = getUser();

  if (!user) {
    return (
      <NavLink to="/login" className="px-3 py-2 rounded-xl border">
        Accedi
      </NavLink>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="px-3 py-2 rounded-xl border bg-white/50 dark:bg-white/10 text-sm">
        {user.name} · {user.role}
      </span>
      <button
        className="px-3 py-2 rounded-xl border"
        onClick={() => {
          localStorage.setItem("core_auth_v1", JSON.stringify({ user: null }));
          nav("/login");
        }}
      >
        Esci
      </button>
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/30 bg-white/50 dark:bg-slate-900/40 border-b border-white/30">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo/core-logo.svg"
            alt="CORE"
            className="h-8 w-auto drop-shadow"
          />
          <span className="text-sm uppercase tracking-wider opacity-70">
            il cuore dell'avanzamento cavi
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" className={linkCls}>
            Dashboard
          </NavLink>
          <NavLink to="/capo" className={linkCls}>
            Capo
          </NavLink>
          <NavLink to="/manager" className={linkCls}>
            Manager
          </NavLink>
          <NavLink to="/catalog" className={linkCls}>
            Catalogo
          </NavLink>
          <NavLink to="/login" className={linkCls}>
            Login
          </NavLink>
        </nav>

        {/* User actions */}
        <div className="flex items-center gap-2">
          <UserBadge />
        </div>
      </div>
    </header>
  );
}
