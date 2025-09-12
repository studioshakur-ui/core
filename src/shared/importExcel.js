// Lecture XLSX/CSV + détection "capo par ligne verte" (ExcelJS).
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

// ---------- utils ----------
function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function isNameish(s) {
  s = clean(s);
  return /^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-Ý'à-öø-ÿ.\- ]{1,}$/.test(s);
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
function isGreenish(argbOrHex) {
  if (!argbOrHex) return false;
  const hex = String(argbOrHex).startsWith("#")
    ? argbOrHex
    : "#" + String(argbOrHex).replace(/^..../, ""); // ARGB -> #RRGGBB
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const { r, g, b } = rgb;
  // vert visible (tolérant) : g fort, r/b plus faibles
  return g > 140 && g > r + 25 && g > b + 25;
}

function firstTextCells(row) {
  // Renvoie les 3 premières cellules "texte"
  const arr = [];
  row.eachCell((cell) => {
    const v = cell.value;
    const s = typeof v === "string" ? v : v?.text || "";
    const t = clean(s);
    if (t) arr.push(t);
  });
  return arr.slice(0, 3);
}

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
    lastIdx : lastIdx  >= 0 ? lastIdx  : 1,
    rawIdx  : rawIdx   >= 0 ? rawIdx   : null,
    roleIdx : roleIdx  >= 0 ? roleIdx  : null,
  };
}

// ---------- parse CSV / xlsx sans styles ----------
function parseWithXLSX(buf) {
  const wb = XLSX.read(buf, { type: "array" });
  const names = new Map();
  const capi = [], operai = [];
  wb.SheetNames.forEach((sn) => {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!rows?.length) return;
    const { firstIdx, lastIdx, rawIdx, roleIdx } = guessHeaderIndexes(rows);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const full = toFullName(row[firstIdx], row[lastIdx], rawIdx != null ? row[rawIdx] : "");
      const name = clean(full);
      if (!isNameish(name)) continue;
      let isCapo = false;
      if (roleIdx != null) {
        const roleText = clean(row[roleIdx]).toLowerCase();
        if (roleText.includes("capo")) isCapo = true;
      }
      if (!names.has(name)) {
        names.set(name, true);
        (isCapo ? capi : operai).push(name);
      }
    }
  });
  return { capi, operai };
}

// ---------- parse XLSX avec styles : blocs capo -> membri ----------
async function parseBlocksExcelJS(file, sheetNamePrefs = ["PROGRAMMA"]) {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  // Choix de la feuille: d'abord par nom préféré, sinon la plus "dense"
  let sheet = null;
  for (const pref of sheetNamePrefs) {
    sheet = wb.getWorksheet(pref);
    if (sheet) break;
  }
  if (!sheet) {
    sheet = wb.worksheets.slice().sort((a, b) => (b.actualRowCount || 0) - (a.actualRowCount || 0))[0] || wb.worksheets[0];
  }
  if (!sheet) return { blocks: [] };

  const blocks = []; // [{capo:"", members:["","",..."]}]
  let current = null;

  sheet.eachRow((row) => {
    // détecte si la ligne est "verte"
    let green = false;
    row.eachCell((cell) => {
      const fill = cell.fill;
      if (fill && fill.type === "pattern" && fill.fgColor?.argb) {
        if (isGreenish(fill.fgColor.argb)) green = true;
      }
    });

    const texts = firstTextCells(row);
    // on prend le nom dans la première colonne texte (typiquement col A)
    const name = clean(
      toFullName(texts[0] || "", texts[1] || "", texts[0] || "")
    );
    if (!isNameish(name)) return; // saute lignes vides / entêtes / tâches

    if (green) {
      // nouvelle équipe
      current = { capo: name, members: [] };
      blocks.push(current);
    } else {
      // membre du dernier capo rencontré
      if (!current) {
        // si aucun capo vu encore, on ignore (ou on pourrait empiler en noCapo)
        return;
      }
      if (!current.members.includes(name) && name !== current.capo) {
        current.members.push(name);
      }
    }
  });

  return { blocks };
}

// ---------- API publiques ----------

// 1) Import simple (capo vs operai)
export async function importRoster(file) {
  const lower = file?.name?.toLowerCase() || "";
  const isXlsx = lower.endsWith(".xlsx") || lower.endsWith(".xlsm") || lower.endsWith(".xlsb");
  try {
    if (isXlsx) {
      // essaye ExcelJS pour couleurs; si rien -> fallback "simple"
      const { blocks } = await parseBlocksExcelJS(file);
      if (blocks?.length) {
        // déduire listes depuis les blocs
        const capi = blocks.map(b => b.capo);
        const operai = [...new Set(blocks.flatMap(b => b.members))];
        return { capi, operai, blocks };
      }
    }
    const buf = await file.arrayBuffer();
    const { capi, operai } = parseWithXLSX(buf);
    return { capi, operai, blocks: [] };
  } catch (e) {
    console.error("Import error:", e);
    return { capi: [], operai: [], blocks: [] };
  }
}

// 2) Import structuré par équipes (nécessite XLSX avec couleur verte)
export async function importRosterWithTeams(file) {
  try {
    const { blocks } = await parseBlocksExcelJS(file);
    return { blocks };
  } catch (e) {
    console.error("Team import error:", e);
    return { blocks: [] };
  }
}
