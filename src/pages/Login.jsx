import React from "react";
import { supabase } from "@/lib/supabase.js";
import { useSession } from "@/shared/session.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { user, role, loading } = useSession();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!loading && user) {
      // Redirige selon le rôle
      if (role === "manager") nav("/manager", { replace: true });
      else nav("/capo", { replace: true });
    }
  }, [loading, user, role, nav]);

  async function onLogin(e) {
    e.preventDefault();
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message || "Errore di login");
  }

  async function onLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <h1 className="title mb-4">Accedi</h1>
      {err && <div className="alert">{err}</div>}
      <form className="grid gap-3" onSubmit={onLogin}>
        <label className="grid gap-1">
          <span className="text-sm text-secondary">Email</span>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-secondary">Password</span>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button className="btn primary mt-2" type="submit">Login</button>
      </form>

      <div className="mt-4 text-sm text-secondary">
        {loading ? "Verifica sessione…" : user ? (
          <div className="flex items-center justify-between">
            <span>Loggato come {user.email} · ruolo: <b>{role || "—"}</b></span>
            <button className="btn ghost" onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <span>Inserisci credenziali.</span>
        )}
      </div>
    </div>
  );
}
