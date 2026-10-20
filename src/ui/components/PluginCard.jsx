// Les Plugins en cartes à puce : boîtier à broches dorées, encoche, référence gravée,
// fenêtre avec le dessin en pixel art, étiquette blanche et pastille de rareté.

import { PLUGINS } from "../../domain/index.js";
import { RARITY_LABELS } from "../visuals.js";
import { FX } from "../fx.jsx";
import { PixelSprite } from "../plugins/PixelSprite.jsx";
import { PUCE_LOOK } from "../plugins/sprites.js";

const FALLBACK = { code: "PLG-00", bg: "#26305a", bg2: "#1f2848" };
const lookOf = (id) => PUCE_LOOK[id] ?? FALLBACK;

/** La fenêtre de la puce : fond en damier et rayons, avec le dessin. */
function PuceWindow({ id, size }) {
  const look = lookOf(id);
  return (
    <span className="puce-die" style={{ "--b1": look.bg, "--b2": look.bg2 }}>
      <span className="puce-rays" />
      <PixelSprite id={id} size={size} />
    </span>
  );
}

/** Carte complète (rail sur ordinateur, boutique, fiches). */
export function PluginCard({ id, order, pulse = false, className = "" }) {
  const plugin = PLUGINS[id];
  return (
    <div className={`puce r-${plugin.rarity} ${pulse ? "fired" : ""} ${className}`}>
      <span className="puce-notch" />
      <span className="puce-pin1" />
      <span className="puce-code">{lookOf(id).code}</span>
      {order !== undefined && <span className="puce-order num">{order}</span>}
      <PuceWindow id={id} size={72} />
      <span className={`puce-name ${plugin.name.length > 15 ? "long" : ""}`}>{plugin.name}</span>
      <span className="puce-text"><span>{FX(plugin.text)}</span></span>
      <span className="puce-rar">{RARITY_LABELS[plugin.rarity]}</span>
    </div>
  );
}

/** Puce seule (rail sur téléphone, fin de partie) : le boîtier et son dessin. */
export function PluginMini({ id, order, pulse = false, label = true, className = "", spriteSize = 40 }) {
  const plugin = PLUGINS[id];
  return (
    <span className={`puce-slot ${className}`}>
      {order !== undefined && <span className="puce-order num">{order}</span>}
      <span className={`puce-mini r-${plugin.rarity} ${pulse ? "fired" : ""}`}>
        <span className="puce-notch" />
        <PuceWindow id={id} size={spriteSize} />
      </span>
      {label && <span className="puce-mini-name">{plugin.name.replace(/^(Le |La |L’|L')/, "")}</span>}
    </span>
  );
}

/** Infobulle d'un Plugin : nom, effet et rareté, aux couleurs de la carte à puce. */
export function PluginTip({ id }) {
  const plugin = PLUGINS[id];
  return (
    <div className={`puce-tip r-${plugin.rarity}`}>
      <span className="puce-tip-head">
        <strong>{plugin.name}</strong>
        <span className="puce-code">{lookOf(id).code}</span>
      </span>
      <span className="puce-text"><span>{FX(plugin.text)}</span></span>
      <span className="puce-rar">{RARITY_LABELS[plugin.rarity]}</span>
    </div>
  );
}
