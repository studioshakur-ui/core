// Plans d'actions (sans appliquer) + utilitaires
import { loadOrg, moveMember } from "@/shared/orgStore.js";
import { historyCapture } from "@/shared/history.js";

export function takeOrg(orgIn) {
  const o = orgIn || loadOrg() || { members: [], teams: [], unassigned: [], suspects: [] };
  return (o && typeof o === "object") ? o : { members: [], teams: [], unassigned: [], suspects: [] };
}

function byIdMap(arr) { return new Map((arr || []).map((x) => [x.id, x])); }

export function teamSizeNoCapo(team, o) {
  return (team.members || []).filter((id) => id !== team.capo).length;
}

export function computeSizes(o) {
  const sizes = {};
  (o.teams || []).forEach(t => sizes[t.id] = teamSizeNoCapo(t, o));
  return sizes;
}

export function computeDuplicates(o) {
  const seen = new Map();
  (o.teams || []).forEach(t => (t.members || []).forEach(id => {
    if (!seen.has(id)) seen.set(id, new Set());
    seen.get(id).add(t.id);
  }));
  const dups = [];
  for (const [mid, set] of seen) if (set.size > 1) dups.push({ memberId: mid, teams: [...set] });
  return dups;
}

/** Construit une liste de mouvements {memberId, fromTeamId|null, toTeamId|null} */
export function planAutoDistribute(orgIn, target = 8) {
  const o = takeOrg(orgIn);
  const sizes = computeSizes(o);
  const diff = [];

  // 1) Distribuer les non assignés sur les équipes les moins chargées
  const unassigned = [...(o.unassigned || [])];
  while (unassigned.length) {
    const to = (o.teams || []).reduce((best, t) => {
      if (!best) return t;
      const a = sizes[t.id] ?? 0;
      const b = sizes[best.id] ?? 0;
      return a < b ? t : best;
    }, null);
    if (!to) break;
    const memberId = unassigned.shift();
    sizes[to.id] = (sizes[to.id] ?? 0) + 1;
    diff.push({ memberId, fromTeamId: null, toTeamId: to.id });
  }

  // 2) Équilibrer grossièrement (de la plus grosse à la plus petite)
  const teams = [...(o.teams || [])];
  function pickMovableMember(team) {
    // Choisir un membre non capo à déplacer
    const arr = (team.members || []).filter(id => id !== team.capo);
    return arr[arr.length - 1]; // dernier
  }

  let guard = 0;
  while (guard++ < 500) {
    const sorted = [...teams].sort((a, b) => (sizes[b.id] ?? 0) - (sizes[a.id] ?? 0));
    const big = sorted[0], small = sorted[sorted.length - 1];
    if (!big || !small) break;
    const gap = (sizes[big.id] ?? 0) - (sizes[small.id] ?? 0);
    if (gap <= 1 && (sizes[big.id] ?? 0) <= target) break;
    const movable = pickMovableMember(big);
    if (!movable) break;
    sizes[big.id] -= 1;
    sizes[small.id] += 1;
    diff.push({ memberId: movable, fromTeamId: big.id, toTeamId: small.id });
  }

  return diff;
}

export function planBalance(orgIn, target = 8) {
  const o = takeOrg(orgIn);
  const sizes = computeSizes(o);
  const teams = [...(o.teams || [])];
  const diff = [];

  function pickMovableMember(team) {
    const arr = (team.members || []).filter(id => id !== team.capo);
    return arr[arr.length - 1];
  }

  let guard = 0;
  while (guard++ < 500) {
    const sorted = [...teams].sort((a, b) => (sizes[b.id] ?? 0) - (sizes[a.id] ?? 0));
    const big = sorted[0], small = sorted[sorted.length - 1];
    if (!big || !small) break;
    const gap = (sizes[big.id] ?? 0) - (sizes[small.id] ?? 0);
    if (gap <= 1) break;
    const movable = pickMovableMember(big);
    if (!movable) break;
    sizes[big.id] -= 1;
    sizes[small.id] += 1;
    diff.push({ memberId: movable, fromTeamId: big.id, toTeamId: small.id });
  }

  return diff;
}

export function applyDiff(diff) {
  if (!Array.isArray(diff) || diff.length === 0) return;
  historyCapture();
  diff.forEach(step => moveMember(step.memberId, step.toTeamId || null));
}
