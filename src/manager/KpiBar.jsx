import React from "react";
import { historyCanUndo, historyCanRedo } from "@/shared/history.js";

function median(arr) {
  const a = [...arr].sort((x, y) => x - y);
  if (!a.length) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

export default function KpiBar({
  org,
  busy,
  onImportClick,
  onUndo,
  onRedo,
  onExportCSV,
  onExportJSON,
  extraRight,
}) {
  const total = org.members?.length || 0;
  const unassigned = org.unassigned?.length || 0;
  const teams = org.teams || [];
  const capi = teams.length;

  // Taille par capo = membres SANS le capo (capo peut avoir 0 membre)
  const sizes = teams.map(t => (t.members || []).filter(id => id !== t.capo).length);
  const minSize = sizes.length ? Math.min(...sizes) : 0;
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const medSize = median(sizes);

  const missingCapo = teams.filter(t => !t.capo).length;

  const dupMap = new Map();
  (org.members || []).forEach(m => {
    const k = (m.name || "").trim().toLowerCase();
    dupMap.set(k, (dupMap.get(k) || 0) + 1);
  });
  const dupCount = Array.from(dupMap.values()).filter(n => n > 1).length;

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-end gap-3 md:justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-extrabold">Organigramma</h2>
          <div className="flex flex-wrap gap-2 mt-2 text-sm">
            <span className="px-2 py-1 rounded-lg border bg-white/50">Membri: <b>{total}</b></span>
            <span className="px-2 py-1 rounded-lg border bg-white/50">In sorgente: <b>{unassigned}</b></span>
            <span className="px-2 py-1 rounded-lg border bg-white/50">Capi: <b>{capi}</b></span>
            <span className={`px-2 py-1 rounded-lg border ${missingCapo ? "bg-amber-100 border-amber-300" : "bg-white/50"}`}>
              Capi mancanti: <b>{missingCapo}</b>
            </span>
            <span className="px-2 py-1 rounded-lg border bg-white/50">Mediana membri/capo: <b>{medSize}</b></span>
            <span className="px-2 py-1 rounded-lg border bg-white/50">Min–Max: <b>{minSize}–{maxSize}</b></span>
            <span className={`px-2 py-1 rounded-lg border ${dupCount ? "bg-rose-100 border-rose-300" : "bg-white/50"}`}>
              Duplicati: <b>{dupCount}</b>
            </span>
            <span className="px-2 py-1 rounded-lg border bg-white/50">Stato: <b>Bozza</b></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn">
            📥 Importa nomi
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onImportClick} disabled={busy} />
          </label>
          <button className="btn" onClick={onUndo} disabled={!historyCanUndo()}>↶ Annulla</button>
          <button className="btn" onClick={onRedo} disabled={!historyCanRedo()}>↷ Ripeti</button>
          <button className="btn" onClick={onExportCSV}>📤 Esporta CSV</button>
          <button className="btn" onClick={onExportJSON} title="Salva come JSON">💾 Esporta JSON</button>
          {extraRight}
          {busy ? <span className="text-sm opacity-70">Import in corso…</span> : null}
        </div>
      </div>
    </div>
  );
}
