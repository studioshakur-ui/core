import React from "react";
export default function KpiCard({ label, value, delta, icon }) {
  const positive = typeof delta === "number" ? delta >= 0 : String(delta || "").startsWith("+");
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-5 shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</div>
        <div className="text-xl">{icon || "📊"}</div>
      </div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      {delta != null && (
        <div
          className={[
            "mt-1 text-sm font-medium inline-flex items-center gap-1",
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          ].join(" ")}
        >
          <span>{positive ? "▲" : "▼"}</span>
          <span>{typeof delta === "number" ? `${delta > 0 ? "+" : ""}${delta}%` : String(delta)}</span>
        </div>
      )}
    </div>
  );
}
