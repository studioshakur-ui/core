import React from "react";
import { Link } from "react-router-dom";

/** Helpers localStorage sûrs */
function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * Affiche l’état de synchronisation :
 * - Dernier rapport Capo (date, capo, nb opérateurs/activités)
 * - Programme Manager (semaine, nb tâches)
 */
export default function SyncStatus() {
  // Rapport CAPO (dernier élément du tableau)
  const reports = load("core_daily_reports", []);
  const last = reports.length ? reports[reports.length - 1] : null;

  // Programme MANAGER
  const plan = load("core_week_plan", null);
  const week = load("core_week_number", null);
  const planTasks =
    plan?.days?.reduce((acc, d) => acc + (Array.isArray(d.tasks) ? d.tasks.length : 0), 0) ?? 0;

  const okCapo = Boolean(last);
  const okManager = Boolean(plan && plan.days && plan.days.length);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Stato sincronizzazione</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-400/20">
            ● Realtime (locale)
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        {/* CAPO */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-white/5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold">Rapporto giornaliero (Capo)</div>
            <span
              className={
                "text-xs px-2 py-0.5 rounded-lg border " +
                (okCapo
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-400/20"
                  : "bg-rose-500/15 text-rose-400 border-rose-400/20")
              }
            >
              {okCapo ? "Ricevuto" : "Mancante"}
            </span>
          </div>

          {okCapo ? (
            <div className="text-sm opacity-90">
              <div>
                <b>{formatDate(last.date)}</b> — Capo <b>{last.capo}</b>
              </div>
              <div className="mt-1">
                Squadra: <b>{last.team?.length ?? 0}</b> op — Attività:{" "}
                <b>{last.activities?.length ?? 0}</b>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-80">Nessun rapporto trovato.</div>
          )}

          <div className="mt-3">
            <Link to="/capo" className="btn text-xs">✏️ Apri modulo Capo</Link>
          </div>
        </div>

        {/* MANAGER */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-white/5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold">Programma settimanale (Manager)</div>
            <span
              className={
                "text-xs px-2 py-0.5 rounded-lg border " +
                (okManager
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-400/20"
                  : "bg-rose-500/15 text-rose-400 border-rose-400/20")
              }
            >
              {okManager ? "Caricato" : "Mancante"}
            </span>
          </div>

          {okManager ? (
            <div className="text-sm opacity-90">
              <div>
                Settimana ISO: <b>{week ?? plan.week}</b>
              </div>
              <div className="mt-1">
                Attività pianificate: <b>{planTasks}</b>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-80">Nessun programma salvato.</div>
          )}

          <div className="mt-3">
            <Link to="/manager" className="btn text-xs">🗂️ Apri planner Manager</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
