const ORG_KEY = "core_org";

const uuid = () =>
  (globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now());

const _norm = (s) => String(s ?? "").trim();
const _toTitle = (name) =>
  _norm(name).toLowerCase().replace(/\b([a-zà-ÿ])/g, (m) => m.toUpperCase());

export function loadOrg() {
  const raw = localStorage.getItem(ORG_KEY);
  if (!raw) {
    const empty = { members: [], teams: [], unassigned: [], suspects: [] };
    localStorage.setItem(ORG_KEY, JSON.stringify(empty));
    return empty;
  }
  try {
    const obj = JSON.parse(raw);
    return {
      members: Array.isArray(obj.members) ? obj.members : [],
      teams: Array.isArray(obj.teams) ? obj.teams : [],
      unassigned: Array.isArray(obj.unassigned) ? obj.unassigned : [],
      suspects: Array.isArray(obj.suspects) ? obj.suspects : [],
    };
  } catch {
    localStorage.removeItem(ORG_KEY);
    const empty = { members: [], teams: [], unassigned: [], suspects: [] };
    localStorage.setItem(ORG_KEY, JSON.stringify(empty));
    return empty;
  }
}
export function saveOrg(org) { localStorage.setItem(ORG_KEY, JSON.stringify(org)); return org; }

const teamIndex = (org, id) => (org.teams || []).findIndex((t) => t.id === id);

export function addMember({ name, role } = {}) {
  const org = loadOrg();
  const m = { id: uuid(), name: _toTitle(name || "Senza nome"), role: role || "Altro" };
  org.members.push(m);
  org.unassigned = org.unassigned || [];
  if (!org.unassigned.includes(m.id)) org.unassigned.push(m.id);
  saveOrg(org);
  return m;
}
export function removeMember(memberId) {
  const org = loadOrg();
  org.members = (org.members || []).filter((m) => m.id !== memberId);
  (org.teams || []).forEach((t) => {
    t.members = (t.members || []).filter((id) => id !== memberId);
    if (t.capo === memberId) t.capo = undefined;
  });
  org.unassigned = (org.unassigned || []).filter((id) => id !== memberId);
  saveOrg(org); return org;
}
export function addTeam(name = "capo") {
  const org = loadOrg();
  const t = { id: uuid(), name, members: [], capo: undefined };
  org.teams.push(t); saveOrg(org); return t;
}
export function removeTeam(teamId) {
  const org = loadOrg();
  const team = (org.teams || []).find((t) => t.id === teamId);
  if (team) {
    org.unassigned = org.unassigned || [];
    (team.members || []).forEach((id) => {
      if (!org.unassigned.includes(id)) org.unassigned.push(id);
    });
  }
  org.teams = (org.teams || []).filter((t) => t.id !== teamId);
  saveOrg(org); return org;
}
export function editTeam(id, patch = {}) {
  const org = loadOrg();
  const i = teamIndex(org, id);
  if (i >= 0) { org.teams[i] = { ...org.teams[i], ...patch }; saveOrg(org); }
  return org;
}
export function moveMember(memberId, teamId) {
  const org = loadOrg();
  (org.teams || []).forEach((t) => { t.members = (t.members || []).filter((id) => id !== memberId); });
  if (teamId) {
    const t = (org.teams || []).find((x) => x.id === teamId);
    if (t) { t.members = t.members || []; if (!t.members.includes(memberId)) t.members.push(memberId); }
    org.unassigned = (org.unassigned || []).filter((id) => id !== memberId);
  } else {
    org.unassigned = org.unassigned || [];
    if (!org.unassigned.includes(memberId)) org.unassigned.push(memberId);
  }
  saveOrg(org); return org;
}
export function getMemberById(id) { const org = loadOrg(); return (org.members || []).find((m) => m.id === id); }

export function findMemberByName(name) {
  const key = _toTitle(name);
  const org = loadOrg();
  return (org.members || []).find((m) => _toTitle(m.name) === key);
}
export function ensureMember(name, role) { const ex = findMemberByName(name); return ex || addMember({ name: _toTitle(name), role }); }
export function ensureTeamByCapoName(capoName) {
  const org = loadOrg();
  const capo = ensureMember(capoName, "Capo");
  let team = (org.teams || []).find((t) => t.capo === capo.id);
  if (!team) {
    team = addTeam("capo"); moveMember(capo.id, team.id); editTeam(team.id, { capo: capo.id });
  }
  return { team, capo };
}
export function unsetCapo(teamId) { return editTeam(teamId, { capo: undefined }); }
export function addCapo(name) { const { team, capo } = ensureTeamByCapoName(name); return { team, capo }; }
export function deleteCapo(memberId) { return removeMember(memberId); }

/* Nettoyage (détecte faux noms) */
const _upperRatio = (s) => { const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, ""); if (!letters) return 0; const upp = letters.replace(/[^A-ZÀ-Ü]/g, ""); return upp.length / letters.length; };
const _STOP = ["APP","AREA","CABINA","CABINE","COLLEGAMENTI","COLLEGAMENTO","COMPLETAMENTI","FUORI","MOTORE","PAX","QUADRO","MAGAZZINO","OFFICINA","TOT","PERSONE","COSTR","TEST","CP","ELETTRICA","COMODINI","FINALE","NOTE"];
const _isLikelyPerson = (s) => { const v=_norm(s); if(!v||/\d/.test(v))return false; const parts=v.split(/\s+/).filter(Boolean); if(parts.length<2)return false; if(_upperRatio(v)>0.8)return false; if(_STOP.some((w)=>v.toUpperCase().includes(w)))return false; if(parts.some((p)=>p.length>20))return false; return true; };
export function cleanseOrg() {
  const org = loadOrg(); if (!org || !Array.isArray(org.members)) return org;
  const validIds = new Set(); const suspects = []; const newMembers = [];
  for (const m of org.members) { const name = _norm(m?.name); if (_isLikelyPerson(name)) { newMembers.push(m); validIds.add(m.id); } else { suspects.push({ id: m.id, name, role: m.role }); } }
  (org.teams || []).forEach((t) => { t.members = (t.members || []).filter((id) => validIds.has(id)); if (!validIds.has(t.capo)) t.capo = undefined; });
  org.unassigned = (org.unassigned || []).filter((id) => validIds.has(id));
  org.members = newMembers; org.suspects = suspects; saveOrg(org); return org;
}

const orgStore = { loadOrg, saveOrg, addMember, removeMember, addTeam, removeTeam, editTeam, moveMember, getMemberById, findMemberByName, ensureMember, ensureTeamByCapoName, unsetCapo, addCapo, deleteCapo, cleanseOrg };
export default orgStore;
