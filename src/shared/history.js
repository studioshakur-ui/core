import { loadOrg, saveOrg } from "@/shared/orgStore.js";

const K = "core_history";
function read() {
  try { return JSON.parse(sessionStorage.getItem(K)) || { undo: [], redo: [] }; }
  catch { return { undo: [], redo: [] }; }
}
function write(s) { sessionStorage.setItem(K, JSON.stringify(s)); }

export function historyCapture() {
  const s = read();
  const snap = loadOrg();
  s.undo.push(snap); // limite optionnelle
  if (s.undo.length > 50) s.undo.shift();
  s.redo = [];
  write(s);
}
export function historyUndo() {
  const s = read();
  if (!s.undo.length) return false;
  const prev = s.undo.pop();
  const curr = loadOrg();
  s.redo.push(curr);
  saveOrg(prev);
  write(s);
  return true;
}
export function historyRedo() {
  const s = read();
  if (!s.redo.length) return false;
  const next = s.redo.pop();
  const curr = loadOrg();
  s.undo.push(curr);
  saveOrg(next);
  write(s);
  return true;
}
export const historyCanUndo = () => read().undo.length > 0;
export const historyCanRedo = () => read().redo.length > 0;
