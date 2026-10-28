// Le Terminal sur ordinateur : les commandes en petites cartes. On touche une carte : elle se lève ;
// UTILISER la lance (comme les consommables de Balatro).

import { useEffect, useState } from "react";
import { COMMANDS } from "../../domain/index.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { CommandCard, CommandTip } from "./CommandCard.jsx";
import { commandUsable } from "./TerminalRail.jsx";

export function TerminalTray({ view, locked = false, onUse }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => { if (selected !== null && !view.commands[selected]) setSelected(null); }, [view.commands, selected]);
  const ready = selected !== null && view.commands[selected] && commandUsable(view, view.commands[selected]);
  const use = () => { const slot = selected; setSelected(null); onUse(slot); };
  return (
    <section className="gd-pan gd-terminal" aria-label="Terminal">
      <header className="gd-panel-head"><span className="gd-label">Terminal · {view.commands.length}/{view.commandSlots}</span></header>
      <div className="gd-terminal-cards">
        {Array.from({ length: view.commandSlots }, (_, slot) => {
          const id = view.commands[slot];
          if (!id) return <span key={`empty${slot}`} className="gd-free">Libre</span>;
          return (
            <Tooltip key={`${slot}${id}`} content={<CommandTip id={id} />} className="gd-terminal-wrap">
              <button
                type="button"
                className={`gd-mini-cmd ${selected === slot ? "up" : ""} ${commandUsable(view, id) ? "" : "off"}`}
                disabled={locked}
                aria-pressed={selected === slot}
                aria-label={`Commande ${id} : ${COMMANDS[id].text}`}
                onClick={() => setSelected(selected === slot ? null : slot)}
              >
                <CommandCard id={id} />
              </button>
            </Tooltip>
          );
        })}
        <button type="button" className="gd-use" onClick={use} disabled={locked || !ready}>Utiliser</button>
      </div>
    </section>
  );
}
