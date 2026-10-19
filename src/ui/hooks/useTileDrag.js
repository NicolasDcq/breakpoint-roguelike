// Glisser-déposer des tuiles (souris et doigt).
// Un appui court = toucher (ouvre la fiche) ; un appui qui bouge = glisser.
// Les zones de dépôt portent data-drop="cell" (avec data-slot) ou data-drop="hand".

import { useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD = 6;

function dropTargetAt(x, y) {
  const zone = document.elementFromPoint(x, y)?.closest("[data-drop]");
  if (!zone) return null;
  return zone.dataset.drop === "hand" ? { kind: "hand" } : { kind: "cell", cell: Number(zone.dataset.slot) };
}

/**
 * @param {object} options
 * @param {boolean} options.locked
 * @param {(source: object) => void} options.onTap
 * @param {(source: object, target: object|null) => void} options.onDrop
 */
export function useTileDrag({ locked, onTap, onDrop }) {
  const [drag, setDrag] = useState(null);
  const press = useRef(null);
  const dragRef = useRef(null);
  const handlers = useRef({ onTap, onDrop });
  handlers.current = { onTap, onDrop };

  const update = (next) => { dragRef.current = next; setDrag(next); };

  useEffect(() => {
    const move = (event) => {
      const start = press.current;
      if (!start || event.pointerId !== start.id) return;
      const current = dragRef.current;
      if (!current) {
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD) return;
        const box = start.element.getBoundingClientRect();
        update({ source: start.source, x: event.clientX, y: event.clientY, dx: start.x - box.left, dy: start.y - box.top, width: box.width, height: box.height, over: dropTargetAt(event.clientX, event.clientY) });
        return;
      }
      event.preventDefault();
      update({ ...current, x: event.clientX, y: event.clientY, over: dropTargetAt(event.clientX, event.clientY) });
    };
    const finish = (event, cancelled) => {
      const start = press.current;
      if (!start || event.pointerId !== start.id) return;
      press.current = null;
      const current = dragRef.current;
      update(null);
      if (cancelled) return;
      if (current) handlers.current.onDrop(current.source, dropTargetAt(event.clientX, event.clientY));
      else handlers.current.onTap(start.source);
    };
    const up = (event) => finish(event, false);
    const cancel = (event) => finish(event, true);
    const escape = (event) => { if (event.key === "Escape" && dragRef.current) { press.current = null; update(null); } };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("is-dragging", drag !== null);
    return () => document.body.classList.remove("is-dragging");
  }, [drag !== null]);

  /** Props à poser sur une tuile qu'on peut toucher et glisser. */
  const dragProps = (source) => ({
    onPointerDown: (event) => {
      if (locked || event.button !== 0) return;
      press.current = { source, x: event.clientX, y: event.clientY, id: event.pointerId, element: event.currentTarget };
    },
    onDragStart: (event) => event.preventDefault(),
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handlers.current.onTap(source); }
    },
  });

  return { drag, dragProps };
}
