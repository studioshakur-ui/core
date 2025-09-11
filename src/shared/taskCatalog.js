/* ====== Catalogo globale delle attività ======
   Storage keys:
   - core_task_base_ver, core_task_base_v1
   - core_task_custom
   - core_task_fav_<capo>
   - core_task_lock (boolean: se true, blocca aggiunte locali dei Capo)
================================================ */

const BASE_VERSION = "v2";

/* Tâches de base initiales */
const BASE_TASKS = [
  { code: "IMPLM-STE", title: "Stesura direttiva IMPLM", prodotto: "mt", um: "mt", previsto: "350", note: "" },
  { code: "CAB-RIP",   title: "Ripresa cavi (alimenti)", prodotto: "mt", um: "mt", previsto: "0.20", note: "" },
  { code: "UTE-MONT",  title: "Montaggio utenza (lampade, prese, INT e CX)", prodotto: "pz", um: "pz", previsto: "24", note: "" },
  { code: "UTE-COLL",  title: "Collegamento (lampade, prese, INT e CX)", prodotto: "cavi", um: "pz", previsto: "40", note: "CX" },
  { code: "UTE-CUC",   title: "Stesura cucito utenze", prodotto: "pz", um: "pz", previsto: "20", note: "" },
  { code: "FIB-SDCN",  title: "Stesura fibre SDCN", prodotto: "mt", um: "mt", previsto: "300", note: "" },
  { code: "FIB-GSP-C", title: "Collegamento fibre GSP", prodotto: "cx", um: "cx", previsto: "12", note: "" },
  { code: "STQ-COLL",  title: "Collegamento STQ", prodotto: "", um: "", previsto: "50", note: "" },
  { code: "BUS-GIUN",  title: "Collegamento giunti BUS BAR", prodotto: "", um: "", previsto: "8.0", note: "" },
  { code: "BUS-SPINA", title: "Collegamento spina BUS BAR", prodotto: "", um: "", previsto: "60.0", note: "" },
  { code: "MAG-VARI",  title: "Vari magazzino / supporto", prodotto: "", um: "", previsto: "", note: "" },
];

/* ---------- Storage helpers ---------- */
const rj = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const wj = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- Init base ---------- */
function ensureBase() {
  const ver = localStorage.getItem("core_task_base_ver");
  if (ver !== BASE_VERSION) {
    wj("core_task_base_v1", BASE_TASKS);
    localStorage.setItem("core_task_base_ver", BASE_VERSION);
  }
}

/* ---------- Public getters ---------- */
export function getBaseTasks() { ensureBase(); return rj("core_task_base_v1", []); }
export function getCustomTasks() { return rj("core_task_custom", []); }
export function getAllTasks(){ const all=[...getBaseTasks(),...getCustomTasks()]; return all.map(ensureShape); }

/* ---------- Search ---------- */
export function searchTasks(q) {
  const s = (q || "").trim().toLowerCase();
  if (!s) return getAllTasks();
  return getAllTasks().filter(t =>
    (t.title || "").toLowerCase().includes(s) ||
    (t.code || "").toLowerCase().includes(s)
  );
}

/* ---------- CRUD custom ---------- */
export function addCustomTask(task) {
  if (!task?.code) return false;
  const all = getAllTasks();
  if (all.some(t => t.code === task.code)) return false;
  const custom = getCustomTasks();
  custom.push(task);
  wj("core_task_custom", custom);
  return true;
}
export function updateTask(task, scope = "base") {
  if (!task?.code) return false;
  const key = scope === "base" ? "core_task_base_v1" : "core_task_custom";
  const list = rj(key, []);
  const i = list.findIndex(t => t.code === task.code);
  if (i >= 0) list[i] = task; else list.push(task);
  wj(key, list);
  return true;
}
export function deleteTask(code, scope = "custom") {
  const key = scope === "base" ? "core_task_base_v1" : "core_task_custom";
  const list = rj(key, []);
  wj(key, list.filter(t => t.code !== code));
}

/* ---------- Approve (custom -> base) ---------- */
export function approveToBase(code) {
  const custom = getCustomTasks();
  const t = custom.find(x => x.code === code);
  if (!t) return false;
  // retirer du custom
  wj("core_task_custom", custom.filter(x => x.code !== code));
  // ajouter/écraser en base
  const base = getBaseTasks();
  const idx = base.findIndex(x => x.code === code);
  if (idx >= 0) base[idx] = t; else base.push(t);
  wj("core_task_base_v1", base);
  return true;
}

/* ---------- Favoris par capo ---------- */
export function getFavs(capo) { return rj(`core_task_fav_${capo || "anon"}`, []); }
export function toggleFav(capo, code) {
  const key = `core_task_fav_${capo || "anon"}`;
  const s = new Set(rj(key, []));
  s.has(code) ? s.delete(code) : s.add(code);
  const arr = Array.from(s);
  wj(key, arr);
  return arr;
}

/* ---------- Lock global (empêche ajout côté Capo) ---------- */
export function isLocked() { return rj("core_task_lock", false) === true; }
export function setLocked(v) { localStorage.setItem("core_task_lock", JSON.stringify(!!v)); }


/* ---- shape normalizer (v2) ---- */
function ensureShape(t){
  return {
    code: t.code,
    title: t.title,
    prodotto: t.prodotto ?? "",
    um: t.um ?? "",
    previsto: t.previsto ?? "",
    previstoPerPersona: t.previstoPerPersona ?? "",
    note: t.note ?? ""
  };
}

