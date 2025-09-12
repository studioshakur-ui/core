// src/shared/orgStore.js
// Store simple basé sur localStorage pour l'organigramme.
// Structure : { members:[], teams:[], unassigned:[], suspects:[] }

import { v4 as uuid } from "uuid";

// ---------- Helpers stockage ----------
const KEY = "org";

function nowIso() {
  return new Date().toISOString();
}

export function loadOrg() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { members: [], teams: [], unassigned: [], suspects: [] };
    const o = JSON.parse(raw);
    // garde-fou structure
    return {
      members: Array.isArray(o.members) ? o.members : [],
      teams: Array.isArray(o.teams) ? o.teams : [],
      unassigned: Array.isArray(o.unassigned) ? o.unassigned : [],
      suspects: Array.isArray(o.suspects) ? o.suspects : [],
    };
  } catch {
    return { members: [], teams: [], unassigned: [], suspects: [] };
  }
}

export function saveOrg(o) {
  const safe = {
    members: Array.isArray(o.members) ? o.members : [],
    teams: Array.isArray(o.teams) ? o.teams : [],
    unassigned: Array.isArray(o.unassigned) ? o.unassigned : [],
    suspects: Array.isArray(o.suspects) ? o.suspects : [],
    _updatedAt: nowIso(),
  };
  localStorage.setItem(KEY, JSON.stringify(safe));
}

export function resetOrg() {
  saveOrg({ members: [], teams: [], unassigned: [], suspects: [] });
}

// ---------- Membres ----------
export function addMember({ name, email = "", role = "Operaio" }) {
  const o = loadOrg();
  const id = uuid();
  const m = { id, name: String(name || "").trim(), email, role, createdAt: nowIso() };
  o.members = [...o.members, m];
  // par défaut, un membre nouvellement créé va en "Sorgente" (unassigned)
  o.unassigned = Array.from(new Set([...(o.unassigned || []), id]));
  saveOrg(o);
  return m;
}

export function removeMember(memberId) {
  const o = loadOrg();

  // Si le membre est capo d'une équipe, on enlève le capo
  o.teams = (o.teams || []).map((t) => {
    if (t.capo === memberId) {
      return { ...t, capo: null, members: (t.members || []).filter((id) => id !== memberId) };
    }
    return { ...t, members: (t.members || []).filter((id) => id !== memberId) };
  });

  o.unassigned = (o.unassigned || []).filter((id) => id !== memberId);
  o.members = (o.members || []).filter((m) => m.id !== memberId);

  saveOrg(o);
}

// ---------- Équipes ----------
export function addTeam(kind = "capo") {
  const o = loadOrg();
  const id = uuid();
  const t = { id, kind, label: "", capo: null, members: [], createdAt: nowIso() };
  o.teams = [...(o.teams || []), t];
  saveOrg(o);
  return t;
}

export function removeTeam(teamId) {
  const o = loadOrg();
  const team = (o.teams || []).find((t) => t.id === teamId);
  if (!team) return;

  // renvoie tous ses membres à Sorgente
  const back = (team.members || []);
  o.unassigned = Array.from(new Set([...(o.unassigned || []), ...back]));

  // supprime l'équipe
  o.teams = (o.teams || []).filter((t) => t.id !== teamId);

  saveOrg(o);
}

export function editTeam(teamId, patch = {}) {
  const o = loadOrg();
  const idx = (o.teams || []).findIndex((t) => t.id === teamId);
  if (idx < 0) return;

  const current = o.teams[idx];

  // Si on change le capo, on garde le membre dans la colonne
  let next = { ...current, ...patch };

  // Assure que members est unifié (Set) et que capo n'est pas dupliqué
  const mem = new Set([...(next.members || [])]);
  if (next.capo) mem.add(next.capo);
  next.members = Array.from(mem);

  o.teams[idx] = next;
  saveOrg(o);
}

// ---------- Mouvements ----------
// NOTE RÈGLE: en prod, seuls les "manager" doivent pouvoir déplacer.
// Ici on ne dépend PAS de Supabase côté client pour éviter des erreurs build.
// Si tu veux simuler localement, mets localStorage.setItem("__role","capo"|"manager").
function isManagerLocal() {
  const r = (localStorage.getItem("__role") || "manager").toLowerCase();
  return r === "manager";
}

export function moveMember(memberId, toTeamId /* null => unassigned */) {
  // Guard "léger" côté client : bloque si rôle local ≠ manager
  if (!isManagerLocal()) {
    console.warn("moveMember denied: local role is not 'manager'");
    return;
  }

  const o = loadOrg();
  const midx = (o.members || []).findIndex((m) => m.id === memberId);
  if (midx < 0) return;

  // Retire de toutes les équipes et de unassigned
  o.teams = (o.teams || []).map((t) => ({
    ...t,
    members: (t.members || []).filter((id) => id !== memberId),
  }));
  o.unassigned = (o.unassigned || []).filter((id) => id !== memberId);

  if (toTeamId) {
    const t = (o.teams || []).find((x) => x.id === toTeamId);
    if (!t) return;
    t.members = Array.from(new Set([...(t.members || []), memberId]));
  } else {
    o.unassigned = Array.from(new Set([...(o.unassigned || []), memberId]));
  }

  saveOrg(o);
}

// ---------- Utilitaires divers ----------
export function exportJSON() {
  const o = loadOrg();
  return JSON.stringify(o, null, 2);
}

// Répare rapidement la structure si besoin (ex: après import brut)
export function normalizeOrg() {
  const o = loadOrg();
  const memberIds = new Set((o.members || []).map((m) => m.id));

  o.teams = (o.teams || []).map((t) => {
    const members = (t.members || []).filter((id) => memberIds.has(id));
    const capo = t.capo && memberIds.has(t.capo) ? t.capo : null;
    // évite le doublon et garde capo dans la liste members (compte propre)
    const set = new Set(members);
    if (capo) set.add(capo);
    return { ...t, capo, members: Array.from(set) };
  });

  o.unassigned = (o.unassigned || []).filter((id) => memberIds.has(id));

  saveOrg(o);
  return o;
}
