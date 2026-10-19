// Le plateau et, en dessous (ou à droite), la main.
// Glisser une carte de la main vers une case la pose ; glisser un module posé le déplace
// (ou l'échange) ; le glisser vers la main le reprend. Toucher une tuile ouvre sa fiche.

import { createPortal } from "react-dom";
import { BOSSES, CELLS, GRID_SIZE, MODULES } from "../../domain/index.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { tileClasses } from "../visuals.js";
import { TRACE_HEIGHT, TRACE_WIDTH, busPath, returnPaths, slotX, slotY } from "./boardGeometry.js";
import { ModuleFace, ModuleTip } from "./ModuleFace.jsx";

function Popups({ pops, className = "" }) {
  return pops.map((pop) => (
    <div key={pop.key} className={`popup ${className}`}>
      {pop.lines.map((line, index) => <span key={index} className={`pop-${line.tone}`}>{line.text}</span>)}
    </div>
  ));
}

const isSource = (drag, kind, uid) => drag?.source.kind === kind && drag.source.uid === uid;

function Hand({ view, marked, locked, drag, dragProps }) {
  const over = drag?.over?.kind === "hand" && drag.source.kind === "cell";
  return (
    <div className={`drawer-row hand-row ${over ? "drop-over" : ""}`} data-drop="hand">
      <span className="drawer-label">Main · {view.hand.length} · pioche {view.drawCount} · posés {view.placedCount}/{view.limits.maxPlaced}</span>
      <div className="drawer-cells" style={{ "--hand": Math.max(view.hand.length, 1) }}>
        {view.hand.map((card) => (
          <div key={card.uid} className={`slot drawer-slot filled ${marked.includes(card.uid) ? "picked" : ""}`}>
            <Tooltip content={<ModuleTip card={card} />} disabled={locked || Boolean(drag)} className="tile-wrap">
              <div
                className={`${tileClasses(card)} ${isSource(drag, "hand", card.uid) ? "drag-source" : ""}`}
                tabIndex={0}
                role="button"
                aria-label={`${MODULES[card.moduleId].name}, niveau ${card.level}, dans ta main. Toucher pour voir sa fiche, glisser pour le poser.`}
                {...dragProps({ kind: "hand", uid: card.uid })}
              >
                <ModuleFace card={card} />
              </div>
            </Tooltip>
          </div>
        ))}
        {!view.hand.length && <span className="hand-empty dim small">Main vide</span>}
      </div>
    </div>
  );
}

export function BoardView({ view, marked, animation, locked, drag, dragProps }) {
  const blockedCell = BOSSES[view.contract.boss]?.blockedCell;
  const highlight = animation?.highlight ?? (view.placedCount && view.preview.architecture.id !== "monolithe" ? view.preview.architecture.members : []);
  const activeCell = animation?.firing?.cell ?? null;
  const pops = animation?.pops ?? [];
  const draggedCard = drag ? (drag.source.kind === "hand" ? view.hand : view.board).find((card) => card?.uid === drag.source.uid) : null;
  const handFull = drag?.source.kind === "hand" && view.placedCount >= view.limits.maxPlaced;
  return (
    <div className={`board ${locked ? "running" : ""}`} style={{ "--grid": GRID_SIZE }}>
      <Hand view={view} marked={marked} locked={locked} drag={drag} dragProps={dragProps} />
      <svg className="trace" viewBox={`0 0 ${TRACE_WIDTH} ${TRACE_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
        <path className="trace-bus" d={busPath()} />
        {returnPaths().map((path) => <path key={path} className="trace-return" d={path} />)}
        {activeCell !== null && <circle className="trace-dot" cx={slotX(activeCell)} cy={slotY(activeCell)} r={7} />}
      </svg>
      <div className="slots">
        {CELLS.map((cell) => {
          const card = view.board[cell];
          const over = drag?.over?.kind === "cell" && drag.over.cell === cell;
          const allowed = !(handFull && !card);
          const classes = [
            "slot",
            card && "filled",
            blockedCell === cell && "broken",
            card && highlight.includes(card.uid) && "in-arch",
            activeCell === cell && "active",
            drag && allowed && "droppable",
            over && (allowed ? "dragover" : "nodrop"),
          ].filter(Boolean).join(" ");
          return (
            <div key={cell} className={classes} data-slot={cell} data-drop="cell">
              <span className="slot-order">{cell + 1}</span>
              {blockedCell === cell && <span className="broken-label">En panne</span>}
              {card ? (
                <Tooltip content={<ModuleTip card={card} />} disabled={locked || Boolean(drag)} className="tile-wrap">
                  <div
                    className={`${tileClasses(card)} ${isSource(drag, "cell", card.uid) ? "drag-source" : ""}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${MODULES[card.moduleId].name} niveau ${card.level}, case ${cell + 1}. Toucher pour voir sa fiche, glisser pour le déplacer.`}
                    {...dragProps({ kind: "cell", uid: card.uid, cell })}
                  >
                    <ModuleFace card={card} />
                  </div>
                </Tooltip>
              ) : (
                <span className="slot-empty">{over && allowed ? "Poser ici" : ""}</span>
              )}
              <Popups pops={pops.filter((pop) => pop.cell === cell)} />
            </div>
          );
        })}
      </div>
      <Popups pops={pops.filter((pop) => pop.cell === null)} className="arch-pop" />
      {drag && draggedCard && createPortal(
        <div className={`${tileClasses(draggedCard)} drag-ghost`} style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.width, height: drag.height }} aria-hidden="true">
          <ModuleFace card={draggedCard} />
        </div>,
        document.body,
      )}
    </div>
  );
}
