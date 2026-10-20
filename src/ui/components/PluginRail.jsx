// Rangée des Plugins possédés, en cartes à puce. Un Plugin qui se déclenche s'allume.

import { RULES } from "../../domain/index.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { PluginCard, PluginMini, PluginTip } from "./PluginCard.jsx";

export function PluginRail({ pluginIds, fired = [], compact, onOpen }) {
  const slots = RULES.maxPlugins;
  if (compact) {
    return (
      <section className="puce-rail compact" aria-label="Plugins">
        {Array.from({ length: slots }, (_, index) => {
          const id = pluginIds[index];
          return id ? (
            <button key={id} className="puce-rail-btn" onClick={() => onOpen(id)} aria-label={`Plugin ${index + 1}`}>
              <PluginMini id={id} order={index + 1} pulse={fired.includes(id)} />
            </button>
          ) : (
            <span key={`empty${index}`} className="puce-empty" aria-hidden="true" />
          );
        })}
      </section>
    );
  }
  return (
    <section className="joker-rail puce-rail-desk" aria-label="Plugins">
      <div className="rail-label">
        <span>Plugins</span>
        <span className="num small">{pluginIds.length}/{slots}</span>
        <span className="dim small">Effets permanents. La boutique en propose après chaque contrat.</span>
      </div>
      <div className="puce-rail">
        {Array.from({ length: slots }, (_, index) => {
          const id = pluginIds[index];
          return id ? (
            <Tooltip key={id} content={<PluginTip id={id} />} className="puce-wrap">
              <PluginCard id={id} order={index + 1} pulse={fired.includes(id)} className="in-rail" />
            </Tooltip>
          ) : (
            <div key={`empty${index}`} className="puce-empty"><span>Emplacement libre</span></div>
          );
        })}
      </div>
    </section>
  );
}
