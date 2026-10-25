// Contrat livré, et fin de partie (victoire ou défaite).

import { PLUGINS, Phase, RULES } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { fmt } from "../format.js";
import { PluginMini } from "../components/PluginCard.jsx";
import { LoupNiel } from "../mascot/LoupNiel.jsx";
import { DEFEAT_QUOTES, VICTORY_QUOTES, quoteFor } from "../mascot/repliques.js";

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

// Confettis : positions et couleurs fixes (décor, sans hasard).
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({ left: (i * 37 + 11) % 100, delay: (i % 7) * 0.35, color: ["#ffb020", "#ff3b5c", "#5fe0ff", "#2bd96b", "#b99bff", "#ffcf4a"][i % 6], rot: (i * 53) % 180 }));

function Stat({ value, label }) {
  return <div><b className="num">{value}</b><span>{label}</span></div>;
}

/** La vraie victoire : Loup Niel félicite le joueur avec une réplique. */
function VictoryModal({ view, onNewRun }) {
  const plays = Object.values(view.architecturePlays).reduce((sum, count) => sum + count, 0);
  return (
    <Modal className="end-modal won victory">
      <div className="confetti" aria-hidden="true">
        {CONFETTI.map((piece, i) => <i key={i} style={{ left: `${piece.left}%`, background: piece.color, animationDelay: `${piece.delay}s`, "--rot": `${piece.rot}deg` }} />)}
      </div>
      <span className="vic-eyebrow">VERSION {view.lastVersion} · LIVRÉE</span>
      <h2 className="vic-title">Mise en prod<br />réussie !</h2>
      <div className="vic-wolf">
        <div className="vic-loup"><span className="vic-rays" aria-hidden="true" /><LoupNiel pose="bravo" className="vic-img" /></div>
        <p className="vic-bubble">{quoteFor(VICTORY_QUOTES, view.seed)}</p>
      </div>
      <p className="vic-sub">Les {view.contractCount} contrats sont livrés, {view.contract.name} compris.</p>
      <div className="vic-stats">
        <Stat value={`${view.contractCount}/${view.contractCount}`} label="CONTRATS" />
        <Stat value={plays} label="DÉPLOIEMENTS" />
        <Stat value={view.parc.length} label="MODULES" />
        <Stat value={`${view.pluginIds.length}/${RULES.maxPlugins}`} label="PLUGINS" />
      </div>
      {view.pluginIds.length > 0 && <div className="vic-label">TES PLUGINS</div>}
      <div className="end-jokers">
        {view.pluginIds.map((id) => <span key={id} title={PLUGINS[id].name}><PluginMini id={id} /></span>)}
      </div>
      <button className="deploy vic-btn" onClick={onNewRun} autoFocus>Nouvelle partie</button>
      <p className="dim small">Graine de la partie : {view.seed}</p>
    </Modal>
  );
}

/** La défaite : Loup Niel reste calme, l'objectif manqué est montré en barre. */
function DefeatModal({ view, onNewRun }) {
  const plays = Object.values(view.architecturePlays).reduce((sum, count) => sum + count, 0);
  const progress = Math.min(100, Math.round((view.score / view.contract.target) * 100));
  return (
    <Modal className="end-modal lost defeat">
      <span className="vic-eyebrow">VERSION {view.contract.version} · CONTRAT {view.contract.letter} · NON LIVRÉ</span>
      <h2 className="vic-title">Incident<br />en production</h2>
      <div className="vic-wolf">
        <div className="vic-loup"><LoupNiel pose="inquiet" className="vic-img" /></div>
        <p className="vic-bubble">{quoteFor(DEFEAT_QUOTES, view.seed)}</p>
      </div>
      <p className="vic-sub">{view.contract.name} n’a pas été livré.</p>
      <div className="vic-bar" role="progressbar" aria-valuemin={0} aria-valuemax={view.contract.target} aria-valuenow={view.score}><i style={{ width: `${progress}%` }} /></div>
      <p className="vic-bar-label num">{fmt(view.score)} / {fmt(view.contract.target)} Performance</p>
      <div className="vic-stats">
        <Stat value={`${view.contractIndex}/${view.contractCount}`} label="CONTRATS" />
        <Stat value={plays} label="DÉPLOIEMENTS" />
        <Stat value={view.parc.length} label="MODULES" />
        <Stat value={view.pluginIds.length} label="PLUGINS" />
      </div>
      {view.pluginIds.length > 0 && <div className="vic-label">TES PLUGINS</div>}
      <div className="end-jokers">
        {view.pluginIds.map((id) => <span key={id} title={PLUGINS[id].name}><PluginMini id={id} /></span>)}
      </div>
      <button className="deploy vic-btn" onClick={onNewRun} autoFocus>Rejouer</button>
      <p className="dim small">Graine de la partie : {view.seed}</p>
    </Modal>
  );
}

export function EndModal({ view, onNewRun }) {
  return view.phase === Phase.VICTORY ? <VictoryModal view={view} onNewRun={onNewRun} /> : <DefeatModal view={view} onNewRun={onNewRun} />;
}
