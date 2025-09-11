import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAllTasks, searchTasks } from "@/shared/taskCatalog.js";
import { loadOrg } from "@/shared/orgStore.js";

/** Utilitaires */
const mm = (v) => (v * 72) / 25.4;
const fmtDate = (d) => {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("it-IT");
  } catch {
    return "";
  }
};

function getAuthUser() {
  try {
    const auth = JSON.parse(localStorage.getItem("core_auth_v1") || "{}");
    return auth?.user || null;
  } catch {
    return null;
  }
}

/** Récupère la liste des membres de l'équipe du Capo connecté */
function useCapoTeamMembers() {
  const [state, setState] = React.useState({ members: [], teamName: "" });

  React.useEffect(() => {
    const user = getAuthUser();
    const org = loadOrg();
    if (!user) return setState({ members: [], teamName: "" });

    const me = (org.members || []).find(
      (m) => (m.name || "").toLowerCase() === user.name.toLowerCase()
    );

    let team =
      me &&
      (org.teams || []).find(
        (t) => t.capo === me.id || (t.members || []).includes(me.id)
      );

    if (!team) return setState({ members: [], teamName: "" });

    const members = (team.members || [])
      .map((id) => (org.members || []).find((m) => m.id === id)?.name)
      .filter(Boolean);

    setState({ members, teamName: team.name || "" });
  }, []);

  return state; // { members: string[], teamName: string }
}

/** Ligne opérateur */
function OperatorRow({ i, j, op, options, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-5 gap-2 items-center">
      <div className="col-span-3">
        <select
          className="input w-full"
          value={op.name || ""}
          onChange={(e) => onChange(i, j, "name", e.target.value)}
        >
          <option value="">{/* vide */}— Seleziona operatore —</option>
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <input
        className="input"
        type="number"
        step="0.25"
        value={op.ore ?? ""}
        placeholder="Ore"
        onChange={(e) =>
          onChange(i, j, "ore", e.target.value === "" ? "" : Number(e.target.value))
        }
      />
      <button
        type="button"
        className="btn"
        onClick={() => onRemove(i, j)}
        title="Rimuovi operatore"
      >
        🗑️
      </button>
    </div>
  );
}

/** Activité avec opérateurs multiples */
function ActivityCard({ a, i, taskOptions, teamOptions, updAct, addOp, rmOp, updOp }) {
  const totalOre =
    Array.isArray(a.operators) && a.operators.length
      ? a.operators.reduce((s, r) => s + (parseFloat(r.ore) || 0), 0)
      : 0;

  return (
    <div className="card">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-sm opacity-70">Attività</label>
          {/* Sélecteur par code/titre via datalist */}
          <input
            className="input"
            list="__tasks__"
            value={a.descr}
            placeholder="Cerca attività (codice o titolo)…"
            onChange={(e) => {
              const v = e.target.value;
              updAct(i, "descr", v);
              // Essayer de trouver une tâche correspondante par code ou titre
              const byCode = searchTasks(v)?.find((t) => t.code === v);
              const all = taskOptions;
              const byTitle = all.find((t) => t.title === v);
              const t = byCode || byTitle;
              if (t) {
                updAct(i, "code", t.code || "");
                if (t.prodotto) updAct(i, "prodotto", t.prodotto);
                if (t.um) updAct(i, "um", t.um);
                if (t.previstoPerPersona !== "" && t.previstoPerPersona != null)
                  updAct(i, "previsto", t.previstoPerPersona);
              }
            }}
          />
          {/* datalist globale des tâches (codes + titres) */}
          <datalist id="__tasks__">
            {taskOptions.slice(0, 200).map((t) => (
              <option key={t.code} value={t.title}>
                {t.code}
              </option>
            ))}
          </datalist>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm opacity-70">Codice</label>
              <input
                className="input"
                value={a.code || ""}
                onChange={(e) => updAct(i, "code", e.target.value)}
                placeholder="es. STE-001"
              />
            </div>
            <div>
              <label className="text-sm opacity-70">Prodotto</label>
              <input
                className="input"
                value={a.prodotto || ""}
                onChange={(e) => updAct(i, "prodotto", e.target.value)}
                placeholder="es. mt / pz"
              />
            </div>
            <div>
              <label className="text-sm opacity-70">UM</label>
              <input
                className="input"
                value={a.um || ""}
                onChange={(e) => updAct(i, "um", e.target.value)}
                placeholder="es. mt / pz"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm opacity-70">Previsto (a persona)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={a.previsto ?? ""}
                onChange={(e) =>
                  updAct(i, "previsto", e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="es. 0.20 / 350"
              />
            </div>
            <div>
              <label className="text-sm opacity-70">Ponte/Zona</label>
              <input
                className="input"
                value={a.zona || ""}
                onChange={(e) => updAct(i, "zona", e.target.value)}
                placeholder="opzionale"
              />
            </div>
          </div>

          <label className="text-sm opacity-70">Note</label>
          <input
            className="input"
            value={a.note || ""}
            onChange={(e) => updAct(i, "note", e.target.value)}
            placeholder="Note…"
          />

          <div className="text-xs opacity-70 mt-1">
            Totale ore attività: <b>{totalOre.toFixed(2)}</b>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold">Operatori</h4>
          <button type="button" className="btn" onClick={() => addOp(i)}>
            + Aggiungi operatore
          </button>
        </div>

        <div className="grid gap-2">
          {(a.operators || [{ name: "", ore: "" }]).map((op, j) => (
            <OperatorRow
              key={j}
              i={i}
              j={j}
              op={op}
              options={teamOptions}
              onChange={updOp}
              onRemove={rmOp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Export PDF identique au papier */
function exportRapportinoPDF({ capo, date, activities }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" }); // 595x842 pt
  const margin = { top: mm(18), left: mm(18), right: mm(18), bottom: mm(18) };

  const title = 'RAPPORTINO GIORNALIERO "APPARATO MOTORE"';
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin.left, margin.top);

  // Ligne d'info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const topInfoY = margin.top + mm(8);
  doc.text(`Capo Squadra: ${capo || "-"}`, margin.left, topInfoY);
  doc.text(`Data: ${fmtDate(date)}`, mm(120), topInfoY);

  const head = [
    [
      "DESCRIZIONE ATTIVITA'",
      "OPERATORE",
      "TEMPO IMPIEGATO",
      "PRODOTTO",
      "PREVISTO",
      "NOTE",
    ],
  ];

  const body = (activities || []).flatMap((a) => {
    const ops =
      Array.isArray(a.operators) && a.operators.length
        ? a.operators
        : [{ name: "", ore: "" }];
    return ops
      .filter(
        (op) => (a?.descr || "").trim().length > 0 && (op.name || op.ore !== "")
      )
      .map((op) => [
        `${a.descr}${a.code ? ` [${a.code}]` : ""}`,
        op.name || "",
        op.ore || "",
        a.prodotto ? `${a.prodotto}${a.um ? ` ${a.um}` : ""}` : "",
        a.previsto ?? "",
        a.note || "",
      ]);
  });

  autoTable(doc, {
    startY: topInfoY + mm(6),
    margin,
    head,
    body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      lineColor: [200, 200, 200],
    },
    headStyles: { fillColor: [235, 235, 235], textColor: 20, halign: "left" },
    columnStyles: {
      0: { cellWidth: mm(90) },
      1: { cellWidth: mm(32) },
      2: { cellWidth: mm(35), halign: "right" },
      3: { cellWidth: mm(40) },
      4: { cellWidth: mm(28), halign: "right" },
      5: { cellWidth: "auto" },
    },
    didDrawPage: () => {
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.getWidth();
      const pageHeight = pageSize.getHeight();
      const y = pageHeight - mm(28);
      doc.setFontSize(10);
      doc.text("Firma Capo:", margin.left, y);
      doc.text("Visto Manager:", margin.left + mm(80), y);
      doc.setFontSize(9);
      const str = `Pagina ${doc.internal.getNumberOfPages()}`;
      const w = doc.getTextWidth(str);
      doc.text(str, pageWidth - margin.right - w, pageHeight - mm(12));
    },
    willDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        data.cell.styles.valign = "top";
      }
    },
    pageBreak: "auto",
  });

  doc.save(`Rapportino_${fmtDate(date)}_${capo || "Capo"}.pdf`);
}

export default function Capo() {
  const { members: teamMembers, teamName } = useCapoTeamMembers();
  const user = getAuthUser();
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [activities, setActivities] = React.useState(() => [
    {
      code: "",
      descr: "",
      prodotto: "",
      um: "",
      previsto: "",
      note: "",
      zona: "",
      operators: [{ name: "", ore: "" }],
    },
  ]);

  const taskOptions = React.useMemo(() => getAllTasks() || [], []);

  function addActivity() {
    setActivities((prev) => [
      ...prev,
      {
        code: "",
        descr: "",
        prodotto: "",
        um: "",
        previsto: "",
        note: "",
        zona: "",
        operators: [{ name: "", ore: "" }],
      },
    ]);
  }
  function rmActivity(i) {
    setActivities((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updAct(i, key, value) {
    setActivities((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  }
  function addOp(i) {
    setActivities((prev) => {
      const next = [...prev];
      const ops = Array.isArray(next[i].operators) ? next[i].operators : [];
      next[i].operators = [...ops, { name: "", ore: "" }];
      return next;
    });
  }
  function rmOp(i, j) {
    setActivities((prev) => {
      const next = [...prev];
      const ops = Array.isArray(next[i].operators) ? next[i].operators : [];
      const res = ops.filter((_, idx) => idx !== j);
      next[i].operators = res.length ? res : [{ name: "", ore: "" }];
      return next;
    });
  }
  function updOp(i, j, field, val) {
    setActivities((prev) => {
      const next = [...prev];
      const ops = Array.isArray(next[i].operators)
        ? [...next[i].operators]
        : [{ name: "", ore: "" }];
      ops[j] = { ...ops[j], [field]: val };
      next[i].operators = ops;
      return next;
    });
  }

  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <div className="text-xs opacity-70">Capo</div>
            <div className="text-lg font-bold">{user?.name || "-"}</div>
            <div className="text-xs opacity-70">Squadra: {teamName || "-"}</div>
          </div>
          <label className="grid gap-1">
            <span className="text-sm opacity-70">Data</span>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button className="btn w-full" onClick={addActivity}>
              + Aggiungi attività
            </button>
            <button
              className="btn w-full"
              onClick={() => exportRapportinoPDF({ capo: user?.name, date, activities })}
            >
              🧾 Esporta PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {activities.map((a, i) => (
          <div key={i} className="relative">
            <ActivityCard
              a={a}
              i={i}
              taskOptions={taskOptions}
              teamOptions={teamMembers}
              updAct={updAct}
              addOp={addOp}
              rmOp={rmOp}
              updOp={updOp}
            />
            <div className="absolute top-2 right-2">
              <button className="btn" onClick={() => rmActivity(i)} title="Rimuovi attività">
                ✖
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
