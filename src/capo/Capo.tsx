import React from "react";
import { useSession } from "@/shared/session.jsx";
import { loadOrg } from "@/shared/orgStore.js";

// Utilitaires
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function lsKey(teamId, dateKey) {
  return `capoReport:${teamId}:${dateKey}`;
}
function sanitizeReport(members) {
  const map = {};
  (members||[]).forEach(m => { map[m.id] = { hours: "", note: "" }; });
  return map;
}

export default function Capo() {
  const { user, role, loading } = useSession();
  const [org, setOrg] = React.useState(() => loadOrg() || {members:[],teams:[],unassigned:[]});
  const [teamId, setTeamId] = React.useState(null);
  const [dateKey, setDateKey] = React.useState(todayKey());
  const [report, setReport] = React.useState({}); // {memberId: {hours,note}}

  // rafraîchit org toutes les 2s (localStorage)
  React.useEffect(() => {
    const i = setInterval(() => setOrg(loadOrg() || {members:[],teams:[],unassigned:[]}), 2000);
    return () => clearInterval(i);
  }, []);

  const teams = org.teams || [];
  const members = org.members || [];

  // essaie de trouver l'équipe du capo automatiquement (par email ~ nom)
  React.useEffect(() => {
    if (!user || !members.length || !teams.length) return;
    // 1) match par email exact dans un champ user_metadata.name? (si inexistant, fallback)
    // 2) fallback : on prend la première équipe dont le capo a un email identique à user.email
    const byId = new Map(members.map(m => [m.id, m]));
    let found = null;
    for (const t of teams) {
      const capo = byId.get(t.capo);
      if (!capo) continue;
      const guessEmail = (capo.email || "").toLowerCase();
      if (guessEmail && user.email && guessEmail === user.email.toLowerCase()) {
        found = t.id; break;
      }
      // heuristique douce: si le nom du capo est contenu dans l'email utilisateur
      if (user.email && capo.name) {
        const normName = capo.name.toLowerCase().replace(/\s+/g,".");
        if (user.email.toLowerCase().includes(normName)) {
          found = t.id; break;
        }
      }
    }
    if (!teamId && found) setTeamId(found);
  }, [user, members, teams, teamId]);

  // charge/sauvegarde auto du report pour (teamId, dateKey)
  React.useEffect(() => {
    if (!teamId || !dateKey) return;
    const key = lsKey(teamId, dateKey);
    const raw = localStorage.getItem(key);
    if (raw) {
      try { setReport(JSON.parse(raw)); } catch { setReport({}); }
    } else {
      // init vierge basé sur les membres de l’équipe
      const t = (teams||[]).find(x => x.id === teamId);
      const tMembers = (t?.members||[]).map(id => members.find(m => m.id===id)).filter(Boolean);
      setReport(sanitizeReport(tMembers));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, dateKey, org]); // si org change (ajout/suppression), on regénère

  React.useEffect(() => {
    if (!teamId || !dateKey) return;
    const key = lsKey(teamId, dateKey);
    localStorage.setItem(key, JSON.stringify(report || {}));
  }, [report, teamId, dateKey]);

  const byId = new Map((members||[]).map(m => [m.id, m]));
  const team = (teams||[]).find(t => t.id === teamId) || null;
  const capo = team ? byId.get(team.capo) : null;
  const teamMembers = team ? (team.members||[]).map(id => byId.get(id)).filter(Boolean) : [];

  async function exportPDF() {
    if (!team) { alert("Nessuna squadra selezionata."); return; }
    try {
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 40;
      let y = 52;

      // En-tête
      doc.setFontSize(16);
      doc.text("Rapporto Squadra", left, y); y += 20;
      doc.setFontSize(10);
      doc.text(`Data: ${dateKey}`, left, y);
      if (capo?.name) doc.text(`Capo: ${capo.name}`, left+200, y);
      y += 24;

      // Tableau
      const head = [["Operaio", "Ore", "Note"]];
      const body = teamMembers.map((m) => {
        const r = report?.[m.id] || {};
        return [m.name || "", r.hours || "", r.note || ""];
      });

      doc.autoTable({
        startY: y,
        head,
        body,
        styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
        headStyles: { fillColor: [20, 25, 35], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 220 },
          1: { cellWidth: 60, halign: "center" },
          2: { cellWidth: 240 }
        }
      });

      // Pied
      const endY = doc.lastAutoTable.finalY + 30;
      doc.setFontSize(9);
      doc.text("Firma Capo: _______________________", left, endY);
      doc.save(`rapporto_${dateKey}_${capo?.name || "capo"}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Errore nella generazione del PDF.");
    }
  }

  if (loading) return <div className="p-6 text-sm text-secondary">Verifica sessione…</div>;
  if (!user) return <div className="p-6">Non autenticato. Vai al <a className="text-blue-500 underline" href="/login">login</a>.</div>;
  if (role !== "capo" && role !== "manager") return <div className="p-6">Ruolo non autorizzato.</div>;

  return (
    <div className="container">
      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="title">Rapporto giornaliero</div>
          <div className="text-xs text-secondary">Utente: {user.email} · Ruolo: <b>{role}</b></div>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="date"
              className="input"
              value={dateKey}
              onChange={(e)=>setDateKey(e.target.value)}
            />
            <select
              className="input"
              value={teamId || ""}
              onChange={(e)=>setTeamId(e.target.value || null)}
              title="La mia squadra"
            >
              <option value="">— Seleziona squadra —</option>
              {(teams||[]).map(t => {
                const c = byId.get(t.capo);
                const name = c?.name ? `Capo · ${c.name}` : "Capo mancante";
                const count = (t.members||[]).filter(id => id !== t.capo).length;
                return <option key={t.id} value={t.id}>{name} · {count} membri</option>;
              })}
            </select>
            <button className="btn" onClick={exportPDF}>Esporta PDF</button>
          </div>
        </div>
      </div>

      {!team ? (
        <div className="card">
          <div className="text-sm text-secondary">
            Nessuna squadra associata a questo account. Seleziona la tua squadra dal menu in alto.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="mb-3">
            <div className="text-sm text-secondary">
              Capo: <b>{capo?.name || "—"}</b> · Membri: <b>{(team.members||[]).filter(id=>id!==team.capo).length}</b>
            </div>
          </div>

          <div className="grid gap-2">
            {teamMembers.map((m) => {
              const r = report?.[m.id] || { hours: "", note: "" };
              return (
                <div key={m.id} className="member">
                  <div className="min-w-0 flex-1">
                    <div className="name truncate-2">{m.name}</div>
                    <div className="meta">{m.role || "Operaio"}</div>
                  </div>
                  <input
                    className="input w-24"
                    type="number" min="0" max="24" step="0.5"
                    placeholder="Ore"
                    value={r.hours}
                    onChange={(e)=>{
                      const v = e.target.value;
                      setReport(prev => ({ ...prev, [m.id]: { ...(prev[m.id]||{}), hours: v } }));
                    }}
                  />
                  <input
                    className="input w-[320px] max-w-[50vw]"
                    type="text"
                    placeholder="Note (facoltative)"
                    value={r.note}
                    onChange={(e)=>{
                      const v = e.target.value;
                      setReport(prev => ({ ...prev, [m.id]: { ...(prev[m.id]||{}), note: v } }));
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
