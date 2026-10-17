// Carte d'un Plugin, infobulle et fiche.

import { PLUGINS, RARITY_LABELS } from "../../engine/plugins.js";
import { FX } from "../fx.jsx";

export function PluginCard({ id, owned, variant = "rail", disabled, disabledText, note, pulse, footer, order }) {
  let i = PLUGINS[id];
  let c = { "--j1": i.hue[0], "--j2": i.hue[1] };
  return (
    <div
      className={`joker v-${variant} r-${i.rarity} ${disabled ? "disabled" : ""} ${pulse ? "pulsing" : ""}`}
      style={c}
    >
      <div className="joker-art" aria-hidden="true">
        <span className="joker-emoji">{i.emoji}</span>
        <span className="joker-scan" />
      </div>
      <div className="joker-body">
        <div className="joker-title"><span className="joker-name">{i.name}</span></div>
        <p className="joker-text">{FX(i.text)}</p>
        {note && <div className="joker-counter">{note}</div>}
        {owned
          && i.counterLabel
          && <div className="joker-counter">{i.counterLabel(owned.counter)}</div>}
        {owned
          && i.debtLimit
          && (
            <div className="joker-debt" aria-label="Dette technique">
              {Array.from({ length: i.debtLimit }, (p, m) => <span key={m} className={m < owned.counter ? "on" : ""} />)}
              <span className="small">{"dette "}{owned.counter}/{i.debtLimit}</span>
            </div>
          )}
      </div>
      <span className="joker-rarity">{RARITY_LABELS[i.rarity]}</span>
      {order !== undefined && <span className="joker-order">{order}</span>}
      {disabled && <div className="joker-disabled">{disabledText ?? "Désactivé"}</div>}
      {pulse && <div key={pulse.id} className="joker-pulse">{pulse.text}</div>}
      {footer}
    </div>
  );
}

export function PluginTip({ id }) {
  let t = PLUGINS[id];
  return (
    <div className="tip-body">
      <strong>{t.emoji}{" "}{t.name}</strong>
      <p>{FX(t.text)}</p>
      <p className="tip-flavor">{t.flavor}</p>
      <p className="tip-syn">{"Combo avec : "}{t.synergies.join(", ")}</p>
    </div>
  );
}

export function PluginSheet({ id, owned, note, disabledText, actions, onClose }) {
  let l = PLUGINS[id];
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet joker-sheet"
        role="dialog"
        aria-label={l.name}
        onClick={(d) => d.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <PluginCard
          id={id}
          owned={owned}
          variant="rail"
          note={note}
          disabled={!!disabledText}
          disabledText={disabledText}
        />
        <p className="tip-flavor">{l.flavor}</p>
        <p className="tip-syn">{"Combo avec : "}{l.synergies.join(", ")}</p>
        <div className="sheet-actions">
          {actions}
          <button className="ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
