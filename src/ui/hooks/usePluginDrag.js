// Glisser-déposer des Plugins du rail (souris et doigt) pour changer leur ordre.
// Un appui court = toucher (ouvre la fiche) ; un appui qui bouge = glisser.
// Chaque puce porte data-plugin-index ; on dépose sur la puce visée.

import { useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD = 8;

const indexAt = (x, y) => {
  const target = document.elementFromPoint(x, y)?.closest("[data-plugin-index]");
  return target ? Number(target.dataset.pluginIndex) : null;
};

/**
 * @param {object} options
 * @param {boolean} options.locked  pas de glisser pendant un déploiement
 * @param {(id: string) => void} options.onTap
 * @param {(from: number, to: number) => void} options.onMove
 */
export function usePluginDrag({ locked, onTap, onMove }) {
  const [drag, setDrag] = useState(null);
  const press = useRef(null);
  const dragRef = useRef(null);
  const handlers = useRef({ onTap, onMove });
  handlers.current = { onTap, onMove };
  const update = (next) => { dragRef.current = next; setDrag(next); };

  useEffect(() => {
    const move = (event) => {
      const start = press.current;
      if (!start || event.pointerId !== start.pointerId) return;
      const current = dragRef.current;
      if (!current) {
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD) return;
        const box = start.element.getBoundingClientRect();
        update({ id: start.id, from: start.index, x: event.clientX, y: event.clientY, dx: start.x - box.left, dy: start.y - box.top, over: indexAt(event.clientX, event.clientY) });
        return;
      }
      event.preventDefault();
      update({ ...current, x: event.clientX, y: event.clientY, over: indexAt(event.clientX, event.clientY) });
    };
    const finish = (event, cancelled) => {
      const start = press.current;
      if (!start || event.pointerId !== start.pointerId) return;
      press.current = null;
      const current = dragRef.current;
      update(null);
      if (cancelled) return;
      if (!current) { handlers.current.onTap(start.id); return; }
      const target = indexAt(event.clientX, event.clientY);
      if (target !== null && target !== current.from) handlers.current.onMove(current.from, target);
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

  /** À mettre sur chaque puce : onPointerDown. */
  const dragProps = (id, index) => ({
    "data-plugin-index": index,
    onPointerDown: (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (locked) { handlers.current.onTap(id); return; }
      press.current = { id, index, pointerId: event.pointerId, x: event.clientX, y: event.clientY, element: event.currentTarget };
    },
    onClick: (event) => event.preventDefault(),
    onKeyDown: (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handlers.current.onTap(id); } },
  });

  return { drag, dragProps };
}
