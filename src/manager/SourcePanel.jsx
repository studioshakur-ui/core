import React from "react";
import * as ReactWindow from "react-window";
import { loadOrg, moveMember, addMember } from "@/shared/orgStore.js";
import { historyCapture } from "@/shared/history.js";

const RWList = ReactWindow && typeof ReactWindow.FixedSizeList === "function"
  ? ReactWindow.FixedSizeList : null;

function FallbackList({ height, width, itemCount, itemSize, children }) {
  return (
    <div style={{ height, width, overflowY: "auto" }}>
      {Array.from({ length: itemCount }).map((_, index) =>
        children({ index, style: { height: itemSize, display: "flex", alignItems: "center" } })
      )}
    </div>
  );
}
const VirtualList = RWList || FallbackList;

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

  const teams = (o.teams || []).map(t => {
    const capo = (o.members || []).find(m => m.id === t.capo);
    const sizeNoCapo = (t.members || []).filter(id => id !== t.capo).length;
    return { ...t, capoName: capo ? capo.name : "", sizeNoCapo };
  }).filter(t => !!t.capo);

  function toggleAll(val) {
    setSelected(prev => {
      const n = new Set(prev);
      filtered.forEach(m => (val ? n.add(m.id) : n.delete(m.id)));
      return n;
    });
  }
  function assignTo(teamId) {
    const ids = filtered.map(m=>m.id).filter(id => selected.has(id));
    if (!ids.length || !teamId) return;
    historyCapture();
    ids.forEach(id => moveMember(id, teamId));
    setSelected(prev => { const n=new Set(prev); ids.forEach(id=>n.delete(id)); return n; });
    onMoved?.();
  }

  const Row = ({ index, style }) => {
    const m = filtered[index];
    const checked = selected.has(m.id);
    return (
      <div style={style} className="px-2">
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
  };

  return (
    <div className="card h-full">
      <div className="flex items-center gap-2 mb-3">
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

      <div className="flex items-center justify-between mb-2 text-sm">
        <div>Filtrati: <b>{filtered.length}</b> · Selezionati: <b>{filtered.filter((m)=>selected.has(m.id)).length}</b></div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={()=>toggleAll(true)}>Seleziona tutti</button>
          <button className="btn" onClick={()=>toggleAll(false)}>Deseleziona</button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden" style={{ height: 420 }}>
        <VirtualList height={420} width={"100%"} itemCount={filtered.length} itemSize={56}>
          {Row}
        </VirtualList>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select className="input flex-1" id="source-assign-team">
          <option value="">Assegna a Capo…</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>Capo {t.capoName} ({t.sizeNoCapo} membri)</option>
          ))}
        </select>
        <button className="btn" onClick={() => assignTo(document.getElementById("source-assign-team").value || "")}>
          Applica
        </button>
      </div>
    </div>
  );
}
