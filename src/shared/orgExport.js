// src/shared/orgExport.js
import { loadOrg } from "@/shared/orgStore.js";

function q(v) {
  // Quote CSV (Excel-friendly), remplace " par ""
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function formatDateISO() {
  try {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "data";
  }
}

/**
 * Construit le CSV détaillé :
 * team;capo;member;role;availability;skills;phone;note
 * - 1 ligne par membre affecté à une équipe
 * - Les "Non assegnati" sont exportés à part avec team="Non assegnati"
 */
export function buildOrgCSV(org) {
  const sep = ";";
  const header = [
    "team",
    "capo",
    "member",
    "role",
    "availability",
    "skills",
    "phone",
    "note",
  ];
  const lines = [header.join(sep)];

  const byId = new Map((org.members || []).map((m) => [m.id, m]));
  const getName = (id) => (byId.get(id)?.name ?? "");

  // Équipes
  for (const t of org.teams || []) {
    const teamName = t.name || "";
    const capoName = getName(t.capo);
    for (const mid of t.members || []) {
      const m = byId.get(mid);
      if (!m) continue;
      const row = [
        teamName,
        capoName,
        m.name ?? "",
        m.role ?? "",
        m.availability ?? "",
        Array.isArray(m.skills) ? m.skills.join(",") : (m.skills ?? ""),
        m.phone ?? "",
        m.note ?? "",
      ].map(q);
      lines.push(row.join(sep));
    }
  }

  // Non assegnati
  for (const mid of org.unassigned || []) {
    const m = byId.get(mid);
    if (!m) continue;
    const row = [
      "Non assegnati",
      "",
      m.name ?? "",
      m.role ?? "",
      m.availability ?? "",
      Array.isArray(m.skills) ? m.skills.join(",") : (m.skills ?? ""),
      m.phone ?? "",
      m.note ?? "",
    ].map(q);
    lines.push(row.join(sep));
  }

  // BOM pour qu'Excel ouvre en UTF-8 sans casser les accents
  const bom = "\uFEFF";
  return bom + lines.join("\r\n");
}

function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportOrgCSV() {
  const org = loadOrg();
  const csv = buildOrgCSV(org);
  const name = `organigramma_${formatDateISO()}.csv`;
  downloadBlob(csv, "text/csv;charset=utf-8", name);
}

// Optionnel : export JSON brut (sauvegarde/restauration)
export function exportOrgJSON() {
  const org = loadOrg();
  const name = `organigramma_${formatDateISO()}.json`;
  downloadBlob(JSON.stringify(org, null, 2), "application/json", name);
}
