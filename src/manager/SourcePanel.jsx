// src/manager/SourcePanel.jsx
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
  // Etat “source de vérité”
  const [org, setOrg] = React.useState(() => loadOrg() || {members:[],teams:[],unassigned:[],suspects:[]});

  // Etat de filtre “en préparation” (UI) — ne s’applique PAS tant qu’on ne clique pas “Filtrer”
  const [pending, setPending] = React.useState({ tab: "AF", q: "" });

  // Etat de filtre “appliqué” (figé jusqu’à ce que le manager reclique)
  const [applied, setApplied] = React.useState({ tab: "AF", q: "" });

  const [drawer, setDrawer] = React.useState(false);

  // Rafraîchit l’org toutes les 400 ms (légère poll locale)
  React.useEffect(() => {
    const i = setInterval(() => setOrg(loadOrg() || {members:[],teams:[],unassigned:[],suspects:[]}), 400);
    return () => clearInterval(i);
  }, []);

  const o = org && typeof org === "object" ? org : {members:[],teams:[],unassigned:[],suspects:[]};
  const allUnassigned = (o.unassigned || [])
    .map((id) => (o.members || []).find((m) => m.id === id))
    .filter(Boolean);

  // Applique UNIQUEMENT l’état “applied”
  const filtered = allUnassigned.filter((m) => {
    const name = (m.name || "").trim();
    const first = name.charAt(0).toUpperCase();
    const inRange = (ranges.find((r) => r.id === applied.tab)?.test(first)) || false;
    const match = name.toLowerCase().includes((applied.q || "").toLowerCase());
    return inRange && match;
  });

  const selectedCount = filtered.reduce((n, m) => n + (selected.has(m.id) ? 1 : 0), 0);
  const showEmptyHint = filtered.length === 0;

  function clearSelection() {
    setSelected(prev => {
      const n = new Set(prev);
      filtered.forEach(m => n.delete(m.id));
      return n;
    });
  }

  function applyFilters() {
    setApplied({ ...pending });
  }

  function resetFilters() {
    setPending({ tab: "AF", q: "" });
    setApplied({ tab: "AF", q: "" });
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

  // SUGGESTIONS
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
      {/* Barre de filtres (MANUEL) */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* Tabs (état pending uniquement) */}
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r.id}
              className={`tab ${pending.tab === r.id ? "active" : ""}`}
              onClick={() => setPending(p => ({ ...p, tab: r.id }))}
            >
              {r.label}
            </button>
          ))}
        </div>

        <input
          className="input flex-1 min-w-[180px]"
          placeholder="Cerca…"
          value={pending.q}
          onChange={(e)=>setPending(p => ({ ...p, q: e.target.value }))}
        />

        {/* Actions de filtre */}
        <button className="btn primary" onClick={applyFilters}>Filtrer</button>
        <button className="btn ghost" onClick={resetFilters}>Réinitialiser</button>

        {/* Ajout rapide */}
        <button className="btn" onClick={()=>{
          const name = prompt("Aggiungi Operaio (nome)?");
          if (!name) return;
          historyCapture();
          addMember({ name });
        }}>+ Operaio</button>
      </div>

      {/* Bandeau contextuel quand sélection */}
      {selectedCount > 0 && (
        <div className="selbar">
          <div className="selbar-left">
            <span className="badge badge--muted">{selectedCount} selezionati</span>
            <span className="chip">Filtro: {applied.label || ranges.find(r=>r.id===applied.tab)?.label} · “{applied.q || "—"}”</span>
          </div>
          <div className="selbar-actions">
            {chips.map(c => (
              <button key={c.id} className="chip" onClick={() => assignTo(c.id)}>
                Capo · {c.capoName || "mancante"}
                <span className="chip-count">{c.sizeNoCapo}</span>
              </button>
            ))}
            <button className="btn" onClick={() => setDrawer(true)}>Più…</button>
            <button className="btn ghost" onClick={() => assignTo(null)}>↩ Sorgente</button>
            <button className="btn ghost" onClick={clearSelection}>Deseleziona</button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="border rounded-xl overflow-hidden" style={{ height: 420, overflowY: "auto" }}>
        {filtered.map((m) => {
          const checked = selected.has(m.id);
          return (
            <div key={m.id} className="px-2 py-1">
              <label className="member">
                <input
                  type="checkbox" className="h-4 w-4" checked={checked}
                  onChange={() => setSelected(prev => {
                    const n=new Set(prev);
                    n.has(m.id)?n.delete(m.id):n.add(m.id);
                    return n;
                  })}
                />
                <div className="min-w-0">
                  <div className="name truncate-2" title={m.name}>{m.name}</div>
                  <div className="meta">{m.role || "Altro"}</div>
                </div>
              </label>
            </div>
          );
        })}

        {showEmptyHint && (
          <div className="p-4 text-sm text-secondary">
            Nessun nome con il filtro attuale. Modifica i criteri e premi <b>Filtrer</b>.
          </div>
        )}
      </div>

      {/* Tiroir affectation */}
      <SmartAssignDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        org={o}
        onAssign={(teamId) => assignTo(teamId)}
      />
    </div>
  );
}
