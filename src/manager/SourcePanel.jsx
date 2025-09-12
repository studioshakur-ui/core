import React from "react";
import { loadOrg, moveMember, addMember } from "@/shared/orgStore.js";
import { historyCapture } from "@/shared/history.js";
import SmartAssignDrawer from "@/manager/SmartAssignDrawer.jsx";
import { rankTeams, rememberRecentTeam, leastLoadedTeamId } from "@/shared/assist.js";

const ranges = [
  { id: "AF", label: "A–F", test: (c) => c >= "A" && c <= "F" },
  { id: "GL", label: "G–L", test: (c) => c >= "G" && c <= "L" },
  { id: "MR", label: "M–R", test: (c) => c >= "M" && c <= "R" },
  { id: "SZ", label: "S–Z", test: (c) => c >= "S" && c <= "Z" },
];

export default function SourcePanel({ selected, setSelected, onMoved }) {
  const [org, setOrg] = React.useState(() => loadOrg() || {members:[],teams:[],unassigned:[],suspects:[]});
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState("AF");
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => {
    const i = setInterval(() => setOrg(loadOrg() || {members:[],teams:[],unassigned:[],suspects:[]}), 400);
    return () => clearInterval(i);
  }, []);

  const o = org && typeof org === "object" ? org : {members:[],teams:[],unassigned:[],suspects:[]};

  const allUnassigned = (o.unassigned || [])
    .map((id) => (o.members || []).find((m) => m.id === id))
    .filter(Boolean);

  const filtered = allUnassigned.filter((m) => {
    const name = (m.name || "").trim();
    const first = name.charAt(0).toUpperCase();
    const inRange = (ranges.find((r) => r.id === tab)?.test(first)) || false;
    const match = name.toLowerCase().includes(q.toLowerCase());
    return inRange && match;
  });

  const selectedCount = filtered.reduce((n, m) => n + (selected.has(m.id) ? 1 : 0), 0);

  function clearSelection() {
    setSelected(prev => {
      const n = new Set(prev);
      filtered.forEach(m => n.delete(m.id));
      return n;
    });
  }

  function assignTo(teamId) {
    const ids = filtered.map(m=>m.id).filter(id => selected.has(id));
    if (!ids.length) return;
    historyCapture();
    ids.forEach(id => moveMember(id, teamId || null));
    if (teamId) rememberRecentTeam(teamId);
    setSelected(prev => { const n=new Set(prev); ids.forEach(id=>n.delete(id)); return n; });
    onMoved?.();
    setDrawer(false);
  }

  // SUGGESTIONS : top3 = récents/moins chargé
  const suggestions = rankTeams(o).slice(0, 5);
  const leastId = leastLoadedTeamId(o);
  const chips = [];
  for (const s of suggestions) {
    if (chips.length >= 3) break;
    if (!chips.find(c => c.id === s.id)) chips.push(s);
  }
  if (leastId && !chips.find(c => c.id === leastId)) {
    const leastMeta = suggestions.find(s => s.id === leastId);
    if (leastMeta) chips[ chips.length < 3 ? chips.length : 2 ] = leastMeta;
  }

  return (
    <div className="card h-full relative">
      {/* Filtres */}
      <div className="flex items-center gap-2 mb-2">
        {ranges.map((r) => (
          <button
            key={r.id}
            className={`tab ${tab === r.id ? "active" : ""}`}
            onClick={() => setTab(r.id)}
          >
            {r.label}
          </button>
        ))}
        <input className="input flex-1" placeholder="Cerca…" value={q} onChange={(e)=>setQ(e.target.value)}/>
        <button className="btn" onClick={()=>{
          const name = prompt("Aggiungi Operaio (nome)?");
          if (!name) return;
          historyCapture();
          addMember({ name });
        }}>+ Operaio</button>
      </div>

      {/* BARRE CONTEXTUELLE */}
      {selectedCount > 0 && (
        <div className="selbar">
          <div className="selbar-left">
            <span className="badge badge--muted">{selectedCount} selezionati</span>
          </div>
          <div className="selbar-actions">
            {chips.map(c => (
              <button key={c.id} className="chip" onClick={() => assignTo(c.id)}>
                Capo · {c.capoName || "mancante"}
                <span className="chip-count">{c.sizeNoCapo}</span>
              </button>
            ))}
            <button className="btn" onClick={() => setDrawer(true)}>Più…</button>
            <button className="btn ghost" onClick={() => assignTo(null)} title="Invia in Sorgente">↩ Sorgente</button>
            <button className="btn ghost" onClick={clearSelection}>Deseleziona</button>
          </div>
        </div>
      )}

      {/* Liste simple scrollable */}
      <div className="border rounded-xl overflow-hidden" style={{ height: 420, overflowY: "auto" }}>
        {filtered.map((m) => {
          const checked = selected.has(m.id);
          return (
            <div key={m.id} className="px-2 py-1">
              <label className="member">
                <input
                  type="checkbox" className="h-4 w-4" checked={checked}
                  onChange={() => setSelected(prev => { const n=new Set(prev); n.has(m.id)?n.delete(m.id):n.add(m.id); return n; })}
                />
                <div className="min-w-0">
                  <div className="name truncate-2" title={m.name}>{m.name}</div>
                  <div className="meta">{m.role || "Altro"}</div>
                </div>
              </label>
            </div>
          );
        })}
        {!filtered.length && (
          <div className="p-3 text-sm text-secondary">Nessun nome in questo filtro…</div>
        )}
      </div>

      {/* Tiroir */}
      <SmartAssignDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        org={o}
        onAssign={(teamId) => assignTo(teamId)}
      />
    </div>
  );
}
