// La boutique : modules, Plugins, mises à jour d'architecture et services.

import { ARCHITECTURE_BY_ID, BOSSES, FAMILIES, MODULES, OfferKind, PLUGINS, RULES, architectureBase, upgradeCost } from "../../domain/index.js";
import { PLUGIN_ICONS, familyColor, moduleColor } from "../visuals.js";
import { EffectList } from "../components/EffectList.jsx";
import { LevelBars } from "../components/ModuleTile.jsx";
import { Overlay } from "../components/Overlay.jsx";

const BUY_STYLE = { minHeight: 40, fontSize: 15 };

function BuyButton({ offer, index, view, onBuy, className, label = "Acheter", soldLabel = "Acheté", blocked = null }) {
  const disabled = offer.sold || view.money < offer.price || Boolean(blocked);
  return (
    <button className={`btn ${className}`} style={BUY_STYLE} disabled={disabled} onClick={() => onBuy(index)}>
      {offer.sold ? soldLabel : blocked ?? label}
    </button>
  );
}

function ModuleOffer({ offer, index, view, onBuy }) {
  const module = MODULES[offer.id];
  return (
    <div className={`panel offer ${offer.sold ? "sold" : ""}`}>
      <div className="top"><b>{module.name}</b><span className="price">{offer.price} $</span></div>
      <span className="fam" style={{ background: familyColor(module.family), justifySelf: "start", width: "max-content" }}>{FAMILIES[module.family].name.toUpperCase()}</span>
      <EffectList moduleId={offer.id} level={1} />
      <BuyButton offer={offer} index={index} view={view} onBuy={onBuy} className="go" />
    </div>
  );
}

function PluginOffer({ offer, index, view, onBuy }) {
  const plugin = PLUGINS[offer.id];
  const full = view.pluginIds.length >= RULES.maxPlugins;
  return (
    <div className={`panel offer plug ${offer.sold ? "sold" : ""}`}>
      <div className="top"><b>{PLUGIN_ICONS[offer.id]} {plugin.name}</b><span className="price">{offer.price} $</span></div>
      <p style={{ fontSize: 13 }}>{plugin.text}</p>
      <BuyButton offer={offer} index={index} view={view} onBuy={onBuy} className="violet" blocked={full ? "Plus de place" : null} />
    </div>
  );
}

function ArchitectureOffer({ offer, index, view, onBuy }) {
  const architecture = ARCHITECTURE_BY_ID[offer.id];
  const level = view.architectureLevels[offer.id];
  const after = architectureBase(offer.id, level + 1);
  return (
    <div className={`panel offer up ${offer.sold ? "sold" : ""}`}>
      <div className="top"><b>{architecture.name}</b><span className="price">{offer.price} $</span></div>
      <span style={{ fontSize: 12, color: "var(--dim)" }}>{architecture.rule}</span>
      <p style={{ fontSize: 13 }}>Niv. {level} → {level + 1} : <span className="pill c">+{architecture.perLevel[0]} ⚡</span> <span className="pill s">+{architecture.perLevel[1]} ×</span></p>
      <p style={{ fontSize: 12, color: "var(--dim)" }}>Base après : {after.compute} ⚡ × {after.scale}</p>
      <BuyButton offer={offer} index={index} view={view} onBuy={onBuy} className="violet" label="Installer" soldLabel="Installée" />
    </div>
  );
}

const OFFER_SECTIONS = [
  { kind: OfferKind.MODULE, title: "Modules · ils rejoignent ton parc", Component: ModuleOffer },
  { kind: OfferKind.PLUGIN, title: (view) => `Plugins · ${view.pluginIds.length}/${RULES.maxPlugins} · effets permanents`, Component: PluginOffer },
  { kind: OfferKind.ARCHITECTURE, title: "Mises à jour · font monter une architecture d'un niveau", Component: ArchitectureOffer },
];

/** Choisir un module du parc, pour l'améliorer ou le retirer. */
function ParcPicker({ view, mode, onPick, onCancel }) {
  const upgrading = mode === "upgrade";
  return (
    <div className="panel" style={{ padding: 10, display: "grid", gap: 10 }}>
      <div className="lbl" style={{ color: "var(--lime)" }}>{upgrading ? "Améliorer un module du parc (coût en ◆)" : `Retirer un module du parc (${RULES.minParcSize} modules minimum)`}</div>
      <div className="list">
        {view.parc.map((card) => {
          const cost = upgradeCost(card.level);
          const disabled = upgrading ? !cost || view.data < cost : view.money < view.removePrice || !view.canRemove;
          return (
            <button key={card.uid} className="mini pick" style={{ "--acc": moduleColor(card.moduleId), opacity: disabled ? 0.4 : 1 }} disabled={disabled} onClick={() => onPick(card.uid)}>
              <span className="band" style={{ background: moduleColor(card.moduleId) }} />
              <span className="tname">{MODULES[card.moduleId].shortName}</span>
              <LevelBars level={card.level} />
              <span className="tval">{upgrading ? (cost ? `${cost} ◆` : "max") : `${view.removePrice} $`}</span>
            </button>
          );
        })}
      </div>
      <button className="btn discard" onClick={onCancel}>Retour à la boutique</button>
    </div>
  );
}

export function ShopScreen({ view, mode, actions }) {
  const next = view.nextContract;
  return (
    <Overlay label="Boutique">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div className="title-neon">BOUTIQUE</div>
        <div className="res num" style={{ fontSize: 16 }}><span className="m">{view.money} $</span><span className="d">{view.data} ◆</span></div>
      </div>
      {mode ? (
        <ParcPicker view={view} mode={mode} onPick={mode === "upgrade" ? actions.upgrade : actions.remove} onCancel={() => actions.setMode(null)} />
      ) : (
        <>
          {OFFER_SECTIONS.map(({ kind, title, Component }) => (
            <section key={kind} style={{ display: "contents" }}>
              <div className="lbl">{typeof title === "function" ? title(view) : title}</div>
              <div className="offers">
                {view.offers.map((offer, index) => (offer.kind === kind ? <Component key={index} offer={offer} index={index} view={view} onBuy={actions.buy} /> : null))}
              </div>
            </section>
          ))}
          <div className="lbl">Services</div>
          <div className="row">
            <button className="btn discard" onClick={() => actions.setMode("upgrade")}>Améliorer un module (◆)</button>
            <button className="btn discard" onClick={() => actions.setMode("remove")}>Retirer un module ({view.removePrice} $)</button>
            <button className="btn discard" disabled={view.money < view.rerollPrice} onClick={actions.reroll}>Relancer ({view.rerollPrice} $)</button>
          </div>
        </>
      )}
      <div className="panel" style={{ padding: "8px 12px" }}>
        <span className="lbl">Prochain contrat</span>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
          <b>V{next.version}{next.letter} · {next.name}</b><b className="num" style={{ color: "var(--amber)" }}>{next.target}</b>
        </div>
        {BOSSES[next.boss] && <div className="head-rule" style={{ marginTop: 4 }}>⚠ {BOSSES[next.boss].rule}</div>}
      </div>
      <div className="row">
        <button className="btn discard" onClick={actions.showArchitectures}>Architectures</button>
        <button className="btn discard" onClick={actions.showParc}>Parc ({view.parc.length})</button>
      </div>
      <button className="btn go" onClick={actions.next}>CONTRAT SUIVANT</button>
    </Overlay>
  );
}
