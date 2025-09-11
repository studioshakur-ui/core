// src/shared/history.js
import { loadOrg, saveOrg } from "@/shared/orgStore.js";

const HK = "core_org_hist_v1";
const CLAMP = 50;

function read() {
  try {
    return JSON.parse(localStorage.getItem(HK)) || { past: [], future: [] };
  } catch {
    return { past: [], future: [] };
  }
}
function write(h) {
  localStorage.setItem(HK, JSON.stringify(h));
}

export function historyInit() {
  if (!localStorage.getItem(HK)) write({ past: [], future: [] });
}

export function historyCapture() {
  const h = read();
  const snap = JSON.stringify(loadOrg());
  h.past.push(snap);
  if (h.past.length > CLAMP) h.past = h.past.slice(-CLAMP);
  h.future = []; // couper redo
  write(h);
}

export function historyUndo() {
  const h = read();
  if (!h.past.length) return false;
  const current = JSON.stringify(loadOrg());
  const prev = h.past.pop();
  h.future.push(current);
  write(h);
  saveOrg(JSON.parse(prev));
  return true;
}

export function historyRedo() {
  const h = read();
  if (!h.future.length) return false;
  const current = JSON.stringify(loadOrg());
  const next = h.future.pop();
  h.past.push(current);
  write(h);
  saveOrg(JSON.parse(next));
  return true;
}

export const historyCanUndo = () => read().past.length > 0;
export const historyCanRedo = () => read().future.length > 0;
export function historyReset() { write({ past: [], future: [] }); }
