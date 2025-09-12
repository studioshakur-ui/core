// Classement & suggestions pour l'assignation
import { loadOrg } from "@/shared/orgStore.js";

const RECENT_KEY = "core_recent_teams";

export function rememberRecentTeam(teamId) {
  if (!teamId) return;
  const arr = getRecentTeams().filter((x) => x !== teamId);
  arr.unshift(teamId);
  while (arr.length > 5) arr.pop();
  localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
}

export function getRecentTeams() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function teamsMeta(orgIn) {
  const org = orgIn || loadOrg() || { members: [], teams: [] };
  const byId = new Map((org.members || []).map((m) => [m.id, m]));
  return (org.teams || []).map((t) => {
    const capo = byId.get(t.capo);
    const sizeNoCapo = (t.members || []).filter((id) => id !== t.capo).length;
    return {
      id: t.id,
      capoId: t.capo,
      capoName: capo ? capo.name : "",
      sizeNoCapo,
    };
  });
}

// Classement simple : moins chargé en premier + bonus de récence
export function rankTeams(orgIn) {
  const metas = teamsMeta(orgIn);
  const rec = getRecentTeams();
  const target = 8; // objectif doux
  return metas
    .map((m) => {
      const loadScore = Math.max(0, target - m.sizeNoCapo); // + si peu chargé
      const rIndex = rec.indexOf(m.id);
      const recentScore = rIndex >= 0 ? (5 - rIndex) : 0;   // MRU bonus
      const score = loadScore * 2 + recentScore * 3;
      return { ...m, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function leastLoadedTeamId(orgIn) {
  const metas = teamsMeta(orgIn);
  if (!metas.length) return null;
  return metas.reduce((p, c) => (c.sizeNoCapo < p.sizeNoCapo ? c : p)).id;
}
