import React from "react";
import { loadOrg } from "@/shared/orgStore.js";

function Stat({ label, value, hint, warn }) {
  return (
    <div className={`card ${warn ? "ring-1 ring-amber-400" : ""}`}>
      <div className="text-xs text-secondary">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-secondary mt-1">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [org, setOrg] = React.useState(() => loadOrg() || {members:[],teams:[],unassigned:[]});

  React.useEffect(() => {
    const i = setInterval(() => setOrg(loadOrg() || {members:[],teams:[],unassigned:[]}), 2000);
    return () => clearInterval(i);
  }, []);

  const members = org.members || [];
  const teams   = org.teams || [];
  const unassigned = org.unassigned || [];

  const byId = new Map(members.map(m => [m.id, m]));
  const enriched = teams.map(t => {
    const capo = byId.get(t.capo);
    const size = (t.members||[]).filter(id => id !== t.capo).length;
    return {
      id: t.id,
      capoName: capo?.name || null,
      size,
    };
  });

  const teamsCount = teams.length;
  const capiMissing = enriched.filter(t => !t.capoName).length;
  const membersCount = members.length;
  const unassignedCount = unassigned.length;
  const avgSize = teamsCount ? Math.round((enriched.reduce((s,t)=>s+t.size,0)/teamsCount) * 10) / 10 : 0;
  const maxTeam = enriched.reduce((max, t) => t.size > (max?.size||0) ? t : max, null);

  return (
    <div className="container">
      <div className="title mb-3">Dashboard</div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        <Stat label="Équipes" value={teamsCount} />
        <Stat label="Capi manquants" value={capiMissing} warn={capiMissing>0} />
        <Stat label="Membri totali" value={membersCount} />
        <Stat label="Non assegnati" value={unassignedCount} warn={unassignedCount>0} />
        <Stat label="Taille moyenne" value={avgSize} hint="par équipe (hors capo)" />
        <Stat label="Plus grande équipe" value={maxTeam ? `${maxTeam.size}` : "—"} hint={maxTeam?.capoName || "—"} />
      </div>

      <div className="card mt-4">
        <div className="text-sm text-secondary mb-2">Capi & effectifs</div>
        <div className="grid gap-2">
          {enriched
            .sort((a,b) => (a.capoName||"ΩΩ").localeCompare(b.capoName||"ΩΩ","it"))
            .map(t => (
              <div key={t.id} className="member">
                <div className="min-w-0 flex-1">
                  <div className={`name ${!t.capoName ? "text-amber-400" : ""}`}>
                    {t.capoName ? `Capo · ${t.capoName}` : "Capo mancante"}
                  </div>
                  <div className="meta">ID: {t.id}</div>
                </div>
                <div className={`badge ${t.size>10 ? "bg-amber-200 text-amber-900" : ""}`}>
                  {t.size} membri
                </div>
              </div>
            ))}
          {enriched.length === 0 && (
            <div className="text-sm text-secondary">Nessuna squadra… importa un file in Manager.</div>
          )}
        </div>
      </div>
    </div>
  );
}
