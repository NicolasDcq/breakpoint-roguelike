// Adaptateur : préférences du joueur dans le navigateur.

import { safeStorage } from "./safeStorage.js";

export class LocalPreferenceStore {
  constructor({ prefix = "breakpoint.parc.", storage = safeStorage() } = {}) {
    this.prefix = prefix;
    this.storage = storage;
  }

  get(key) {
    return this.storage.get(this.prefix + key);
  }

  set(key, value) {
    this.storage.set(this.prefix + key, value);
  }
}
