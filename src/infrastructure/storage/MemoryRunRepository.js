// Adaptateur en mémoire : pour les tests et le bot.

export class MemoryRunRepository {
  constructor(snapshot = null) {
    this.snapshot = snapshot;
  }

  load() {
    return this.snapshot;
  }

  save(snapshot) {
    this.snapshot = snapshot;
  }

  clear() {
    this.snapshot = null;
  }
}
