// Contrat livré, et fin de partie (victoire ou défaite).

import { PLUGINS, Phase } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { fmt } from "../format.js";
import { PLUGIN_LOOK } from "../visuals.js";

export function WonModal({ view, onShop }) {
  const { contract, score, lastPay } = view;
  return (
    <Modal className="end-modal won">
      <h2 className="end-title">Contrat livré</h2>
      <p className="modal-sub">{contract.name} : {fmt(score)} sur {fmt(contract.target)}.</p>
      <div className="stats">
        <div><span className="num">+{lastPay.pay} $</span><span>paiement</span></div>
        <div><span className="num">+{lastPay.left} $</span><span>déploiements non utilisés</span></div>
        {lastPay.interest > 0 && <div><span className="num">+{lastPay.interest} $</span><span>intérêts du Comptable</span></div>}
        <div><span className="num">{view.money} $</span><span>en caisse</span></div>
        <div><span className="num">{view.data} ◆</span><span>Data en stock</span></div>
      </div>
      <button className="deploy" onClick={onShop}>Boutique</button>
    </Modal>
  );
}

export function EndModal({ view, onNewRun }) {
  const victory = view.phase === Phase.VICTORY;
  const total = view.contracts.length;
  const delivered = victory ? total : view.contractIndex;
  const plays = Object.values(view.architecturePlays).reduce((sum, count) => sum + count, 0);
  return (
    <Modal className={`end-modal ${victory ? "won" : "lost"}`}>
      <h2 className="end-title">{victory ? "Mise en production réussie" : "Incident en production"}</h2>
      <p className="modal-sub">
        {victory
          ? `Les ${total} contrats sont livrés, ${view.contracts.at(-1).name} compris.`
          : `${view.contract.name} n’a pas été livré : ${fmt(view.score)} sur ${fmt(view.contract.target)}.`}
      </p>
      <div className="stats">
        <div><span className="num">{delivered}/{total}</span><span>contrats livrés</span></div>
        <div><span className="num">{view.parc.length}</span><span>modules dans le parc</span></div>
        <div><span className="num">{plays}</span><span>déploiements</span></div>
      </div>
      <div className="end-jokers">
        {view.pluginIds.map((id) => <span key={id} className="end-joker" title={PLUGINS[id].name}>{PLUGIN_LOOK[id]?.emoji}</span>)}
      </div>
      <p className="dim small">Graine de la partie : {view.seed}</p>
      <button className="deploy" onClick={onNewRun}>Nouvelle partie</button>
    </Modal>
  );
}
