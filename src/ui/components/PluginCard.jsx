// Carte d'un Plugin (rail, boutique) et puce compacte (téléphone).

import { PLUGINS } from "../../domain/index.js";
import { PLUGIN_LOOK, RARITY_LABELS } from "../visuals.js";
import { FX } from "../fx.jsx";

const look = (id) => PLUGIN_LOOK[id] ?? { emoji: "🔌", hue: ["#26305a", "#5a6aa0"] };

export function PluginCard({ id, variant = "rail", order, pulse }) {
  const plugin = PLUGINS[id];
  const { emoji, hue } = look(id);
  return (
    <div className={`joker v-${variant} r-${plugin.rarity} ${pulse ? "pulsing" : ""}`} style={{ "--j1": hue[0], "--j2": hue[1] }}>
      <div className="joker-art" aria-hidden="true">
        <span className="joker-emoji">{emoji}</span>
        <span className="joker-scan" />
      </div>
      <div className="joker-body">
        <div className="joker-title"><span className="joker-name">{plugin.name}</span></div>
        <p className="joker-text">{FX(plugin.text)}</p>
      </div>
      <span className="joker-rarity">{RARITY_LABELS[plugin.rarity]}</span>
      {order !== undefined && <span className="joker-order">{order}</span>}
    </div>
  );
}

export function PluginTip({ id }) {
  return (
    <div className="tip-body">
      <strong>{look(id).emoji} {PLUGINS[id].name}</strong>
      <p>{FX(PLUGINS[id].text)}</p>
    </div>
  );
}

export function PluginChip({ id, order, pulse, onOpen }) {
  const plugin = PLUGINS[id];
  const { emoji, hue } = look(id);
  return (
    <button className={`joker-chip r-${plugin.rarity} ${pulse ? "pulsing" : ""}`} style={{ "--j1": hue[0], "--j2": hue[1] }} onClick={onOpen} aria-label={`${order}. ${plugin.name}`}>
      <span className="chip-order num">{order}</span>
      <span className="chip-emoji" aria-hidden="true">{emoji}</span>
      <span className="chip-name">{plugin.name.replace(/^(Le |La |L’|L'|Les )/, "")}</span>
    </button>
  );
}
