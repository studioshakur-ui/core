import React from "react";
import { historyCanUndo, historyCanRedo } from "@/shared/history.js";

function median(arr){ const a=[...arr].sort((x,y)=>x-y); if(!a.length) return 0; const m=Math.floor(a.length/2); return a.length%2?a[m]:Math.round((a[m-1]+a[m])/2); }

export default function ManagerHeader({
  org,
  busy,
  onImportChange,
  onUndo,
  onRedo,
  onExportCSV,
  onExportJSON,
}) {
  // ✅ Béton : si org est undefined, on prend un objet vide valide
  const o = org && typeof org === "object"
    ? org
    : { members: [], teams: [], unassigned: [], suspects: [] };

  const total = o.members?.length || 0;
  const unassigned = o.unassigned?.length || 0;
  const teams = o.teams || [];
  const capi = teams.length;

  const sizes = teams.map(t => (t.members || []).filter(id => id !== t.capo).length);
  const minSize = sizes.length ? Math.min(...sizes) : 0;
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const medSize = median(sizes);
  const missingCapo = teams.filter(t => !t.capo).length;

  const dupMap = new Map();
  (o.members || []).forEach(m => {
    const k = (m.name || "").trim().toLowerCase();
    dupMap.set(k, (dupMap.get(k) || 0) + 1);
  });
  const dupCount = Array.from(dupMap.values()).filter(n => n > 1).length;

  return (
    <div className="card topbar">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">Organigramma</h2>
          <div className="mt-2 flex flex-wrap gap-6 text-sm">
            <span className="badge">Membri: <b>{total}</b></span>
            <span className="badge">In sorgente: <b>{unassigned}</b></span>
            <span className="badge">Capi: <b>{capi}</b></span>
            <span className={`badge ${missingCapo ? "badge--warn" : ""}`}>Capi mancanti: <b>{missingCapo}</b></span>
            <span className="badge">Mediana membri/capo: <b>{medSize}</b></span>
            <span className="badge">Min–Max: <b>{minSize}–{maxSize}</b></span>
            <span className={`badge ${dupCount ? "badge--danger" : ""}`}>Duplicati: <b>{dupCount}</b></span>
            <span className="badge badge--muted">Stato: <b>Bozza</b></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="btn">📥 Importa nomi
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onImportChange} disabled={busy}/>
          </label>
          <button className="btn" onClick={onUndo} disabled={!historyCanUndo()}>↶ Annulla</button>
          <button className="btn" onClick={onRedo} disabled={!historyCanRedo()}>↷ Ripeti</button>
          <button className="btn" onClick={onExportCSV}>📤 Esporta CSV</button>
          <button className="btn" onClick={onExportJSON}>💾 Esporta JSON</button>
          {busy ? <span className="text-sm opacity-70">Import in corso…</span> : null}
        </div>
      </div>
    </div>
  );
}
