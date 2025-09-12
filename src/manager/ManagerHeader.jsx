// src/manager/ManagerHeader.jsx
import React from "react";
import { loadOrg, saveOrg, addMember, addTeam, moveMember } from "@/shared/orgStore.js";
import { historyCapture } from "@/shared/history.js";
import { importRoster } from "@/shared/importExcel.js";

export default function ManagerHeader() {
  const [org, setOrg] = React.useState(() => loadOrg() || { members: [], teams: [], unassigned: [], suspects: [] });
  React.useEffect(() => { const i = setInterval(() => setOrg(loadOrg() || {}), 500); return () => clearInterval(i); }, []);

  const members = org.members || [];
  const teams = org.teams || [];
  const unassigned = org.unassigned || [];

  const counters = {
    members: members.length,
    capiMissing: teams.filter(t => !t.capo).length,
  };

  async function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { capi, operai } = await importRoster(file);

    historyCapture();

    // Index existants (pour éviter doublons)
    const byName = new Map(members.map(m => [m.name.toLowerCase(), m.id]));

    // 1) Créer/assurer les capi → 1 team par capo (capo comme membre + capo= lui)
    for (const name of capi) {
      const key = name.toLowerCase();
      let id = byName.get(key);
      if (!id) {
        const m = addMember({ name });
        byName.set(key, m.id);
        id = m.id;
      }
      // Team déjà existante avec ce capo ?
      let team = teams.find(t => t.capo === id);
      if (!team) {
        const t = addTeam("capo");
        moveMember(id, t.id);
        const fresh = loadOrg();
        const idx = fresh.teams.findIndex(tt => tt.id === t.id);
        fresh.teams[idx].capo = id;
        saveOrg(fresh);
      }
    }

    // 2) Ajouter les operai → en Sorgente (non assignés)
    for (const name of operai) {
      const key = name.toLowerCase();
      if (!byName.has(key)) {
        const m = addMember({ name });
        byName.set(key, m.id);
        // addMember met déjà en unassigned via orgStore
      }
    }

    setOrg(loadOrg() || {});
    // Reset input pour pouvoir ré-importer le même fichier si besoin
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
          if (!confirm("Annullare tutte le modifiche recenti? (solo sessione)")) return;
          // simple rollback d’affichage (les vrai undo sont dans historyCapture)
          setOrg(loadOrg() || {});
        }}>↩ Annulla</button>

        <button className="btn ghost" onClick={()=>{
          // répéter dernière action : hors scope ici
          alert("Funzione 'Ripeti' non ancora disponibile in questa vista.");
        }}>⟳ Ripeti</button>

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
