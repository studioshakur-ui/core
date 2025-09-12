// src/shared/catalogStore.js
const KEY = "catalog";

export function loadCatalog() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCatalog(catalog) {
  try {
    localStorage.setItem(KEY, JSON.stringify(catalog));
  } catch (e) {
    console.error("Errore salvataggio catalogo:", e);
  }
}
