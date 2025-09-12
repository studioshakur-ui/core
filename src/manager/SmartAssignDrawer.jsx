import React from "react";
import { rankTeams } from "@/shared/assist.js";

export default function SmartAssignDrawer({ open, onClose, org, onAssign }) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => { if (open) setQ(""); }, [open]);

  if (!open) return null;
  const ranked = rankTeams(org).filter(t =>
    (t.capoName || "Capo mancante").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div className="title">Assegnazione rapida</div>
          <button className="btn icon" onClick={onClose} title="Chiudi">✖</button>
        </div>

        <input
          autoFocus
          className="input w-full mb-3"
          placeholder="Cerca capo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="grid gap-2" style={{maxHeight: "65vh", overflowY: "auto"}}>
          {ranked.map(t => (
            <button key={t.id} className="row-assign" onClick={() => onAssign(t.id)}>
              <div className="row-title">Capo · {t.capoName || "mancante"}</div>
              <div className="row-meta">
                <span className="subchip">{t.sizeNoCapo} membri</span>
              </div>
            </button>
          ))}
          {!ranked.length && (
            <div className="text-sm text-secondary">Nessun capo trovato.</div>
          )}
        </div>
      </aside>
    </>
  );
}
