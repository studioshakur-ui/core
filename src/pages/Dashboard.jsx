import React from "react";
import KpiCard from "@/shared/KpiCard.jsx";
import ProgressBar from "@/shared/ProgressBar.jsx";
import Radial from "@/shared/Radial.jsx";
import Sparkline from "@/shared/Sparkline.jsx";
import SyncStatus from "@/shared/SyncStatus.jsx";

const MOCK = {
  kpi: [
    { label: "Produttività", value: "92%", delta: +4, icon: "⚡" },
    { label: "Ore oggi", value: "312", delta: +3, icon: "⏱️" },
    { label: "Task completati", value: "148", delta: +6, icon: "✅" },
    { label: "Blocchi critici", value: "3", delta: -25, icon: "🚨" },
  ],
  workload: [
    { area: "Ponte 5", pct: 78 },
    { area: "Ponte 6", pct: 55 },
    { area: "Sala Macchine", pct: 64 },
    { area: "Cabine A", pct: 41 },
  ],
  activity: [
    { t: "12:30", msg: "Capo M. — Collegati 12 cavi SFP (ponte 7)" },
    { t: "11:10", msg: "Manager — Importata lista 34 operai" },
    { t: "09:05", msg: "Capo G. — Richiesto materiale RJ45 (x40)" },
  ],
  inca: [
    { id: "INCA123", zona: "Ponte 5", pct: 78, capo: "Capo M." },
    { id: "INCA456", zona: "Sala Macchine", pct: 64, capo: "Capo G." },
    { id: "INCA789", zona: "Cabine A", pct: 41, capo: "Capo L." },
  ],
  heatmap: [
    { ponte: "Ponte 5", pct: 78 },
    { ponte: "Ponte 6", pct: 55 },
    { ponte: "Sala Mac.", pct: 64 },
    { ponte: "Cabine A", pct: 41 },
    { ponte: "Ponte 7", pct: 90 },
  ],
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* 🔗 Synchro Capo/Manager */}
      <SyncStatus />

      {/* 🚨 Bandeau alertes */}
      <div className="rounded-xl bg-red-600/90 text-white px-4 py-3 text-sm font-semibold">
        🚨 {MOCK.kpi[3].value} blocchi critici! Zone: Sala Macchine, Ponte 5, Cabine A
      </div>

      {/* KPI */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK.kpi.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Carico + squadre */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Carico per area</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">Ultime 24h</div>
          </div>
          <div className="space-y-4">
            {MOCK.workload.map((w) => (
              <div key={w.area} className="grid grid-cols-5 items-center gap-3">
                <div className="col-span-2 sm:col-span-1 text-sm">{w.area}</div>
                <div className="col-span-3 sm:col-span-4 flex items-center gap-3">
                  <ProgressBar value={w.pct} />
                  <div className="w-12 text-right text-sm font-semibold">{w.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm font-semibold mb-4">Utilizzo squadre</div>
          <div className="grid grid-cols-3 gap-3 place-items-center">
            <Radial value={92} label="Alpha" />
            <Radial value={76} label="Beta" />
            <Radial value={61} label="Gamma" />
          </div>
        </div>
      </div>

      {/* INCA */}
      <div className="card p-5">
        <div className="text-sm font-semibold mb-3">Avanzamento per INCA</div>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 dark:text-slate-300">
            <tr>
              <th className="py-2">INCA</th>
              <th className="py-2">Zona</th>
              <th className="py-2">% Avanzamento</th>
              <th className="py-2">Capo</th>
            </tr>
          </thead>
          <tbody>
            {MOCK.inca.map((i) => (
              <tr key={i.id} className="border-t border-black/5 dark:border-white/10">
                <td className="py-2">{i.id}</td>
                <td className="py-2">{i.zona}</td>
                <td className="py-2 font-semibold">{i.pct}%</td>
                <td className="py-2">{i.capo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Heatmap */}
      <div className="card p-5">
        <div className="text-sm font-semibold mb-3">Heatmap dei ponti</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MOCK.heatmap.map((h) => {
            let color =
              h.pct >= 80
                ? "bg-emerald-500"
                : h.pct >= 50
                ? "bg-yellow-400"
                : "bg-red-500";
            return (
              <div
                key={h.ponte}
                className={`h-20 rounded-xl flex items-center justify-center text-white font-bold ${color}`}
              >
                {h.ponte} ({h.pct}%)
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend + Logs */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <div className="card p-5">
          <div className="text-sm font-semibold mb-3">Trend produttività</div>
          <Sparkline />
        </div>
        <div className="card p-5">
          <div className="text-sm font-semibold mb-3">Attività recenti</div>
          <ul className="space-y-2">
            {MOCK.activity.map((a, i) => (
              <li
                key={i}
                className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5"
              >
                <div className="col-span-2 sm:col-span-1 font-semibold">{a.t}</div>
                <div className="col-span-10 sm:col-span-11">{a.msg}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
