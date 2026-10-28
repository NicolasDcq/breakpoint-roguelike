// La boutique, entre deux contrats : arrivage (2 emplacements : colis, boosters, Pack de Plugins), Plugins et services.

import { BOSSES, COMMANDS, OfferKind, PLUGINS, RULES } from "../../domain/index.js";
import { useState } from "react";
import { PackOffers } from "./Packs.jsx";
import { ReplacePluginModal } from "./ReplacePluginModal.jsx";
import { Modal } from "../common/Modal.jsx";
import { Tooltip } from "../common/Tooltip.jsx";
import { CommandCard, CommandChip, CommandTip } from "../components/CommandCard.jsx";
import { commandUsable } from "../components/TerminalRail.jsx";
import { PluginCard, PluginChip, PluginTip } from "../components/PluginCard.jsx";

const priceLabel = (offer, money, soldLabel) => (offer.sold ? soldLabel : `${offer.price} $`);
const priceClass = (offer, money) => `price num ${money >= offer.price ? "" : "short"}`;

function PluginOffers({ view, desktop, onBuy, onReplace }) {
  const full = view.pluginIds.length >= RULES.maxPlugins;
  return (
    <div className="shop-jokers">
      {view.offers.map((offer, index) => {
        if (offer.kind === OfferKind.COMMAND) {
          return (
            <Tooltip key={index} content={<CommandTip id={offer.id} />} className="offer-wrap" disabled={!desktop}>
              <button
                className={`joker-offer cmd-offer ${offer.sold ? "sold" : ""}`}
                disabled={offer.sold}
                onClick={() => onBuy(index)}
                aria-label={`Acheter la commande ${offer.id} pour ${offer.price} $`}
              >
                {desktop ? <CommandChip id={offer.id} /> : <CommandCard id={offer.id} />}
                <span className={priceClass(offer, view.money)}>{offer.sold ? "Acheté" : `${offer.price} $`}</span>
              </button>
            </Tooltip>
          );
        }
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

/** Le Terminal vu depuis la boutique : les commandes gardées, avec leur bouton Utiliser. */
function TerminalSlots({ view, onUse }) {
  return (
    <div className="shop-terminal">
      {Array.from({ length: view.commandSlots }, (_, slot) => {
        const id = view.commands[slot];
        if (!id) return <div key={`empty${slot}`} className="shop-term-slot empty">Emplacement libre</div>;
        return (
          <div key={`${slot}${id}`} className="shop-term-slot">
            <span className="shop-term-cmd">{id}</span>
            <span className="shop-term-fx">{COMMANDS[id].text}</span>
            <button type="button" className={`shop-term-use ${commandUsable(view, id) ? "" : "off"}`} onClick={() => onUse(slot)} aria-label={`Utiliser ${id}`}>Utiliser</button>
          </div>
        );
      })}
    </div>
  );
}

export function ShopModal({ view, actions, desktop }) {
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
        <div className="shop-col">
          <PackOffers view={view} onBuy={actions.buyPack} />
        </div>
        <div className="shop-col">
          <h3 className="shop-section">Plugins · {view.pluginIds.length}/{RULES.maxPlugins}</h3>
          <PluginOffers view={view} desktop={desktop} onBuy={actions.buy} onReplace={setReplacing} />
          <h3 className="shop-section">Ton terminal · {view.commands.length}/{view.commandSlots}</h3>
          <TerminalSlots view={view} onUse={actions.useCommand} />
          <h3 className="shop-section">Services</h3>
          <div className="shop-services">
            <button className="ghost" disabled={view.money < view.rerollPrice} onClick={actions.reroll}>Relancer ({view.rerollPrice} $)</button>
          </div>
          <div className="next-contract">
            <span className="dim small">Prochain contrat</span>
            <b>V{next.version}{next.letter} · {next.name}</b>
            <b className="num c-budget">{next.target}</b>
            {BOSSES[next.boss] && <span className="rule-chip">{BOSSES[next.boss].text}</span>}
          </div>
        </div>
      </div>
      <div className="fu-foot">
        <button className="ghost fu-parc" onClick={actions.showParc}>Parc ({view.parc.length})</button>
        <button className="fu-back fu-next" onClick={actions.next}>Contrat suivant</button>
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
