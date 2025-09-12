import React from "react";
import { loadCatalog, saveCatalog } from "@/shared/catalogStore.js";

export default function Catalog() {
  const [catalog, setCatalog] = React.useState(() => loadCatalog() || []);
  const [newTask, setNewTask] = React.useState("");

  // Sauvegarde auto sur changement
  React.useEffect(() => {
    saveCatalog(catalog);
  }, [catalog]);

  function addTask() {
    if (!newTask.trim()) return;
    setCatalog([...catalog, { id: Date.now().toString(), name: newTask.trim() }]);
    setNewTask("");
  }

  function removeTask(id) {
    setCatalog(catalog.filter(t => t.id !== id));
  }

  return (
    <div className="container">
      <div className="title mb-3">Catalogo Attività</div>

      <div className="card mb-4 flex gap-2">
        <input
          className="input flex-1"
          type="text"
          placeholder="Nuova attività…"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button className="btn" onClick={addTask}>Aggiungi</button>
      </div>

      <div className="card">
        {catalog.length === 0 ? (
          <div className="text-sm text-secondary">Nessuna attività nel catalogo…</div>
        ) : (
          <ul className="divide-y divide-border">
            {catalog.map(task => (
              <li key={task.id} className="flex items-center justify-between py-2">
                <div className="name">{task.name}</div>
                <button
                  className="btn bg-red-500 hover:bg-red-600"
                  onClick={() => removeTask(task.id)}
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
