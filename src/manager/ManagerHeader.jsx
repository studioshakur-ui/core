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
  const o = org && typeof org === "object"
    ? org
    : { members: [], teams: [], unassigned: [], suspects: [] };

  const total = o.members?.length || 0;
  const inSource = o.unassigned?.length || 0;
  const teams = o.teams || [];
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

  const kpis = [
    { label: "Membri", val: total },
    { label: "In sorgente", val: inSource },
    { label: "Capi mancanti", val: missingCapo, tone: missingCapo ? "warn" : "" },
    { label: "Mediana membri/capo", val: medSize },
    { label: "Min–Max", val: sizes.length ? `${minSize}–${maxSize}` : 0 },
    { label: "Duplicati", val: dupCount, tone: dupCount ? "danger" : "" },
  ].filter(k => k.val && k.val !== 0 && k.val !== "0–0");

  return (
    <div className="card topbar">
      <div className="toolbar">
        <h2 className="title">Organigramma</h2>
        <div className="actions">
          <label className="btn primary">
            📥 Importa file
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onImportChange} disabled={busy}/>
          </label>
          <div className="divider" />
          <button className="btn ghost" onClick={onUndo} disabled={!historyCanUndo()}>↶ Annulla</button>
          <button className="btn ghost" onClick={onRedo} disabled={!historyCanRedo()}>↷ Ripeti</button>
          <div className="divider" />
          <button className="btn ghost" onClick={onExportCSV}>📤 Esporta CSV</button>
          <button className="btn ghost" onClick={onExportJSON}>💾 Esporta JSON</button>
        </div>
      </div>

      {kpis.length ? (
        <div className="kpi-bar">
          {kpis.map((k, i) => (
            <div key={i} className={`kpi ${k.tone || ""}`}>
              <span className="kpi__label">{k.label}</span>
              <span className="kpi__value">{k.val}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
