import React from "react";
import { takeOrg } from "@/shared/autoPlan.js";

function useMaps(org) {
  const o = takeOrg(org);
  const memberById = new Map((o.members || []).map(m => [m.id, m]));
  const teamById = new Map((o.teams || []).map(t => [t.id, t]));
  return { memberById, teamById };
}

export default function DiffPreview({ open, onClose, title, diff, onApply }) {
  const { memberById, teamById } = useMaps();

  if (!open) return null;

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <div className="title">{title || "Anteprima modifiche"}</div>
          <button className="btn icon" onClick={onClose}>✖</button>
        </div>

        <div className="modal-body">
          {!diff?.length ? (
            <div className="text-sm text-secondary">Nessuna modifica proposta.</div>
          ) : (
            <ul className="list gap-2">
              {diff.map((s, i) => {
                const m = memberById.get(s.memberId);
                const to = teamById.get(s.toTeamId || "");
                return (
                  <li key={i} className="row-assign">
                    <div className="row-title">{m?.name || s.memberId}</div>
                    <div className="row-meta">
                      {s.toTeamId ? <>→ Capo · {to?.capo ? (memberById.get(to.capo)?.name || "mancante") : "mancante"}</> : "→ Sorgente"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Annulla</button>
          <button className="btn primary" disabled={!diff?.length} onClick={onApply}>Applica</button>
        </div>
      </div>
    </>
  );
}
