// Les commandes du Terminal en cartes à puce : écran de terminal noir, nom, effet.
// Pas de rareté (toutes les commandes se valent) et pas de broches dorées : c'est du logiciel.

import { COMMANDS } from "../../domain/index.js";
import { FX } from "../fx.jsx";
import { COMMAND_CODE, screenSize } from "../terminal/commandLook.js";

/** Carte complète (boutique sur téléphone, fiches). */
export function CommandCard({ id, className = "" }) {
  const command = COMMANDS[id];
  return (
    <div className={`cmd-card ${className}`}>
      <span className="cmd-code">{COMMAND_CODE[id]}</span>
      <span className="cmd-die">
        <span className="cmd-tag">COMMANDE</span>
        <span className="cmd-scr" style={{ fontSize: screenSize(command.name) }}>{command.name}</span>
      </span>
      <span className="cmd-name">{command.name}</span>
      <span className="cmd-text"><span>{FX(command.text)}</span></span>
    </div>
  );
}

/** Carte de taille fixe pour l'ordinateur : l'écran et le nom ; l'effet est dans l'infobulle (CommandTip). */
export function CommandChip({ id }) {
  const command = COMMANDS[id];
  const size = command.name.length > 9 ? 12 : command.name.length > 5 ? 15 : 20;
  return (
    <span className="cmd-chip">
      <span className="cmd-chip-die">
        <span className="cmd-chip-prompt">$</span>
        <span className="cmd-scr" style={{ fontSize: size }}>{command.name}</span>
      </span>
      <span className="cmd-chip-name">{command.name}</span>
    </span>
  );
}

export function CommandTip({ id }) {
  const command = COMMANDS[id];
  return (
    <div className="cmd-tip">
      <span className="cmd-tip-head"><strong>$ {command.name}</strong><span className="cmd-code">{COMMAND_CODE[id]}</span></span>
      <span className="cmd-text"><span>{FX(command.text)}</span></span>
    </div>
  );
}
