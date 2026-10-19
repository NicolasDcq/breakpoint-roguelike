// Adaptateur : sauvegarde de la partie dans le navigateur.

import { safeStorage } from "./safeStorage.js";

export class LocalStorageRunRepository {
  constructor({ key = "breakpoint.parc.run", storage = safeStorage() } = {}) {
    this.key = key;
    this.storage = storage;
  }

  load() {
    const raw = this.storage.get(this.key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  save(snapshot) {
    this.storage.set(this.key, JSON.stringify(snapshot));
  }

  clear() {
    this.storage.remove(this.key);
  }
}
