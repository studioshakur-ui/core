// Branche l'import "groupes par lignes vertes" : crée 1 colonne par capo,
// y affecte ses membres, et met les autres lignes en Sorgente.

import React from "react";
import { loadOrg, saveOrg, addMember, addTeam, moveMember } from "@/shared/orgStore.js";
import { historyCapture } from "@/shared/history.js";
import { importRoster } from "@/shared/importExcel.js";

export default function ManagerHeader() {
  const [org, setOrg] = React.useState(() => loadOrg() || { members: [], teams: [], unassigned: [], suspects: [] });
  React.useEffect(() => { const i = setInterval(() => setOrg(loadOrg() || {}), 500); return () => clearInterval(i); }, []);

  const members = org.members || [];
  const teams   = org.teams || [];

  const counters = {
    members: members.length,
    capiMissing: teams.filter(t => !t.capo).length,
  };

  function getOrCreateMember(name, byName) {
    const key = name.toLowerCase();
    let id = byName.get(key);
    if (!id) {
      const m = addMember({ name });
      id = m.id;
      byName.set(key, id);
    }
    return id;
  }

  function ensureTeamForCapo(capoId) {
    let t = (loadOrg().teams || []).find(tt => tt.capo === capoId);
    if (t) return t.id;
    const created = addTeam("capo");
    moveMember(capoId, created.id);
    // set capo
    const fresh = loadOrg();
    const idx = (fresh.teams || []).findIndex(x => x.id === created.id);
    fresh.teams[idx].capo = capoId;
    saveOrg(fresh);
    return created.id;
  }

  async function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await importRoster(file);
    historyCapture();

    const byName = new Map((loadOrg().members || []).map(m => [m.name.toLowerCase(), m.id]));

    if (data.mode === "blocks" && data.groups?.length) {
      // --- Mode groupé par lignes vertes ---
      for (const g of data.groups) {
        const capoId = getOrCreateMember(g.capo, byName);
        const teamId = ensureTeamForCapo(capoId);
        for (const n of g.members || []) {
          const mid = getOrCreateMember(n, byName);
          moveMember(mid, teamId);
        }
      }
      // Singles -> restent en Sorgente (créés si besoin)
      for (const n of data.singles || []) {
        getOrCreateMember(n, byName);
        // addMember les place déjà en unassigned via orgStore
      }
    } else {
      // --- Mode flat (CSV / pas de styles) ---
      for (const name of data.capi || []) {
        const capoId = getOrCreateMember(name, byName);
        ensureTeamForCapo(capoId);
      }
      for (const name of data.operai || []) {
        getOrCreateMember(name, byName); // reste en Sorgente
      }
    }

    setOrg(loadOrg() || {});
    e.target.value = "";
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="mr-4">
          <div className="title">Organigramma</div>
          <div className="text-xs text-secondary mt-1">
            <span className="subchip">Membri <b>{counters.members}</b></span>
            <span className="subchip">Capi mancanti <b>{counters.capiMissing}</b></span>
          </div>
        </div>

        <label className="btn">
          📥 Importa file
          <input type="file" accept=".xlsx,.xlsm,.xlsb,.csv" hidden onChange={onImportFile} />
        </label>

        <button className="btn ghost" onClick={()=>{
          if (!confirm("Annullare eventuali modifiche non salvate (solo vista)?")) return;
          setOrg(loadOrg() || {});
        }}>↩ Annulla</button>

        <button className="btn" onClick={()=>{
          const o = loadOrg() || {};
          const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(o, null, 2));
          const a = document.createElement("a");
          a.href = data; a.download = "organigramma.json"; a.click();
        }}>📦 Esporta JSON</button>
      </div>
    </div>
  );
}
