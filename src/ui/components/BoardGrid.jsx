// Le plateau 3×3. Toucher une case vide y pose la carte choisie ; toucher un module le reprend.

import { BOSSES, CELLS } from "../../domain/index.js";
import { ModuleTile } from "./ModuleTile.jsx";

export function BoardGrid({ view, canPlace, highlight = [], firing = null, pops = [], onCell }) {
  const blockedCell = BOSSES[view.contract.boss]?.blockedCell;
  return (
    <div className="panel board">
      {CELLS.map((cell) => {
        const card = view.board[cell];
        const tileClass = [
          "tile",
          card && highlight.includes(card.uid) ? "incombo" : "",
          firing?.cell === cell ? (firing.failure ? "fizzle" : "firing") : "",
        ].join(" ");
        const act = () => onCell(cell);
        return (
          <div
            key={cell}
            className={`cell ${!card && canPlace ? "target" : ""} ${blockedCell === cell && !card ? "broken" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`Case ${cell + 1}`}
            onClick={act}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); act(); } }}
          >
            {card && <ModuleTile key={`${card.uid}-${firing?.step ?? 0}`} card={card} className={tileClass} />}
            <span className="n">{cell + 1}</span>
            {pops.filter((pop) => pop.cell === cell).map((pop) => (
              <span key={pop.key} className="pop" style={{ background: pop.color, color: pop.failure ? undefined : "var(--ink)" }}>{pop.text}</span>
            ))}
          </div>
        );
      })}
      {pops.filter((pop) => pop.cell === null).map((pop) => <span key={pop.key} className="pop base">{pop.text}</span>)}
    </div>
  );
}
