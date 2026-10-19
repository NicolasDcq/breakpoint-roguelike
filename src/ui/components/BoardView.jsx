// Le plateau et, en dessous (ou à droite), la main.
// Toucher une carte de la main la choisit ; toucher une case vide l'y pose ;
// toucher un module posé le reprend.

import { BOSSES, CELLS, GRID_SIZE, MODULES } from "../../domain/index.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { tileClasses } from "../visuals.js";
import { TRACE_HEIGHT, TRACE_WIDTH, busPath, returnPaths, slotX, slotY } from "./boardGeometry.js";
import { ModuleFace, ModuleTip } from "./ModuleFace.jsx";

function Popups({ pops }) {
  return pops.map((pop) => (
    <div key={pop.key} className="popup">
      {pop.lines.map((line, index) => <span key={index} className={`pop-${line.tone}`}>{line.text}</span>)}
    </div>
  ));
}

function Hand({ view, selection, locked, onToggle }) {
  return (
    <div className="drawer-row hand-row">
      <span className="drawer-label">Main · {view.hand.length} · pioche {view.drawCount} · posés {view.placedCount}/{view.limits.maxPlaced}</span>
      <div className="drawer-cells" style={{ "--hand": Math.max(view.hand.length, 1) }}>
        {view.hand.map((card) => {
          const picked = selection.includes(card.uid);
          return (
            <div key={card.uid} className={`slot drawer-slot filled ${picked ? "picked" : ""}`}>
              <Tooltip content={<ModuleTip card={card} />} disabled={locked} className="tile-wrap">
                <button
                  className={tileClasses(card)}
                  disabled={locked}
                  aria-pressed={picked}
                  aria-label={`${MODULES[card.moduleId].name}, niveau ${card.level}, dans ta main`}
                  onClick={() => onToggle(card.uid)}
                >
                  <ModuleFace card={card} />
                </button>
              </Tooltip>
            </div>
          );
        })}
        {!view.hand.length && <span className="hand-empty dim small">Main vide</span>}
      </div>
    </div>
  );
}

export function BoardView({ view, selection, animation, locked, onCell, onToggle }) {
  const blockedCell = BOSSES[view.contract.boss]?.blockedCell;
  const canPlace = selection.length === 1 && view.placedCount < view.limits.maxPlaced && !locked;
  const highlight = animation?.highlight ?? (view.placedCount && view.preview.architecture.id !== "monolithe" ? view.preview.architecture.members : []);
  const activeCell = animation?.firing?.cell ?? null;
  const pops = animation?.pops ?? [];
  return (
    <div className={`board ${locked ? "running" : ""}`} style={{ "--grid": GRID_SIZE }}>
      <Hand view={view} selection={selection} locked={locked} onToggle={onToggle} />
      <svg className="trace" viewBox={`0 0 ${TRACE_WIDTH} ${TRACE_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
        <path className="trace-bus" d={busPath()} />
        {returnPaths().map((path) => <path key={path} className="trace-return" d={path} />)}
        {activeCell !== null && <circle className="trace-dot" cx={slotX(activeCell)} cy={slotY(activeCell)} r={7} />}
      </svg>
      <div className="slots">
        {CELLS.map((cell) => {
          const card = view.board[cell];
          const broken = blockedCell === cell;
          const classes = [
            "slot",
            card && "filled",
            broken && "broken",
            card && highlight.includes(card.uid) && "in-arch",
            activeCell === cell && "active",
            animation?.firing?.cell === cell && animation.firing.failure && "crash-slot",
            !card && canPlace && "droppable",
          ].filter(Boolean).join(" ");
          const act = () => { if (!locked) onCell(cell); };
          return (
            <div key={cell} className={classes} data-slot={cell} onClick={act}>
              <span className="slot-order">{cell + 1}</span>
              {broken && <span className="broken-label">En panne</span>}
              {card ? (
                <Tooltip content={<ModuleTip card={card} />} disabled={locked} className="tile-wrap">
                  <div
                    className={tileClasses(card)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${MODULES[card.moduleId].name} niveau ${card.level}, case ${cell + 1}. Toucher pour le reprendre.`}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); act(); } }}
                  >
                    <ModuleFace card={card} />
                  </div>
                </Tooltip>
              ) : (
                <span className="slot-empty">{canPlace ? "Poser ici" : ""}</span>
              )}
              <Popups pops={pops.filter((pop) => pop.cell === cell)} />
            </div>
          );
        })}
      </div>
      {pops.filter((pop) => pop.cell === null).map((pop) => (
        <div key={pop.key} className="popup arch-pop">
          {pop.lines.map((line, index) => <span key={index} className={`pop-${line.tone}`}>{line.text}</span>)}
        </div>
      ))}
    </div>
  );
}
