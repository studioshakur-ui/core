import React from "react";
import { teamSizeNoCapo } from "@/shared/autoPlan.js";

export default function TeamHealthRing({ team, org, target = 8, onSuggest }) {
  const size = teamSizeNoCapo(team, org);
  const capoMissing = !team.capo;
  const overload = size > 15;
  const near = size >= target && size <= 12;

  // Pas d'auto-filtre : on ouvre un petit popover informatif
  const [open, setOpen] = React.useState(false);
  const radius = 16, stroke = 4, C = 2 * Math.PI * radius;

  function segColor() {
    if (capoMissing) return "#ffcc66";
    if (overload) return "#ff6a6a";
    if (near) return "#6bd28d";
    return "#9fb3ff";
  }

  const ratio = Math.min(1, size / target);
  const dash = `${C * ratio} ${C}`;

  return (
    <div className="ring-wrap">
      <svg width="40" height="40" onClick={() => setOpen(v => !v)} style={{cursor:"pointer"}}>
        <circle cx="20" cy="20" r={radius} stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} fill="none"/>
        <circle cx="20" cy="20" r={radius} stroke={segColor()} strokeWidth={stroke} fill="none"
          strokeDasharray={dash} strokeLinecap="round" transform="rotate(-90 20 20)"/>
        <text x="20" y="22" textAnchor="middle" fontSize="10" fill="#fff">{size}</text>
      </svg>

      {open && (
        <div className="popover" onMouseLeave={() => setOpen(false)}>
          <div className="text-xs text-secondary mb-1">Salute squadra</div>
          <div className="text-sm"><b>{size}</b> membri (senza capo)</div>
          {capoMissing && <div className="warn mt-1">Capo mancante</div>}
          {overload && <div className="warn mt-1">Squadra grande (&gt;15)</div>}
          <div className="mt-2 flex gap-2">
            <button className="btn ghost" onClick={() => setOpen(false)}>Chiudi</button>
            <button className="btn" onClick={() => { setOpen(false); onSuggest?.("unassigned"); }}>
              Suggerisci filtro: Non assegnati
            </button>
          </div>
          <div className="tip">* Nessun filtro applicato automaticamente.</div>
        </div>
      )}
    </div>
  );
}
