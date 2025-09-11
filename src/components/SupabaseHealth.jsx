// src/components/SupabaseHealth.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SupabaseHealth() {
  const [msg, setMsg] = useState("checking...");
  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase.from("teams").select("id").limit(1);
        if (error) setMsg("❌ " + error.message);
        else setMsg("✅ Connected to Supabase");
      } catch (e) {
        setMsg("❌ " + (e?.message || "unknown"));
      }
    })();
  }, []);
  return <div className="text-sm opacity-70">{msg}</div>;
}
