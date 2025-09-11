import React from "react";
import ManagerHeader from "@/manager/ManagerHeader.jsx";
import SourcePanel from "@/manager/SourcePanel.jsx";
import TeamBoard from "@/manager/TeamBoard.jsx";

import {
  loadOrg, saveOrg,
  ensureMember, ensureTeamByCapoName, moveMember,
  addCapo,
} from "@/shared/orgStore.js";
import {
  historyCapture, historyUndo, historyRedo,
  historyCanUndo, historyCanRedo
} from "@/shared/history.js";

/* utils parse */
const norm = (s) => String(s ?? "").trim();
const toTitle = (name) =>
  norm(name).toLowerCase().replace(/\b([a-zà-ÿ])/g, (m) => m.toUpperCase());

const HEADERS = {
  capo: [/^capo\b/i, /chef/i, /responsab/i, /leader/i],
  member: [/^memb/i, /operaio/i, /dipenden/i, /operatore/i, /member/i, /worker/i, /persona/i, /nome/i],
  role: [/^ruolo/i, /role/i],
};
function detectColumn(headers) {
  const res = { capo: -1, member: -1, role: -1 };
  headers.forEach((h, i) => {
    const v = norm(h);
    if (!v) return;
    if (res.capo < 0 && HEADERS.capo.some(rx => rx.test(v))) res.capo = i;
    if (res.member < 0 && HEADERS.member.some(rx => rx.test(v))) res.member = i;
    if (res.role < 0 && HEADERS.role.some(rx => rx.test(v))) res.role = i;
  });
  return res;
}
async function parseAny(file) {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sh = wb.Sheets[wb.SheetNames[0]];
    const r = XLSX.utils.decode_range(sh["!ref"]);
    const grid = [];
    for (let i = r.s.r; i <= r.e.r; i++) {
      const row = [];
      for (let j = r.s.c; j <= r.e.c; j++) {
        const cell = sh[XLSX.utils.encode_cell({ r: i, c: j })];
        row.push(cell ? (cell.w ?? cell.v ?? "") : "");
      }
      grid.push(row);
    }
    return grid;
  } else {
    const text = await file.text();
    const sep = text.includes(";") ? ";" : ",";
    return text.split(/\r?\n/).map(l => l.split(sep).map(c => norm(c.replace(/^"|"$/g, ""))));
  }
}
function smartAnalyze(grid) {
  if (!grid.length) return { rows: [], singles: [] };
  let headerRow = 0;
  let map = detectColumn(grid[0] || []);
  for (let i = 1; i < Math.min(3, grid.length); i++) {
    const test = detectColumn(grid[i] || []);
    const score = Object.values(test).filter(x => x >= 0).length;
    if (score > Object.values(map).filter(x => x >= 0).length) {
      map = test; headerRow = i;
    }
  }
  const rows = grid.slice(headerRow + 1);
  const out = [];
  for (const row of rows) {
    const capo = map.capo >= 0 ? norm(row[map.capo]) : "";
    const member = map.member >= 0 ? norm(row[map.member]) : "";
    const role = map.role >= 0 ? norm(row[map.role]) : "";
    if (!capo && !member) continue;
    out.push({
      capo: capo ? toTitle(capo) : "",
      member: member ? toTitle(member) : "",
      role: role || "",
    });
  }
  if (!out.length) {
    const names = new Set();
    grid.forEach(r => r.forEach(c => { const v = norm(c); if (v) names.add(toTitle(v)); }));
    return { rows: [], singles: Array.from(names) };
  }
  return { rows: out, singles: [] };
}

/* page */
export default function Manager(){
  const [org, setOrg] = React.useState(loadOrg());
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [selected, setSelected] = React.useState(new Set());

  React.useEffect(()=>{
    const t = setInterval(()=> setOrg(loadOrg()), 400);
    return ()=> clearInterval(t);
  },[]);

  async function handleImportChange(e){
    const file = e.target.files?.[0];
    if(!file) return;
    setBusy(true); setMsg("");
    try{
      const grid = await parseAny(file);
      const { rows, singles } = smartAnalyze(grid);

      historyCapture();

      if (rows && rows.length) {
        const created = { capi: 0, membri: 0, assegnati: 0 };
        const seenCapo = new Set();
        for (const r of rows) {
          if (r.capo) {
            const { team, capo } = ensureTeamByCapoName(r.capo);
            if (!seenCapo.has(capo.id)) { created.capi++; seenCapo.add(capo.id); }
            if (r.member) {
              const m = ensureMember(r.member, r.role || "Altro");
              moveMember(m.id, team.id);
              created.membri++;
              created.assegnati++;
            }
          } else if (r.member) {
            ensureMember(r.member, r.role || "Altro");
            created.membri++;
          }
        }
        setMsg(`Import ok. Capi nuovi: ${created.capi} · Membri: ${created.membri} · Assegnati: ${created.assegnati}`);
      } else if (singles && singles.length) {
        let c = 0;
        singles.forEach(n => { ensureMember(n); c++; });
        setMsg(`Import ok. Aggiunti ${c} nomi in Sorgente.`);
      } else {
        setMsg("Nessun dato utile trovato.");
      }
    }catch(err){
      console.error(err);
      setMsg(String(err?.message || err));
    }finally{
      setBusy(false);
      e.target.value = "";
    }
  }

  function handleClearAll(){
    if (!confirm("Svuotare completamente l'organigramma?")) return;
    historyCapture();
    saveOrg({ members: [], teams: [], unassigned: [], suspects: [] });
    setMsg("Organigramma svuotato.");
    setOrg(loadOrg());
    setSelected(new Set());
  }

  return (
    <div className="space-y-4">
      <ManagerHeader
        org={org}
        busy={busy}
        onImportChange={handleImportChange}
        onUndo={()=> historyCanUndo() && historyUndo()}
        onRedo={()=> historyCanRedo() && historyRedo()}
        onExportCSV={()=> {
          const o = loadOrg();
          const rows = [["Capo","Membro","Ruolo"]];
          const byId = new Map((o.members||[]).map(m=>[m.id,m]));
          (o.teams||[]).forEach(t=>{
            const capo = byId.get(t.capo);
            const capoName = capo ? capo.name : "";
            (t.members||[]).forEach(id=>{
              const m = byId.get(id); if (!m) return;
              rows.push([capoName, m.name, m.role || "Altro"]);
            });
          });
          const csv = rows.map(r=>r.map(x=>`"${String(x??"").replace(/"/g,'""')}"`).join(";")).join("\n");
          const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "organigramma.csv"; a.click(); URL.revokeObjectURL(a.href);
        }}
        onExportJSON={()=> {
          const blob = new Blob([JSON.stringify(loadOrg(),null,2)], {type:"application/json"});
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "organigramma.json"; a.click(); URL.revokeObjectURL(a.href);
        }}
      />

      <div className="card flex items-center gap-2">
        <button className="btn" onClick={()=>{
          const name = prompt("Nuovo Capo (nome)?");
          if (!name) return;
          historyCapture();
          addCapo(name);
          setMsg(`Capo "${name}" creato.`);
        }}>+ Aggiungi Capo</button>

        <button className="btn" onClick={handleClearAll}>Svuota tutto</button>

        <div className="text-sm text-secondary ml-auto">
          Suggerimento: per eliminare un Capo o un Operaio, usa le icone nella colonna.
        </div>
      </div>

      {msg ? <div className="card text-sm">{msg}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-[38%_1fr] gap-4">
        <SourcePanel
          selected={selected}
          setSelected={setSelected}
          onMoved={()=> setOrg(loadOrg())}
        />
        <TeamBoard
          selected={selected}
          setSelected={setSelected}
        />
      </div>
    </div>
  );
}
