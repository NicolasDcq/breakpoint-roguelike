// Le rail du Terminal en partie : les commandes qu'on possède, juste sous les Plugins.
// On touche une commande pour l'ouvrir. Une commande grisée ne s'utilise qu'entre deux contrats.

import { COMMANDS } from "../../domain/index.js";

/** Une commande est utilisable à cette étape ; « !! » dépend de la dernière commande utilisée. */
export function commandUsable(view, id) {
  const effective = COMMANDS[id].repeats ? view.lastCommand : id;
  return Boolean(effective) && COMMANDS[id].phases.includes(view.phase) && COMMANDS[effective].phases.includes(view.phase);
}

export function TerminalRail({ view, locked = false, onUse }) {
  return (
    <section className="cmd-rail" aria-label="Terminal">
      <span className="cmd-rail-label">Terminal <span className="num">{view.commands.length}/{view.commandSlots}</span></span>
      {Array.from({ length: view.commandSlots }, (_, slot) => {
        const id = view.commands[slot];
        if (!id) return <span key={`empty${slot}`} className="cmd-rail-empty" aria-hidden="true" />;
        return (
          <button
            key={`${slot}${id}`}
            type="button"
            className={`cmd-rail-btn ${commandUsable(view, id) ? "" : "off"}`}
            disabled={locked}
            onClick={() => onUse(slot)}
            aria-label={`Commande ${id}`}
            title={COMMANDS[id].text}
          >
            <i>$</i> {id}
          </button>
        );
      })}
    </section>
  );
}
