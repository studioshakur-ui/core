import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabaseClient";

/** =======================
 *  Helpers "débutant friendly"
 *  ======================= */
function norm(v) {
  if (v == null) return "";
  return String(v).replace(/\s+/g, " ").trim();
}
function toTitle(v) {
  const n = norm(v).toLowerCase();
  return n.replace(/\b\p{L}+/gu, (w) => w[0].toUpperCase() + w.slice(1));
}
function isLikelyName(s) {
  const v = norm(s);
  if (!v || v.length < 2) return false;
  // mots "techniques" que l'on ne veut pas prendre pour des noms
  const BAD = [
    "PROGRAMMA","GENERALE","TOTALE","PERSONE","BORDO","MAGAZZINO","FERIE",
    "LOCKER","CAPO","SQUADRA","MONTAGGI","CONSEGNE","CHIUSURA","W","SETTIMANA"
  ];
  const U = v.toUpperCase();
  if (BAD.some(b => U.includes(b))) return false;
  // lettres (y compris accents) + espaces majoritaires = probablement un nom
  const letters = v.replace(/[^A-Za-zÀ-ÿ' ]+/g, "");
  const frac = letters.length / v.length;
  return frac >= 0.6;
}

/** Analyse "matrice": colonnes = Capi, lignes = membres */
function analyzeMatrix(grid) {
  if (!grid?.length) return null;

  // On cherche la ligne qui a le plus de "noms" → c'est probablement la ligne d'entête (Capi)
  let bestRow = -1, bestScore = 0;
  const scan = Math.min(20, grid.length);
  for (let r = 0; r < scan; r++) {
    const row = grid[r] || [];
    const score = row.filter(isLikelyName).length;
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }
  if (bestRow < 0 || bestScore < 1) return null;

  // Headers = noms des capi
  const headers = (grid[bestRow] || []).map(h => isLikelyName(h) ? toTitle(h) : "");
  const capoCols = [];
  headers.forEach((h, i) => { if (h) capoCols.push({ index: i, capo: h }); });
  if (!capoCols.length) return null;

  // Lignes suivantes = membres de chaque colonne (capo)
  const rows = [];
  for (let r = bestRow + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    for (const { index, capo } of capoCols) {
      const cell = (row[index] ?? "").toString();
      if (isLikelyName(cell)) {
        rows.push({ capo, member: toTitle(cell), role: "operaio" });
      }
    }
  }
  return { rows, singles: [] };
}

/** Fallback: format "Capo | Membro | Ruolo" */
function analyzeColumnar(grid) {
  if (!grid?.length) return null;
  const H = (grid[0] || []).map((x) => norm(x).toLowerCase());
  const capoIdx = H.findIndex(h => /capo/.test(h));
  const memIdx  = H.findIndex(h => /membro|operaio|nome/.test(h));
  const rolIdx  = H.findIndex(h => /ruolo|role/.test(h));
  if (capoIdx < 0 || memIdx < 0) return null;

  const rows = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r] || [];
    const capo = toTitle(row[capoIdx] || "");
    const member = toTitle(row[memIdx] || "");
    const role = toTitle((rolIdx >= 0 ? row[rolIdx] : "operaio") || "operaio");
    if (isLikelyName(capo) && isLikelyName(member)) rows.push({ capo, member, role });
  }
  return rows.length ? { rows, singles: [] } : null;
}

/** Analyse "intelligente" = on tente Matrice puis Colonnaire */
function smartAnalyze(grid) {
  const mx = analyzeMatrix(grid);
  if (mx && mx.rows?.length) return mx;
  const col = analyzeColumnar(grid);
  if (col && col.rows?.length) return col;
  return { rows: [], singles: [] };
}

/** Convertit [{capo, member}] → { "Capo A": ["M1","M2"], "Capo B": [...] } */
function toBoard(rows) {
  const board = {};
  for (const { capo, member } of rows) {
    if (!board[capo]) board[capo] = [];
    board[capo].push(member);
  }
  return board;
}

/** Petit utilitaire stats + doublons */
function computeStats(board) {
  const capi = Object.keys(board).length;
  let members = 0;
  const all = [];
  for (const list of Object.values(board)) {
    members += list.length;
    all.push(...list.map(norm));
  }
  const counts = all.reduce((acc, n) => (acc[n] = (acc[n] || 0) + 1, acc), {});
  const duplicates = Object.entries(counts)
    .filter(([_, c]) => c > 1)
    .map(([name, c]) => ({ name, count: c }));
  return { capi, members, duplicates };
}

/** =======================
 *  Composants UI tout simples
 *  ======================= */
function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${className}`}>{children}</span>
  );
}
function Button({ children, className="", ...rest }) {
  return (
    <button
      className={`px-3 py-2 rounded-xl font-medium hover:opacity-90 active:scale-[.98] transition ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** =======================
 *  Page Manager (complète)
 *  ======================= */
export default function Manager() {
  const [board, setBoard] = useState({});          // {capo:[membri]}
  const [fileName, setFileName] = useState("");
  const [importCount, setImportCount] = useState(0);
  const [syncState, setSyncState] = useState("idle"); // idle | syncing | done | error
  const stats = useMemo(() => computeStats(board), [board]);

  /** Import Excel / CSV */
  async function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    // header:1 → tableau de lignes/colonnes
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });

    const res = smartAnalyze(grid);
    const nextBoard = toBoard(res.rows);
    setBoard(nextBoard);
    setImportCount(res.rows.length);
  }

  /** Actions simples */
  function addCapo(name) {
    const n = toTitle(name);
    if (!n) return;
    setBoard((b) => (b[n] ? b : { ...b, [n]: [] }));
  }
  function removeCapo(name) {
    setBoard((b) => {
      const copy = { ...b };
      delete copy[name];
      return copy;
    });
  }
  function addMember(capo, member) {
    const m = toTitle(member);
    if (!m) return;
    setBoard((b) => ({ ...b, [capo]: [...(b[capo] || []), m] }));
  }
  function removeMember(capo, member) {
    setBoard((b) => ({ ...b, [capo]: (b[capo] || []).filter((x) => norm(x) !== norm(member)) }));
  }
  function clearAll() {
    if (confirm("Vider l'organigramme ?")) setBoard({});
  }

  /** (Optionnel) Sync to Supabase — nécessite les tables ci-dessous (voir Étape 3) */
  async function syncToSupabase() {
    try {
      setSyncState("syncing");
      // 1) upsert teams
      const teamIdByName = {};
      for (const [capo, members] of Object.entries(board)) {
        const { data, error } = await supabase
          .from("teams")
          .upsert([{ name: capo }], { onConflict: "name" })
          .select()
          .single();
        if (error) throw error;
        teamIdByName[capo] = data.id;

        // 2) upsert people + link
        for (const full_name of members) {
          // upsert personne
          const { data: person, error: perr } = await supabase
            .from("people")
            .upsert([{ full_name }], { onConflict: "full_name" })
            .select()
            .single();
          if (perr) throw perr;

          // 3) lien team_members
          const { error: merr } = await supabase
            .from("team_members")
            .upsert([{ team_id: data.id, person_id: person.id, role: "operaio" }]);
          if (merr) throw merr;
        }
      }
      setSyncState("done");
      alert("Sync OK ✅");
    } catch (e) {
      console.error(e);
      setSyncState("error");
      alert("Sync error: " + (e?.message || "Unknown"));
    }
  }

  /** UI */
  const duplicateBadge =
    stats.duplicates.length ? (
      <Pill className="bg-amber-500/15 text-amber-400 border border-amber-500/30">
        Duplicati: {stats.duplicates.length}
      </Pill>
    ) : (
      <Pill className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        Duplicati: 0
      </Pill>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Organigramma</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill className="bg-slate-700/60">Fichier: {fileName || "—"}</Pill>
              <Pill className="bg-slate-700/60">Membri: {stats.members}</Pill>
              <Pill className="bg-slate-700/60">Capi: {stats.capi}</Pill>
              {duplicateBadge}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center px-3 py-2 rounded-xl bg-cyan-600 text-white cursor-pointer">
              Importa Excel
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImportFile}/>
            </label>
            <Button onClick={clearAll} className="bg-slate-700">Svuota</Button>
            <Button
              onClick={syncToSupabase}
              className="bg-emerald-600 text-white"
              disabled={!stats.capi || syncState==="syncing"}
              title={!stats.capi ? "Importe un fichier d'abord" : "Pousser vers Supabase"}
            >
              {syncState==="syncing" ? "Sync..." : "Sync to Supabase"}
            </Button>
          </div>
        </div>

        {/* Ajout rapide d'un capo */}
        <AddCapoBar onAdd={addCapo} />

        {/* Board des capi */}
        {stats.capi === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(board).sort(([a],[b]) => a.localeCompare(b, "it")).map(([capo, members]) => (
              <CapoColumn
                key={capo}
                capo={capo}
                members={members}
                onRemoveCapo={() => removeCapo(capo)}
                onAddMember={(m) => addMember(capo, m)}
                onRemoveMember={(m) => removeMember(capo, m)}
              />
            ))}
          </div>
        )}

        {/* Liste des doublons si présents */}
        {stats.duplicates.length > 0 && (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="font-semibold mb-2">Doublons détectés</div>
            <ul className="text-sm space-y-1">
              {stats.duplicates.map(d => (
                <li key={d.name} className="flex justify-between">
                  <span>{toTitle(d.name)}</span>
                  <span className="opacity-70">×{d.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/** Bar d’ajout d’un nouveau Capo */
function AddCapoBar({ onAdd }) {
  const [val, setVal] = useState("");
  return (
    <div className="mt-6 flex items-center gap-2">
      <input
        value={val}
        onChange={(e)=>setVal(e.target.value)}
        placeholder="Nouveau Capo (ex: Mascolino Vincenzo)"
        className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-600"
      />
      <Button
        onClick={() => { onAdd(val); setVal(""); }}
        className="bg-slate-700"
      >
        + Aggiungi Capo
      </Button>
    </div>
  );
}

/** Colonne: 1 Capo + membres */
function CapoColumn({ capo, members, onRemoveCapo, onAddMember, onRemoveMember }) {
  const [val, setVal] = useState("");
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="font-semibold">{capo}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-slate-700">{members.length} membri</span>
          <button
            onClick={onRemoveCapo}
            className="text-slate-300 hover:text-red-400"
            title="Elimina Capo"
          >✕</button>
        </div>
      </div>

      <ul className="px-4 py-3 space-y-2">
        {members.map((m) => (
          <li key={m} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
            <span>{m}</span>
            <button
              onClick={() => onRemoveMember(m)}
              className="text-slate-400 hover:text-red-400"
              title="Rimuovi"
            >🗑</button>
          </li>
        ))}
      </ul>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <input
            value={val}
            onChange={(e)=>setVal(e.target.value)}
            placeholder="Ajouter un membre"
            className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-600"
          />
          <Button onClick={() => { onAddMember(val); setVal(""); }} className="bg-cyan-600 text-white">
            + Operaio
          </Button>
        </div>
      </div>
    </div>
  );
}

/** État vide guidé */
function EmptyState() {
  return (
    <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-800/40 p-8 text-center">
      <div className="text-lg font-semibold mb-2">Importe ton Excel “matrice”</div>
      <p className="opacity-80">
        Chaque <b>colonne</b> = <b>Capo</b>, en dessous tu mets les <b>membres</b>.  
        Exemple: <i>“Maiga Hamidou | Mogavero | Mascolino Vincenzo”</i> en entête.
      </p>
    </div>
  );
}
