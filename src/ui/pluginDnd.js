// Glisser-déposer des Plugins équipés (ordinateur).
// Réutilise l'action MOVE_PLUGIN pas à pas. Styles : styles/plugin-dnd.css.

let source = null;

function clear() {
  document
    .querySelectorAll(".joker-dnd.drop-before,.joker-dnd.drop-after,.joker-empty.drop-on,.joker-dnd.dragging")
    .forEach((el) => el.classList.remove("drop-before", "drop-after", "drop-on", "dragging"));
}

function drop(to, move) {
  if (!source) return;
  const { from, uid } = source;
  source = null;
  clear();
  const delta = to - from;
  if (!delta) return;
  const step = delta > 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(delta); i++) move(uid, step);
}

// Propriétés à étaler sur l'enveloppe d'un Plugin équipé.
export function pluginDrag(index, total, uid, move, locked) {
  return {
    className: "joker-dnd",
    draggable: !locked,
    onDragStart(e) {
      if (locked) return;
      source = { uid, from: index };
      try {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      } catch { }
      const el = e.currentTarget;
      setTimeout(() => el.classList.add("dragging"), 0);
    },
    onDragOver(e) {
      if (!source) return;
      e.preventDefault();
      try {
        e.dataTransfer.dropEffect = "move";
      } catch { }
      const el = e.currentTarget;
      if (source.from === index) return;
      el.classList.toggle("drop-before", index < source.from);
      el.classList.toggle("drop-after", index > source.from);
    },
    onDragLeave(e) {
      const el = e.currentTarget;
      if (!el.contains(e.relatedTarget)) el.classList.remove("drop-before", "drop-after");
    },
    onDrop(e) {
      e.preventDefault();
      drop(index, move);
    },
    onDragEnd() {
      source = null;
      clear();
    },
  };
}

// Propriétés pour un emplacement vide : y déposer place le Plugin en dernier.
export function pluginDropZone(total, move) {
  return {
    onDragOver(e) {
      if (!source) return;
      e.preventDefault();
      e.currentTarget.classList.add("drop-on");
    },
    onDragLeave(e) {
      e.currentTarget.classList.remove("drop-on");
    },
    onDrop(e) {
      e.preventDefault();
      drop(total - 1, move);
    },
  };
}
