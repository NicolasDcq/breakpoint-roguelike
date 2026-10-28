// La boutique sur ordinateur, façon jeu vidéo : trois étagères (offres, arrivage, Terminal)
// et, à gauche, le prochain contrat avec les gros boutons (relancer, parc, contrat suivant).
// Les offres sont de vraies cartes avec leur étiquette de prix, les paquets sont posés sur leur étagère.

import { BOSSES, COMMANDS, OfferKind, PACKS, PLUGINS, RULES } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { PluginCard } from "../components/PluginCard.jsx";
import { CommandCard } from "../components/CommandCard.jsx";
import { commandUsable } from "../components/TerminalRail.jsx";
import { PackArt, packEffect } from "./Packs.jsx";

/** L'étiquette de prix qui pend sous une carte ou un paquet. */
function PriceTag({ price, money, children }) {
  return <span className={`sd-price num ${money >= price ? "" : "short"}`}>{children ?? `${price} $`}</span>;
}

function Shelf({ title, note, className = "", children }) {
  return (
    <section className={`sd-shelf ${className}`}>
      <header className="sd-shelf-head"><h3>{title}</h3>{note && <span>{note}</span>}</header>
      <div className="sd-shelf-body">{children}</div>
      <i className="sd-shelf-board" aria-hidden="true" />
    </section>
  );
}

function OfferSlot({ offer, view, onBuy, onReplace }) {
  const full = view.pluginIds.length >= RULES.maxPlugins;
  const isCommand = offer.kind === OfferKind.COMMAND;
  const terminalFull = view.commands.length >= view.commandSlots;
  const blocked = offer.sold || (isCommand && terminalFull);
  const name = isCommand ? offer.id : PLUGINS[offer.id].name;
  const label = isCommand ? `Acheter la commande ${name} pour ${offer.price} $` : full ? `Remplacer un Plugin par ${name}` : `Recruter ${name} pour ${offer.price} $`;
  return (
    <button
      type="button"
      className={`sd-offer ${offer.sold ? "sold" : ""} ${money(view, offer) ? "" : "poor"}`}
      disabled={blocked}
      onClick={() => (!isCommand && full ? onReplace() : onBuy())}
      aria-label={label}
      title={isCommand && terminalFull && !offer.sold ? "Terminal plein : utilise une commande d'abord." : undefined}
    >
      {isCommand ? <CommandCard id={offer.id} /> : <PluginCard id={offer.id} />}
      <PriceTag price={offer.price} money={view.money}>
        {offer.sold ? (isCommand ? "Acheté" : "Recruté") : !isCommand && full ? `Remplacer · ${offer.price} $` : undefined}
      </PriceTag>
    </button>
  );
}
const money = (view, offer) => view.money >= offer.price;

function PackSlot({ slot, index, view, onBuy }) {
  const pack = PACKS[slot.packId];
  const terminalFull = pack.reward === "command" && view.commands.length >= view.commandSlots;
  const disabled = slot.sold || view.money < pack.price || terminalFull;
  return (
    <button
      type="button"
      className={`sd-pack ${slot.sold ? "sold" : ""} ${view.money >= pack.price ? "" : "poor"}`}
      disabled={disabled}
      onClick={() => onBuy(index)}
      aria-label={`Acheter ${pack.name} pour ${pack.price} $`}
      title={terminalFull && !slot.sold ? "Terminal plein : utilise une commande d'abord." : undefined}
    >
      <span className="sd-pack-art">{slot.sold ? <span className="sd-pack-empty">▣</span> : <PackArt packId={slot.packId} />}</span>
      <b className="sd-pack-name">{pack.name}</b>
      <span className="sd-pack-effect">{slot.sold ? "Ouvert : nouvel arrivage à la prochaine boutique." : packEffect(slot.packId)}</span>
      <PriceTag price={pack.price} money={view.money}>{slot.sold ? "Ouvert" : undefined}</PriceTag>
    </button>
  );
}

function TerminalShelf({ view, onUse }) {
  return Array.from({ length: view.commandSlots }, (_, slot) => {
    const id = view.commands[slot];
    if (!id) return <div key={`empty${slot}`} className="sd-term empty"><span>Emplacement libre</span></div>;
    const usable = commandUsable(view, id);
    return (
      <div key={`${slot}${id}`} className="sd-term">
        <span className="sd-term-cmd">{id}</span>
        <span className="sd-term-fx">{COMMANDS[id].text}</span>
        <button type="button" className={`sd-btn use ${usable ? "" : "off"}`} onClick={() => onUse(slot)} aria-label={`Utiliser ${id}`}>Utiliser</button>
      </div>
    );
  });
}

export function ShopDesktop({ view, actions, onReplace }) {
  const next = view.nextContract;
  const boss = BOSSES[next.boss];
  return (
    <Modal className="sd-modal">
      <header className="sd-head">
        <div>
          <h2 className="sd-title">Boutique</h2>
          <span className="sd-sub">Entre deux contrats : renforce ton parc.</span>
        </div>
        <div className="sd-wallet">
          <span className="num c-budget" title="Budget">{view.money} $</span>
          <span className="num c-data" title="Data">{view.data} ◆</span>
        </div>
      </header>
      <div className="sd-body">
        <aside className="sd-side">
          <div className="sd-next">
            <span className="sd-next-label">Prochain contrat</span>
            <b className="sd-next-name">V{next.version}{next.letter} · {next.name}</b>
            <span className="sd-next-target"><span>Objectif</span><b className="num">{next.target}</b></span>
            {boss && <span className="rule-chip sd-next-rule">{boss.text}</span>}
          </div>
          <button type="button" className="sd-btn reroll" disabled={view.money < view.rerollPrice} onClick={actions.reroll}>
            <span>Relancer</span><b className="num">{view.rerollPrice} $</b>
          </button>
          <span className="sd-side-note">Renouvelle les offres, pas l'arrivage.</span>
          <div className="sd-side-fill" />
          <button type="button" className="sd-btn parc" onClick={actions.showParc}>Parc ({view.parc.length})</button>
          <button type="button" className="sd-btn go" onClick={actions.next}>Contrat suivant</button>
        </aside>
        <div className="sd-main">
          <Shelf title="Offres" note={`Plugins ${view.pluginIds.length}/${RULES.maxPlugins}`} className="sd-offers">
            {view.offers.map((offer, index) => (
              <OfferSlot key={index} offer={offer} view={view} onBuy={() => actions.buy(index)} onReplace={() => onReplace(index)} />
            ))}
          </Shelf>
          <div className="sd-right">
            <Shelf title="Arrivage" note="2 emplacements au hasard" className="sd-arrivage">
              {view.packSlots.map((slot, index) => <PackSlot key={index} slot={slot} index={index} view={view} onBuy={actions.buyPack} />)}
            </Shelf>
            <Shelf title="Ton terminal" note={`${view.commands.length}/${view.commandSlots}`} className="sd-terminal">
              <TerminalShelf view={view} onUse={actions.useCommand} />
            </Shelf>
          </div>
        </div>
      </div>
    </Modal>
  );
}
