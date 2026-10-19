// Accès prudent au localStorage : il peut être absent ou refuser (navigation privée).

export function safeStorage(storage = globalThis.localStorage) {
  return {
    get(key) {
      try { return storage?.getItem(key) ?? null; } catch { return null; }
    },
    set(key, value) {
      try { storage?.setItem(key, value); } catch { /* stockage indisponible : on continue sans */ }
    },
    remove(key) {
      try { storage?.removeItem(key); } catch { /* stockage indisponible */ }
    },
  };
}
