import React from "react";
import DiffPreview from "@/manager/DiffPreview.jsx";
import { planAutoDistribute, planBalance, applyDiff, takeOrg } from "@/shared/autoPlan.js";

export default function RecipesMenu() {
  const [open, setOpen] = React.useState(false);
  const [preview, setPreview] = React.useState({ open: false, title: "", diff: [] });

  function openPreview(kind) {
    const org = takeOrg();
    let title = "", diff = [];
    if (kind === "auto") { title = "Auto-ripartizione (≈8 per capo)"; diff = planAutoDistribute(org, 8); }
    if (kind === "balance") { title = "Equilibrio tra squadre"; diff = planBalance(org, 8); }
    setPreview({ open: true, title, diff });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button className="btn ghost" onClick={() => setOpen(v => !v)}>⋯ Ricette</button>
      {open && (
        <div className="menu">
          <button className="menu-item" onClick={() => openPreview("auto")}>Auto-ripartire ≈8</button>
          <button className="menu-item" onClick={() => openPreview("balance")}>Equilibra squadre</button>
        </div>
      )}

      <DiffPreview
        open={preview.open}
        title={preview.title}
        diff={preview.diff}
        onClose={() => setPreview({ open: false, title: "", diff: [] })}
        onApply={() => { applyDiff(preview.diff); setPreview({ open: false, title: "", diff: [] }); }}
      />
    </div>
  );
}
