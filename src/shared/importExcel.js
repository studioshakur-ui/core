// Lecture XLSX (avec styles) + CSV.
// Deux modes :
//  - blocks (XLSX avec fond vert) => groupes { capo, members[] } (jusqu'à la prochaine ligne verte / ligne vide)
//  - flat (CSV/XLSX sans styles)  => { capi[], operai[] } basés sur entêtes ("capo/ruolo") ou tout en operai

import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

// ---------- Utils ----------
function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function isNameish(s) {
  s = clean(s);
  // Doit contenir au moins une minuscule (évite "POD DX", "STESURA FIBRE")
  if (!/[a-zà-öø-ý]/.test(s)) return false;
  // Commence par majuscule, autorise accents, apostrophes, tirets
  return /^[A-ZÀ-ÖØ-Ý][a-zà-öø-ý'.\- ]{1,}$/.test(s);
}
function toFullName(first, last, raw) {
  const f = clean(first), l = clean(last), r = clean(raw);
  if (f && l) return `${f} ${l}`;
  if (r) return r;
  if (f) return f;
  if (l) return l;
  return "";
}
function hexToRgb(hex) {
  const h = hex.replace(/^#/, "");
  const v = h.length === 8 ? h.slice(2) : h.length === 6 ? h : null;
  if (!v) return null;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return { r, g, b };
}
// "Vert" tolérant
function isGreenish(argbOrHex) {
  if (!argbOrHex) return false;
  const hex = String(argbOrHex).startsWith("#")
    ? argbOrHex
    : "#" + String(argbOrHex).replace(/^..../, ""); // ARGB -> #RRGGBB
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const { r, g, b } = rgb;
  return g > 140 && g > r + 25 && g > b + 25;
}

// ---------- CSV / XLSX sans styles (mode flat) ----------
function guessHeaderIndexes(rows) {
  if (!rows.length) return { firstIdx: 0, lastIdx: 1, rawIdx: null, roleIdx: null };
  const header = rows[0].map((x) => clean(x).toLowerCase());
  const findIdx = (keys) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  const firstIdx = findIdx(["prenom", "prénom", "first", "nome"]);
  const lastIdx  = findIdx(["nom", "cognome", "last", "surname"]);
  const rawIdx   = findIdx(["nome completo", "full", "nominativo", "name"]);
  const roleIdx  = findIdx(["ruolo", "role", "capo"]);
  return {
    firstIdx: firstIdx >= 0 ? firstIdx : 0,
    lastIdx:  lastIdx  >= 0 ? lastIdx  : 1,
    rawIdx:   rawIdx   >= 0 ? rawIdx   : null,
    roleIdx:  roleIdx  >= 0 ? roleIdx  : null,
  };
}

function parseWithXLSX(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const names = new Map(); // name -> role
  const op = [];
  const cp = [];
  wb.SheetNames.forEach((sn) => {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!rows || !rows.length) return;
    const { firstIdx, lastIdx, rawIdx, roleIdx } = guessHeaderIndexes(rows);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const full = toFullName(row[firstIdx], row[lastIdx], rawIdx != null ? row[rawIdx] : "");
      const name = clean(full);
      if (!name || !isNameish(name)) continue;
      let isCapo = false;
      if (roleIdx != null) {
        const role = clean(row[roleIdx]).toLowerCase();
        if (role.includes("capo")) isCapo = true;
      }
      if (!names.has(name)) {
        names.set(name, isCapo ? "capo" : "operaio");
        (isCapo ? cp : op).push(name);
      }
    }
  });
  return { mode: "flat", capi: cp, operai: op };
}

// ---------- XLSX avec styles (mode blocks par lignes vertes) ----------
async function parseBlocksWithExcelJS(file) {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const groups = [];
  const singles = [];

  wb.eachSheet((ws) => {
    let current = null; // { capo, members[] }

    ws.eachRow((row) => {
      // Extraire le "nom plausible" : 1ers champs texte de la ligne
      const cells = row.values
        .filter((v) => v && typeof v !== "number")
        .map((v) => (typeof v === "string" ? v : v.text || ""));
      const first = cells[1] ?? cells[0] ?? "";
      const second = cells[2] ?? "";
      const raw = cells[0] ?? "";
      const candidate = toFullName(first, second, raw);
      const name = clean(candidate);

      // Lignes vides -> on coupe le groupe
      if (!name) { current = null; return; }

      // Cette ligne est-elle verte ?
      let green = false;
      row.eachCell((cell) => {
        const fill = cell.fill;
        if (fill && fill.type === "pattern" && fill.fgColor && fill.fgColor.argb) {
          if (isGreenish(fill.fgColor.argb)) green = true;
        }
      });

      // Si nom non humain, on ignore (ex: "POD DX")
      if (!isNameish(name)) { current = green ? null : current; return; }

      if (green) {
        // Nouveau capo -> nouveau groupe
        current = { capo: name, members: [] };
        groups.push(current);
      } else {
        // Operaio : si un capo courant existe, on l'associe; sinon, single
        if (current) {
          if (!current.members.includes(name) && name.toLowerCase() !== current.capo.toLowerCase()) {
            current.members.push(name);
          }
        } else {
          if (!singles.includes(name)) singles.push(name);
        }
      }
    });
  });

  return { mode: "blocks", groups, singles };
}

// ---------- API publique ----------
export async function importRosterBlocks(file) {
  // Mode groupé par lignes vertes (XLSX). Renvoie { mode:"blocks", groups:[{capo,members[]}], singles:[] }
  try {
    return await parseBlocksWithExcelJS(file);
  } catch (e) {
    console.warn("ExcelJS blocks failed, falling back to flat:", e);
    const buf = await file.arrayBuffer();
    return parseWithXLSX(buf);
  }
}

export async function importRoster(file) {
  // Mode simple (capi/operai) pour CSV/XLSX sans styles
  try {
    const name = (file?.name || "").toLowerCase();
    const buf = await file.arrayBuffer();
    // Si c'est du CSV, pas de styles -> flat
    if (name.endsWith(".csv")) return parseWithXLSX(buf);
    // Sinon tente ExcelJS pour styles; s'il ne trouve pas de groupes => flat
    try {
      const blocks = await parseBlocksWithExcelJS(file);
      if (blocks.mode === "blocks" && blocks.groups.length) return blocks;
    } catch { /* ignore */ }
    return parseWithXLSX(buf);
  } catch (e) {
    console.error("Import error:", e);
    return { mode: "flat", capi: [], operai: [] };
  }
}
