// La boutique, entre deux contrats : arrivage (colis de modules, boosters de plans), Plugins et services.

import { BOSSES, FAMILIES, MODULES, OfferKind, PLUGINS, RULES } from "../../domain/index.js";
import { useState } from "react";
import { PackOffers } from "./Packs.jsx";
import { ReplacePluginModal } from "./ReplacePluginModal.jsx";
import { Modal } from "../common/Modal.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { Tooltip } from "../common/Tooltip.jsx";
import { FAMILY_ACCENT, tileClasses } from "../visuals.js";
import { ModuleFace, ModuleTip } from "../components/ModuleFace.jsx";
import { PluginCard, PluginChip, PluginTip } from "../components/PluginCard.jsx";

const priceLabel = (offer, money, soldLabel) => (offer.sold ? soldLabel : `${offer.price} $`);
const priceClass = (offer, money) => `price num ${money >= offer.price ? "" : "short"}`;

function PluginOffers({ view, desktop, onBuy, onReplace }) {
  const full = view.pluginIds.length >= RULES.maxPlugins;
  return (
    <div className="shop-jokers">
      {view.offers.map((offer, index) => {
        if (offer.kind !== OfferKind.PLUGIN) return null;
        return (
          <Tooltip key={index} content={<PluginTip id={offer.id} />} className="offer-wrap" disabled={!desktop}>
            <button
              className={`joker-offer ${offer.sold ? "sold" : ""}`}
              disabled={offer.sold}
              onClick={() => (full ? onReplace(index) : onBuy(index))}
              aria-label={full ? `Remplacer un Plugin par ${PLUGINS[offer.id].name}` : `Recruter ${PLUGINS[offer.id].name} pour ${offer.price} $`}
            >
              {desktop ? <PluginChip id={offer.id} /> : <PluginCard id={offer.id} />}
              <span className={priceClass(offer, view.money)}>{offer.sold ? "Recruté" : full ? `Remplacer · ${offer.price} $` : `${offer.price} $`}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** Choisir un module du parc à retirer ($). */
function ParcPicker({ view, onPick }) {
  return (
    <>
      <p className="dim small">Touche un module pour le retirer ({view.removePrice} $, {RULES.minParcSize} modules minimum).</p>
      <div className="parc-grid">
        {view.parc.map((card) => {
          const disabled = view.money < view.removePrice || !view.canRemove;
          return (
            <div key={card.uid} className="slot drawer-slot filled parc-cell">
              <button className={tileClasses(card)} disabled={disabled} onClick={() => onPick(card.uid)} aria-label={MODULES[card.moduleId].name}>
                <ModuleFace card={card} />
              </button>
              <span className="parc-price num">{view.removePrice} $</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ShopModal({ view, mode, actions, desktop }) {
  const next = view.nextContract;
  const [replacing, setReplacing] = useState(null);
  return (
    <Modal className="shop-modal parc-shop">
      <div className="fu-head">
        <div>
          <h2 className="fu-title shop-title">Boutique</h2>
          <span className="dim small">Entre deux contrats : renforce ton parc.</span>
        </div>
        <div className="shop-wallet">
          <span className="num c-budget" title="Budget">{view.money} $</span>
          <span className="num c-data" title="Data">{view.data} ◆</span>
        </div>
      </div>
      <div className="shop">
        {mode ? (
          <ParcPicker view={view} onPick={actions.remove} />
        ) : (
          <>
            <div className="shop-col">
              <PackOffers view={view} onBuy={actions.buyPack} />
            </div>
            <div className="shop-col">
              <h3 className="shop-section">Plugins · {view.pluginIds.length}/{RULES.maxPlugins}</h3>
              <PluginOffers view={view} desktop={desktop} onBuy={actions.buy} onReplace={setReplacing} />
              <h3 className="shop-section">Services</h3>
              <div className="shop-services">
                <button className="ghost" onClick={() => actions.setMode("remove")}>Retirer un module ({view.removePrice} $)</button>
                <button className="ghost" disabled={view.money < view.rerollPrice} onClick={actions.reroll}>Relancer ({view.rerollPrice} $)</button>
              </div>
              <div className="next-contract">
                <span className="dim small">Prochain contrat</span>
                <b>V{next.version}{next.letter} · {next.name}</b>
                <b className="num c-budget">{next.target}</b>
                {BOSSES[next.boss] && <span className="rule-chip">{BOSSES[next.boss].text}</span>}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="fu-foot">
        {mode ? (
          <button className="fu-back" onClick={() => actions.setMode(null)}>Retour à la boutique</button>
        ) : (
          <>
            <button className="ghost fu-parc" onClick={actions.showParc}>Parc ({view.parc.length})</button>
            <button className="fu-back fu-next" onClick={actions.next}>Contrat suivant</button>
          </>
        )}
      </div>
      {replacing !== null && (
        <ReplacePluginModal
          view={view}
          desktop={desktop}
          offer={view.offers[replacing]}
          onClose={() => setReplacing(null)}
          onReplace={(pluginId) => { if (actions.buy(replacing, pluginId)) setReplacing(null); }}
        />
      )}
    </Modal>
  );
}
