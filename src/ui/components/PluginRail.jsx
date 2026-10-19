// Rangée des Plugins possédés. Un Plugin qui se déclenche clignote.

import { RULES } from "../../domain/index.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { PluginCard, PluginChip, PluginTip } from "./PluginCard.jsx";

export function PluginRail({ pluginIds, fired = [], compact, onOpen }) {
  const slots = RULES.maxPlugins;
  if (compact) {
    return (
      <section className="joker-rail compact" aria-label="Plugins">
        <div className="chip-row" style={{ "--slots": slots }}>
          {Array.from({ length: slots }, (_, index) => {
            const id = pluginIds[index];
            return id
              ? <PluginChip key={id} id={id} order={index + 1} pulse={fired.includes(id)} onOpen={() => onOpen(id)} />
              : <div key={`empty${index}`} className="joker-chip empty" aria-hidden="true" />;
          })}
        </div>
      </section>
    );
  }
  return (
    <section className="joker-rail" aria-label="Plugins">
      <div className="rail-label">
        <span>Plugins</span>
        <span className="num small">{pluginIds.length}/{slots}</span>
        <span className="dim small">Effets permanents. La boutique en propose après chaque contrat.</span>
      </div>
      <div className="rail-slots" style={{ "--slots": slots }}>
        {Array.from({ length: slots }, (_, index) => {
          const id = pluginIds[index];
          return id ? (
            <Tooltip key={id} content={<PluginTip id={id} />} className="joker-wrap">
              <PluginCard id={id} order={index + 1} pulse={fired.includes(id)} />
            </Tooltip>
          ) : (
            <div key={`empty${index}`} className="joker-empty"><span>Emplacement libre</span></div>
          );
        })}
      </div>
    </section>
  );
}
