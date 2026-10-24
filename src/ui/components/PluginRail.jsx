// Rangée des Plugins possédés, en cartes à puce. Un Plugin qui s'active saute et montre sa valeur.
// On glisse une puce sur une autre pour changer l'ordre (les Plugins de fin agissent l'un après l'autre).
// Sous chaque puce : ce que le Plugin apporte en ce moment.

import { PLUGINS, RULES } from "../../domain/index.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { usePluginDrag } from "../hooks/usePluginDrag.js";
import { PluginChip, PluginMini, PluginTip } from "./PluginCard.jsx";

export function PluginRail({ pluginIds, values = {}, fired = [], firing = null, locked = false, compact, onOpen, onMove }) {
  const slots = RULES.maxPlugins;
  const { drag, dragProps } = usePluginDrag({ locked, onTap: onOpen, onMove });
  const style = { "--slots": slots };
  const item = (id, index, big) => {
    const props = {
      id,
      order: index + 1,
      pulse: fired.includes(id),
      value: values[id] ?? null,
      firing: firing?.[id] ?? null,
    };
    return big ? <PluginChip {...props} /> : <PluginMini {...props} />;
  };
  const button = (id, index, big) => (
    <button
      key={id}
      type="button"
      className={`puce-rail-btn ${drag?.from === index ? "dragging" : ""} ${drag && drag.over === index && drag.from !== index ? "over" : ""}`}
      aria-label={compact ? `Plugin ${index + 1}` : PLUGINS[id].name}
      {...dragProps(id, index)}
    >
      {item(id, index, big)}
    </button>
  );
  const ghost = drag && (
    <div className="puce-drag-ghost" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy }} aria-hidden="true">
      {item(drag.id, drag.from, !compact)}
    </div>
  );
  if (compact) {
    return (
      <section className="puce-rail compact" style={style} aria-label="Plugins">
        {Array.from({ length: slots }, (_, index) => {
          const id = pluginIds[index];
          return id ? button(id, index, false) : <span key={`empty${index}`} className="puce-empty" aria-hidden="true" />;
        })}
        {ghost}
      </section>
    );
  }
  return (
    <section className="joker-rail puce-rail-desk" aria-label="Plugins">
      <div className="rail-label">
        <span>Plugins</span>
        <span className="num small">{pluginIds.length}/{slots}</span>
        <span className="dim small">Survole une puce pour voir son effet. Glisse-les pour changer l’ordre.</span>
      </div>
      <div className="puce-rail" style={style}>
        {Array.from({ length: slots }, (_, index) => {
          const id = pluginIds[index];
          return id ? (
            <Tooltip key={id} content={<PluginTip id={id} value={values[id] ?? null} />} className="puce-wrap" disabled={Boolean(drag)}>
              {button(id, index, true)}
            </Tooltip>
          ) : (
            <div key={`empty${index}`} className="puce-empty"><span>Libre</span></div>
          );
        })}
      </div>
      {ghost}
    </section>
  );
}
