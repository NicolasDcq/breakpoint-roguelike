// « Plus de place » : les 4 emplacements de Plugin sont pleins.
// Le nouveau Plugin en vedette, la rangée pour choisir celui qui laisse sa place,
// ce qu'on perd, et le compte (caisse + revente − prix).

import { useState } from "react";
import { PLUGINS, RULES, pluginSellPrice } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { FX } from "../fx.jsx";
import { PluginCard, PluginChip, PluginMini, PluginTip } from "../components/PluginCard.jsx";
import { Tooltip } from "../common/Tooltip.jsx";

const signed = (value) => `${value >= 0 ? "+" : "−"}${Math.abs(value)} $`;

function Ledger({ money, refund, price }) {
  const rest = money + refund - price;
  return (
    <div className="rp-ledger num">
      <span className="rp-lg cash">Caisse {money} $</span>
      {refund > 0 && <><span className="rp-op">+</span><span className="rp-lg refund">Revente {refund} $</span></>}
      <span className="rp-op">−</span>
      <span className="rp-lg cost">Prix {price} $</span>
      <span className="rp-op">=</span>
      <span className={`rp-lg ${rest >= 0 ? "total" : "missing"}`}>{rest >= 0 ? `${rest} $` : `${signed(rest)} : revends-en un`}</span>
    </div>
  );
}

export function ReplacePluginModal({ view, offer, desktop, onReplace, onClose }) {
  const [chosen, setChosen] = useState(null);
  const affordable = (id) => view.money + pluginSellPrice(id) >= offer.price;
  const refund = chosen ? pluginSellPrice(chosen) : 0;
  const option = (id, index) => {
    const state = chosen === null ? "" : chosen === id ? "sel" : "off";
    const button = (
      <button
        className={`rp-option ${state}`}
        aria-pressed={chosen === id}
        disabled={!affordable(id)}
        onClick={() => setChosen(chosen === id ? null : id)}
      >
        {desktop ? <PluginChip id={id} order={index + 1} /> : <PluginMini id={id} order={index + 1} />}
        <span className={`rp-sell num ${state === "sel" ? "on" : ""}`}>
          {!affordable(id) ? "Pas assez" : `${desktop ? (state === "sel" ? "Revendu " : "Revendre ") : ""}+${pluginSellPrice(id)} $`}
        </span>
      </button>
    );
    return desktop
      ? <Tooltip key={id} content={<PluginTip id={id} />} className="rp-wrap">{button}</Tooltip>
      : <span key={id} className="rp-wrap">{button}</span>;
  };
  return (
    <Modal className={`replace-modal ${desktop ? "desk" : ""}`} onClose={onClose}>
      <div className="rp-incoming">
        <div className="rp-head">
          <span className="rp-count num">{view.pluginIds.length} / {RULES.maxPlugins} emplacements</span>
          <h2 className="rp-title">Plus de place</h2>
          {!desktop && <p className="rp-sub">Un Plugin doit laisser sa place au nouveau.</p>}
        </div>
        <div className="rp-tags"><span className="rp-new">Nouveau</span><span className="rp-price num">{offer.price} $</span></div>
        {desktop
          ? <Tooltip content={<PluginTip id={offer.id} />} className="rp-card"><PluginChip id={offer.id} /></Tooltip>
          : <div className="rp-card"><PluginCard id={offer.id} /></div>}
      </div>
      <div className="rp-choose">
        {desktop
          ? <p className="rp-sub">Choisis le Plugin qui laisse sa place à <b>{PLUGINS[offer.id].name}</b>. Tu récupères la moitié de son prix.</p>
          : <div className="rp-arrow"><span>Prend la place de</span><b>▼</b></div>}
        {desktop && <div className="rp-gain"><b>Tu gagnes :</b> {PLUGINS[offer.id].name} — {FX(PLUGINS[offer.id].text)}</div>}
        <div className="rp-rail">{view.pluginIds.map(option)}</div>
        {chosen
          ? <div className="rp-lose"><b>Tu perds :</b> {PLUGINS[chosen].name} — {FX(PLUGINS[chosen].text)}</div>
          : <div className="rp-lose idle">Touche le Plugin qui laisse sa place. Tu récupères la moitié de son prix.</div>}
        <div className="rp-spacer" />
        <Ledger money={view.money} refund={refund} price={offer.price} />
        <div className="rp-actions">
          <button className="ghost rp-cancel" onClick={onClose}>Annuler</button>
          <button className="deploy rp-go" disabled={!chosen} onClick={() => onReplace(chosen)}>
            {chosen ? `Remplacer · ${signed(refund - offer.price)}` : "Touche un Plugin"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
