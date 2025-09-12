// src/shared/session.js
import React from "react";
import { supabase } from "@/lib/supabase.js";

const SessionCtx = React.createContext({ user: null, role: null, loading: true });

export function SessionProvider({ children }) {
  const [state, setState] = React.useState({ user: null, role: null, loading: true });

  async function refreshProfile(user) {
    if (!user) { setState({ user: null, role: null, loading: false }); return; }
    // Tente de lire le profil (table 'profiles')
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = data?.role || null;
    setState({ user, role, loading: false });
  }

  React.useEffect(() => {
    // session initiale
    supabase.auth.getSession().then(({ data }) => {
      refreshProfile(data.session?.user || null);
    });
    // écoute login/logout/refresh
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      refreshProfile(session?.user || null);
    });
    return () => { sub?.subscription?.unsubscribe?.(); };
  }, []);

  return <SessionCtx.Provider value={state}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  return React.useContext(SessionCtx);
}
