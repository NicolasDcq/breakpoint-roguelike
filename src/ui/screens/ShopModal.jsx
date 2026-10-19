// La boutique, entre deux contrats : modules, Plugins, boosters de plans d'architecture et services.

import { BOSSES, FAMILIES, MODULES, OfferKind, PLUGINS, RULES, upgradeCost } from "../../domain/index.js";
import { BoosterOffers } from "./Booster.jsx";
import { Modal } from "../common/Modal.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { Tooltip } from "../common/Tooltip.jsx";
import { FAMILY_ACCENT, tileClasses } from "../visuals.js";
import { ModuleFace, ModuleTip } from "../components/ModuleFace.jsx";
import { PluginCard, PluginTip } from "../components/PluginCard.jsx";

const priceLabel = (offer, money, soldLabel) => (offer.sold ? soldLabel : `${offer.price} $`);
const priceClass = (offer, money) => `price num ${money >= offer.price ? "" : "short"}`;

function ModuleOffers({ view, onBuy }) {
  return (
    <div className="shop-modules">
      {view.offers.map((offer, index) => {
        if (offer.kind !== OfferKind.MODULE) return null;
        const module = MODULES[offer.id];
        return (
          <Tooltip key={index} content={<ModuleTip card={{ moduleId: offer.id, level: 1 }} />} className="offer-wrap">
            <button className={`offer module-offer accent-${FAMILY_ACCENT[module.family]} ${offer.sold ? "sold" : ""}`} disabled={offer.sold} onClick={() => onBuy(index)}>
              <span className="offer-icon"><ModuleIcon id={offer.id} size={26} /></span>
              <span className="offer-main">
                <span className="offer-name">{module.name} <span className={`fam fam-${module.family}`}>{FAMILIES[module.family].name}</span></span>
                <span className="offer-text">{module.lines(1).map((line) => line.text).join(" ")}</span>
              </span>
              <span className={priceClass(offer, view.money)}>{priceLabel(offer, view.money, "Acheté")}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

function PluginOffers({ view, onBuy }) {
  const full = view.pluginIds.length >= RULES.maxPlugins;
  return (
    <div className="shop-jokers">
      {view.offers.map((offer, index) => {
        if (offer.kind !== OfferKind.PLUGIN) return null;
        return (
          <Tooltip key={index} content={<PluginTip id={offer.id} />} className="offer-wrap">
            <button className={`joker-offer ${offer.sold ? "sold" : ""}`} disabled={offer.sold || full} onClick={() => onBuy(index)} aria-label={`Recruter ${PLUGINS[offer.id].name} pour ${offer.price} $`}>
              <PluginCard id={offer.id} variant="offer" />
              <span className={priceClass(offer, view.money)}>{offer.sold ? "Recruté" : full ? "Plus de place" : `${offer.price} $`}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** Choisir un module du parc, pour l'améliorer (◆) ou le retirer ($). */
function ParcPicker({ view, mode, onPick }) {
  const upgrading = mode === "upgrade";
  return (
    <>
      <p className="dim small">{upgrading ? "Touche un module pour l'améliorer (coût en ◆)." : `Touche un module pour le retirer (${view.removePrice} $, ${RULES.minParcSize} modules minimum).`}</p>
      <div className="parc-grid">
        {view.parc.map((card) => {
          const cost = upgradeCost(card.level);
          const disabled = upgrading ? !cost || view.data < cost : view.money < view.removePrice || !view.canRemove;
          return (
            <div key={card.uid} className="slot drawer-slot filled parc-cell">
              <button className={tileClasses(card)} disabled={disabled} onClick={() => onPick(card.uid)} aria-label={MODULES[card.moduleId].name}>
                <ModuleFace card={card} />
              </button>
              <span className="parc-price num">{upgrading ? (cost ? `${cost} ◆` : "max") : `${view.removePrice} $`}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ShopModal({ view, mode, actions }) {
  const next = view.nextContract;
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
          <ParcPicker view={view} mode={mode} onPick={mode === "upgrade" ? actions.upgrade : actions.remove} />
        ) : (
          <>
            <div className="shop-col">
              <h3 className="shop-section">Modules · ils rejoignent ton parc</h3>
              <ModuleOffers view={view} onBuy={actions.buy} />
              <h3 className="shop-section">Plans d'architecture</h3>
              <BoosterOffers view={view} onOpen={actions.openBooster} />
            </div>
            <div className="shop-col">
              <h3 className="shop-section">Plugins · {view.pluginIds.length}/{RULES.maxPlugins}</h3>
              <PluginOffers view={view} onBuy={actions.buy} />
              <h3 className="shop-section">Services</h3>
              <div className="shop-services">
                <button className="ghost" onClick={() => actions.setMode("upgrade")}>Améliorer un module (◆)</button>
                <button className="ghost" onClick={() => actions.setMode("remove")}>Retirer un module ({view.removePrice} $)</button>
                <button className="ghost" disabled={view.money < view.rerollPrice} onClick={actions.reroll}>Relancer ({view.rerollPrice} $)</button>
              </div>
              <div className="next-contract">
                <span className="dim small">Prochain contrat</span>
                <b>V{next.version}{next.letter} · {next.name}</b>
                <b className="num c-budget">{next.target}</b>
                {BOSSES[next.boss] && <span className="rule-chip">{BOSSES[next.boss].rule}</span>}
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
    </Modal>
  );
}
