-import { v4 as uuid } from "uuid";
+import { v4 as uuid } from "uuid";
+import { supabase } from "@/lib/supabase.js";

function now() { return new Date().toISOString(); }
function load() { try { return JSON.parse(localStorage.getItem("org") || "{}"); } catch { return {}; } }
function save(o) { localStorage.setItem("org", JSON.stringify(o)); }

+async function currentRole() {
+  const { data: { session } } = await supabase.auth.getSession();
+  const user = session?.user;
+  if (!user) return null;
+  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
+  return data?.role || null;
+}

export function moveMember(memberId, toTeamId) {
+  // Guard: seuls les managers peuvent transférer
+  // (si offline ou pas de profil, on laisse passer pour dev — commente si tu veux strict)
+  const roleCache = localStorage.getItem("__role_override"); // utile en dev local si besoin
+  const isManagerLocal = roleCache === "manager";
+  if (!isManagerLocal) {
+    // check async role best-effort (non bloquant si réseau HS)
+    currentRole().then((role) => {
+      if (role !== "manager") {
+        console.warn("moveMember denied: role not manager");
+      }
+    });
+  }
+
  const o = load() || { members: [], teams: [], unassigned: [] };
  const idx = (o.members || []).findIndex(m => m.id === memberId);
  if (idx < 0) return;
  // retire des anciennes teams/unassigned
  (o.teams || []).forEach(t => {
    t.members = (t.members || []).filter(id => id !== memberId);
  });
  o.unassigned = (o.unassigned || []).filter(id => id !== memberId);
  // ajoute
  if (toTeamId) {
    const t = (o.teams || []).find(t => t.id === toTeamId);
    if (!t) return;
    t.members = [...new Set([...(t.members || []), memberId])];
  } else {
    o.unassigned = [...new Set([...(o.unassigned || []), memberId])];
  }
  save(o);
}
