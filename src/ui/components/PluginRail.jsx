// Rangée des Plugins possédés, en cartes à puce. Un Plugin qui se déclenche s'allume.

import { PLUGINS, RULES } from "../../domain/index.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { PluginChip, PluginMini, PluginTip } from "./PluginCard.jsx";

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
        <span className="dim small">Survole une puce pour voir son effet.</span>
      </div>
      <div className="puce-rail">
        {Array.from({ length: slots }, (_, index) => {
          const id = pluginIds[index];
          return id ? (
            <Tooltip key={id} content={<PluginTip id={id} />} className="puce-wrap">
              <button className="puce-rail-btn" onClick={() => onOpen(id)} aria-label={PLUGINS[id].name}>
                <PluginChip id={id} order={index + 1} pulse={fired.includes(id)} />
              </button>
            </Tooltip>
          ) : (
            <div key={`empty${index}`} className="puce-empty"><span>Libre</span></div>
          );
        })}
      </div>
    </section>
  );
}
