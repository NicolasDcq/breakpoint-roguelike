// Boutique.

import { EDITIONS } from "../../engine/editions.js";
import { FAMILY_LABELS } from "../../engine/families.js";
import { MODULES } from "../../engine/modules.js";
import { PLUGINS } from "../../engine/plugins.js";
import { ModuleTip } from "../board/ModuleParts.jsx";
import { Modal } from "../common/Modal.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { Tooltip } from "../common/Tooltip.jsx";
import { FX } from "../fx.jsx";
import { GoodieOffer } from "../goodies/Goodies.jsx";
import { PluginCard, PluginTip } from "../plugins/PluginCard.jsx";
import { Arrivals } from "./Packs.jsx";

export function ShopModal(e) {
  return (
    <Modal className="shop-modal" onClose={e.onShopClose}>
      <>
        <div className="fu-head">
          <div>
            <h2 className="fu-title shop-title">Boutique</h2>
            <span className="dim small">Modules et Plugins, entre deux déploiements.</span>
          </div>
          <div className="shop-wallet">
            <span className="num c-budget" title="Budget">{e.budget}{" $"}</span>
            <span className="num c-data" title="Data">{e.data}{" ◆"}</span>
          </div>
        </div>
        <Shop {...e} />
        <div className="fu-foot">
          {e.mobile
            && (
              <button
                className="fu-reroll"
                disabled={e.locked || e.shopClosed || e.budget < e.rerollCost}
                onClick={e.onReroll}
              >
                {"Relancer "}
                <span className="num">{e.rerollCost}{" $"}</span>
              </button>
            )}
          <button className="fu-back" onClick={e.onShopClose}>Retour au plateau</button>
        </div>
      </>
    </Modal>
  );
}

export function Shop(e) {
  return (
    <div className={`shop ${e.shopClosed ? "closed" : ""}`}>
      {e.shopClosed && <div className="shop-closed">Boutique fermée pendant ce contrat</div>}
      <GoodieOffer
        id={e.goodieOffer}
        price={e.goodiePrice}
        budget={e.budget}
        disabled={e.locked || e.shopClosed}
        nextVersion={e.nextVersion}
        allCollected={e.goodiesDone}
        onBuy={e.onBuyGoodie}
      />
      <Arrivals
        available={e.packAvailable}
        price={e.packPrice}
        budget={e.budget}
        disabled={e.locked || e.shopClosed}
        onBuy={e.onBuyPack}
        arr={e.arr}
        taken={e.arrTaken}
        onBuySlot={e.onBuySlot}
      />
      <div className="shop-modules">
        {e.shop.map((t, o) => {
          if (t.kind !== "module") {
            return null;
          }
          let a = MODULES[t.defId];
          let r = e.budget >= t.price;
          return (
            <Tooltip
              key={o}
              content={<ModuleTip id={t.defId} level={1} edition={t.edition} />}
              className="offer-wrap"
            >
              <button
                className={`offer module-offer accent-${a.accent} ${t.edition ? `has-ed ed-offer-${t.edition}` : ""} ${t.sold ? "sold" : ""}`}
                disabled={t.sold || e.locked || e.shopClosed}
                onClick={() => e.onBuy(o)}
              >
                <span className="offer-icon"><ModuleIcon id={t.defId} size={26} /></span>
                <span className="offer-main">
                  <span className="offer-name">
                    {a.name}
                    {" "}
                    <span className={`fam fam-${a.family}`}>{FAMILY_LABELS[a.family]}</span>
                    {t.edition
                      && (
                        <span className={`ed-tag ed-tag-${t.edition}`}>
                          {EDITIONS[t.edition].name}
                        </span>
                      )}
                  </span>
                  <span className="offer-text">
                    {FX(a.describe(1))}
                    {t.edition && <b className="offer-ed">{" "}{EDITIONS[t.edition].text}</b>}
                  </span>
                </span>
                <span className={`price num ${r ? "" : "short"}`}>
                  {t.sold ? "Acheté" : `${t.price} $`}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
      <div className="shop-jokers">
        {e.shop.map((t, o) => {
          if (t.kind !== "joker") {
            return null;
          }
          let a = e.budget >= t.price;
          return (
            <Tooltip key={o} content={<PluginTip id={t.defId} />} className="offer-wrap">
              <button
                className={`joker-offer ${t.sold ? "sold" : ""}`}
                disabled={t.sold || e.locked || e.shopClosed}
                onClick={() => e.mobile && e.onInspectOffer ? e.onInspectOffer(o) : e.onBuy(o)}
                aria-label={`Recruter ${PLUGINS[t.defId].name} pour ${t.price} $`}
              >
                <PluginCard id={t.defId} variant="offer" />
                <span className={`price num ${a ? "" : "short"}`}>
                  {t.sold ? "Recruté" : `${t.price} $`}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
      <div className="shop-foot">
        <button
          className="ghost"
          disabled={e.locked || e.shopClosed || e.budget < e.rerollCost}
          onClick={e.onReroll}
        >
          Relancer (
          {e.rerollCost}
          {" $)"}
        </button>
        <span className="dim small">La boutique se renouvelle à chaque contrat.</span>
      </div>
    </div>
  );
}
