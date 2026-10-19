// Les Plugins possédés. Ils clignotent quand ils se déclenchent.
import { PLUGINS } from "../../domain/index.js";
import { PLUGIN_ICONS } from "../visuals.js";

export function PluginRail({ pluginIds, fired = [] }) {
  if (!pluginIds.length) {
    return <div className="plugins"><span className="plugin-empty">Aucun Plugin. La boutique en propose après chaque contrat.</span></div>;
  }
  return (
    <div className="plugins">
      {pluginIds.map((id) => (
        <span key={id} className={`plugin ${fired.includes(id) ? "flash" : ""}`} title={PLUGINS[id].text}>
          {PLUGIN_ICONS[id]} {PLUGINS[id].name}
        </span>
      ))}
    </div>
  );
}
