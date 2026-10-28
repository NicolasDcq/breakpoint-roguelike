// Les Plugins en cartes à puce : boîtier à broches dorées, encoche, référence gravée,
// fenêtre avec le dessin en pixel art, étiquette blanche et pastille de rareté.

import { PLUGINS } from "../../domain/index.js";
import { RARITY_LABELS } from "../visuals.js";
import { fmtDec } from "../format.js";
import { FX } from "../fx.jsx";
import { PixelSprite } from "../plugins/PixelSprite.jsx";
import { PUCE_LOOK } from "../plugins/sprites.js";

const FALLBACK = { code: "PLG-00", bg: "#26305a", bg2: "#1f2848" };
const lookOf = (id) => PUCE_LOOK[id] ?? FALLBACK;

/** Le texte d'une valeur du moment : « +9 ⚡ », « +0,6 × », « ×1,5 », « +3 $ », « +2 ◆ », « ↻ 2 ». */
export function valueText({ kind, amount, mode }) {
  if (kind === "retry") return `↻ ${amount}`;
  if (kind === "money") return `+${amount} $`;
  if (kind === "data") return `+${amount} ◆`;
  if (mode === "times") return `×${fmtDec(amount)}`;
  return kind === "scale" ? `+${fmtDec(amount)} ×` : `+${fmtDec(amount)} ⚡`;
}

/** La couleur d'un badge : Compute bleu, Scale rouge, réactivations vert, argent jaune, Data violet, multiplicateur blanc. */
const VALUE_CLASS = { compute: "v-compute", scale: "v-scale", retry: "v-retry", money: "v-money", data: "v-data", mult: "v-mult" };
export const valueClass = (kind) => VALUE_CLASS[kind] ?? "v-compute";

/** Le badge sous une puce : ce que le Plugin apporte en ce moment. */
export function ValueBadge({ value, firing }) {
  if (!value) return null;
  return <span className={`puce-val ${valueClass(value.kind)} ${firing ? "up" : ""}`}>{valueText(value)}</span>;
}

/** La bulle qui monte d'une puce quand son Plugin s'active. */
export function FiringPop({ firing }) {
  if (!firing) return null;
  return <span key={firing.key} className={`puce-pop ${valueClass(firing.kind)}`} aria-hidden="true">{firing.text}</span>;
}

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
export function PluginCard({ id, order, pulse = false, className = "", value = null }) {
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
      {value && <span className="puce-now"><span>Actuel</span><b className={valueClass(value.kind)}>{valueText(value)}</b></span>}
      <span className="puce-rar">{RARITY_LABELS[plugin.rarity]}</span>
    </div>
  );
}

/** Puce seule (rail sur téléphone, fin de partie) : le boîtier et son dessin. */
export function PluginMini({ id, order, pulse = false, label = true, className = "", spriteSize = 40, value = null, firing = null }) {
  const plugin = PLUGINS[id];
  return (
    <span className={`puce-slot ${className} ${firing ? "firing" : ""}`}>
      {order !== undefined && <span className="puce-order num">{order}</span>}
      <span className={`puce-mini r-${plugin.rarity} ${pulse ? "fired" : ""} ${value ? "has-val" : ""}`}>
        <span className="puce-notch" />
        <PuceWindow id={id} size={spriteSize} />
      </span>
      <ValueBadge value={value} firing={firing} />
      <FiringPop firing={firing} />
      {label && <span className="puce-mini-name">{plugin.name.replace(/^(Le |La |L’|L')/, "")}</span>}
    </span>
  );
}

/** Puce de taille fixe pour l'ordinateur : le dessin et le nom ; l'effet est dans l'infobulle (PluginTip). */
export function PluginChip({ id, order, pulse = false, value = null, firing = null }) {
  return <PluginMini id={id} order={order} pulse={pulse} className="big" spriteSize={64} value={value} firing={firing} />;
}

/** Infobulle d'un Plugin : nom, effet et rareté, aux couleurs de la carte à puce. */
export function PluginTip({ id, value = null }) {
  const plugin = PLUGINS[id];
  return (
    <div className={`puce-tip r-${plugin.rarity}`}>
      <span className="puce-tip-head">
        <strong>{plugin.name}</strong>
        <span className="puce-code">{lookOf(id).code}</span>
      </span>
      <span className="puce-text"><span>{FX(plugin.text)}</span></span>
      {value && <span className="puce-now"><span>Actuel</span><b className={valueClass(value.kind)}>{valueText(value)}</b></span>}
      <span className="puce-rar">{RARITY_LABELS[plugin.rarity]}</span>
    </div>
  );
}
