// src/shared/importExcel.js
// Lecture XLSX (avec styles) + CSV. Extrait Nom+Prénom et rôle (capo via fond vert).
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

// Utilitaires
function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}
function isNameish(s) {
  s = clean(s);
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
// "Vert" tolérant : g élevé, r & b modérés
function isGreenish(argbOrHex) {
  if (!argbOrHex) return false;
  const hex = String(argbOrHex).startsWith("#")
    ? argbOrHex
    : "#" + String(argbOrHex).replace(/^..../, ""); // ExcelJS ARGB -> #RRGGBB
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const { r, g, b } = rgb;
  return g > 140 && g > r + 25 && g > b + 25;
}

// Détection colonnes (CSV / feuilles sans styles)
function guessHeaderIndexes(rows) {
  // Cherche "nom/prénom" dans l'entête; sinon prend 2 premières colonnes texte
  if (!rows.length) return { firstIdx: 0, lastIdx: 1, rawIdx: null, roleIdx: null };
  const header = rows[0].map((x) => clean(x).toLowerCase());
  const findIdx = (keys) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  const firstIdx = findIdx(["prenom", "prénom", "first", "nome"]);
  const lastIdx = findIdx(["nom", "cognome", "last", "surname"]);
  const rawIdx = findIdx(["nome completo", "full", "nominativo", "name"]);
  const roleIdx = findIdx(["ruolo", "role", "capo"]);
  return {
    firstIdx: firstIdx >= 0 ? firstIdx : 0,
    lastIdx: lastIdx >= 0 ? lastIdx : 1,
    rawIdx: rawIdx >= 0 ? rawIdx : null,
    roleIdx: roleIdx >= 0 ? roleIdx : null,
  };
}

// CSV ou XLSX SANS styles → pas de couleur disponible
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
  return { capi: cp, operai: op };
}

// XLSX AVEC styles → détecte le fond vert
async function parseWithExcelJS(file) {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const capi = new Set();
  const operai = new Set();

  wb.eachSheet((ws) => {
    ws.eachRow((row, rowNumber) => {
      // Reconstitue un nom à partir des 2 premières cellules "texte", sinon concatène les 3 premières
      const cells = row.values
        .filter((v) => v && typeof v !== "number")
        .map((v) => (typeof v === "string" ? v : v.text || "")); // ExcelJS 'RichText' support
      const first = cells[1] ?? cells[0] ?? "";
      const second = cells[2] ?? "";
      const raw = cells[0] ?? "";
      const full = toFullName(first, second, raw);
      const name = clean(full);
      if (!name || !isNameish(name)) return;

      // Cherche un remplissage vert sur la ligne (n'importe quelle cellule)
      let isCapo = false;
      row.eachCell((cell) => {
        const fill = cell.fill;
        if (fill && fill.type === "pattern" && fill.fgColor && fill.fgColor.argb) {
          if (isGreenish(fill.fgColor.argb)) isCapo = true;
        }
      });

      // Heuristique : si une cellule contient "capo" en clair
      if (!isCapo) {
        const text = cells.join(" ").toLowerCase();
        if (text.includes("capo")) isCapo = true;
      }

      (isCapo ? capi : operai).add(name);
    });
  });

  return { capi: [...capi], operai: [...operai] };
}

// API principale
export async function importRoster(file) {
  const name = file?.name?.toLowerCase() || "";
  const isXlsx = name.endsWith(".xlsx") || name.endsWith(".xlsm") || name.endsWith(".xlsb");
  try {
    if (isXlsx) {
      // Tente ExcelJS (styles), fallback sur xlsx si problème
      try { return await parseWithExcelJS(file); }
      catch { /* fallback */ }
    }
    const buf = await file.arrayBuffer();
    return parseWithXLSX(buf);
  } catch (e) {
    console.error("Import error:", e);
    return { capi: [], operai: [] };
  }
}
