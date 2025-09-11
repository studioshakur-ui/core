import React from "react";
import {
  getBaseTasks, getCustomTasks, approveToBase, deleteTask,
  updateTask, searchTasks, setLocked, isLocked
} from "@/shared/taskCatalog.js";

export default function Catalog() {
  const [query, setQuery] = React.useState("");
  const [locked, setLockState] = React.useState(isLocked());
  const [view, setView] = React.useState("all"); // all | base | custom
  const [rows, setRows] = React.useState(searchTasks(""));

  const reload = React.useCallback(() => {
    if (view === "base") setRows(getBaseTasks());
    else if (view === "custom") setRows(getCustomTasks());
    else setRows(searchTasks(query));
  }, [query, view]);

  React.useEffect(() => { reload(); }, [reload]);

  const onToggleLock = () => {
    const next = !locked;
    setLocked(next);
    setLockState(next);
  };

  const onApprove = (code) => {
    if (approveToBase(code)) reload();
  };
  const onDelete = (code, scope) => {
    if (!confirm("Eliminare questa attività?")) return;
    deleteTask(code, scope);
    reload();
  };
  const onEdit = (t, scope) => {
    const title = prompt("Titolo", t.title) ?? t.title;
    const prodotto = prompt("Prodotto", t.prodotto ?? "") ?? t.prodotto;
    const um = prompt("UM (mt/pz/cx)", t.um ?? "") ?? t.um;
    const previsto = prompt("Previsto", t.previsto ?? "") ?? t.previsto;
    const note = prompt("Nota", t.note ?? "") ?? t.note;
    updateTask({ ...t, title, prodotto, um, previsto, note }, scope);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="text-xs uppercase tracking-wide muted">Manager</div>
      <h2 className="text-2xl font-extrabold">Catalogo attività — Amministrazione</h2>

      {/* barre d'actions */}
      <div className="card p-5 grid gap-3 sm:grid-cols-4">
        <div className="grid gap-2">
          <label className="text-sm">Cerca</label>
          <input className="input" placeholder="Titolo o codice…" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Vista</label>
          <select className="input" value={view} onChange={(e)=>setView(e.target.value)}>
            <option value="all">Tutte</option>
            <option value="base">Solo Base</option>
            <option value="custom">Proposte (Custom)</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Blocco catalogo</label>
          <button className="btn" onClick={onToggleLock}>{locked ? "🔒 Bloccato" : "🔓 Sbloccato"}</button>
          <div className="text-xs opacity-70">Se bloccato, i Capo non possono aggiungere nuove attività locali.</div>
        </div>
      </div>

      {/* tableau */}
      <div className="card p-5">
        <div className="text-sm font-semibold mb-3">Attività ({rows.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-300">
              <tr>
                <th className="py-2">Codice</th>
                <th className="py-2">Titolo</th>
                <th className="py-2">Prodotto</th>
                <th className="py-2">UM</th>
                <th className="py-2">Previsto</th>
                <th className="py-2">Note</th>
                <th className="py-2 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const inBase = getBaseTasks().some(x => x.code === t.code);
                const scope = inBase ? "base" : "custom";
                return (
                  <tr key={t.code} className="border-t border-black/5 dark:border-white/10">
                    <td className="py-2 pr-3 font-mono">{t.code}</td>
                    <td className="py-2 pr-3">{t.title}</td>
                    <td className="py-2 pr-3">{t.prodotto || "—"}</td>
                    <td className="py-2 pr-3">{t.um || "—"}</td>
                    <td className="py-2 pr-3">{t.previsto || "—"}</td>
                    <td className="py-2 pr-3">{t.note || "—"}</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {!inBase && (
                          <button className="btn text-xs" onClick={()=>onApprove(t.code)}>
                            ✅ Approva in base
                          </button>
                        )}
                        <button className="btn text-xs" onClick={()=>onEdit(t, scope)}>✏️ Modifica</button>
                        <button className="btn text-xs" onClick={()=>onDelete(t.code, scope)}>🗑️ Elimina</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td className="py-6 opacity-70" colSpan={7}>Nessun risultato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
