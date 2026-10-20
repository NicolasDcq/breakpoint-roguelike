// Emplacements de Plugin pleins : choisir lequel revendre pour faire place au nouveau.

import { useState } from "react";
import { PLUGINS, pluginSellPrice } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { PluginCard } from "../components/PluginCard.jsx";

export function ReplacePluginModal({ view, offer, onReplace, onClose }) {
  const [chosen, setChosen] = useState(null);
  const incoming = PLUGINS[offer.id];
  const refund = chosen ? pluginSellPrice(chosen) : 0;
  const affordable = (id) => view.money + pluginSellPrice(id) >= offer.price;
  return (
    <Modal className="rules-modal replace-modal" onClose={onClose}>
      <h2 className="modal-title">Remplacer un Plugin</h2>
      <p className="dim small">
        Tes {view.pluginIds.length} emplacements sont pleins. Choisis le Plugin à revendre : {incoming.name} prendra sa place, et la revente aide à payer.
      </p>
      <div className="replace-incoming">
        <span className="replace-tag">Arrive</span>
        <PluginCard id={offer.id} variant="offer" />
        <span className="price num">{offer.price} $</span>
      </div>
      <h3 className="shop-section">Revendre lequel ?</h3>
      <div className="replace-list">
        {view.pluginIds.map((id, index) => (
          <button
            key={id}
            className={`joker-offer replace-option ${chosen === id ? "sel" : ""}`}
            aria-pressed={chosen === id}
            disabled={!affordable(id)}
            onClick={() => setChosen(id)}
          >
            <PluginCard id={id} variant="offer" order={index + 1} />
            <span className="price num">{affordable(id) ? `Revendre +${pluginSellPrice(id)} $` : "Pas assez de $"}</span>
          </button>
        ))}
      </div>
      <div className="replace-actions">
        <button className="ghost" onClick={onClose}>Annuler</button>
        <button className="deploy" disabled={!chosen} onClick={() => onReplace(chosen)}>
          {chosen
            ? `Remplacer ${PLUGINS[chosen].name} · ${refund - offer.price >= 0 ? "+" : "−"}${Math.abs(refund - offer.price)} $`
            : "Choisis un Plugin à revendre"}
        </button>
      </div>
    </Modal>
  );
}
