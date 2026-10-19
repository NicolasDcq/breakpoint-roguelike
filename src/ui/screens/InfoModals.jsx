// Fenêtres d'information : règles, architectures, parc, Plugin, nouvelle partie.

import { ARCHITECTURES, PLUGINS, RULES, architectureBase } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { tileClasses } from "../visuals.js";
import { ArchitecturePills } from "../components/ArchitectureLine.jsx";
import { ModuleFace } from "../components/ModuleFace.jsx";
import { PluginCard } from "../components/PluginCard.jsx";

export function RulesModal({ onClose }) {
  return (
    <Modal className="rules-modal" onClose={onClose}>
      <h2 className="modal-title">Comment jouer</h2>
      <ol className="rules">
        <li><b>Ton parc est ton paquet de cartes</b> ({RULES.startParc.length} modules au départ). À chaque contrat, tu pioches une main de {RULES.handSize} modules.</li>
        <li><b>Pose jusqu’à {RULES.maxPlaced} modules</b> sur le plateau 5×5, puis déploie. Ils s’activent dans l’ordre des numéros (1 → 25) ; l’ordre et les voisins comptent.</li>
        <li><b>Performance = Compute ⚡ × Scale.</b> L’architecture formée par les modules posés donne la base, puis chaque module l’améliore. Les déploiements s’additionnent jusqu’à l’objectif.</li>
        <li><b>Architectures</b>, comme les mains au poker : 2 identiques font une Redondance, 3 un Cluster, 3 + 2 une Haute dispo, les 5 familles un Full-stack…</li>
        <li><b>Seuls les modules Calcul produisent du Compute.</b> Les autres apportent Scale, Data, $ ou réactivations, sauf si leur effet dit autre chose.</li>
        <li><b>{RULES.deploysPerContract} déploiements et {RULES.discardsPerContract} défausses par contrat.</b> Une carte jouée ou défaussée ne revient qu’au contrat suivant ; pioche vide, contrat perdu.</li>
        <li><b>En boutique</b> : modules, Plugins (jusqu’à {RULES.maxPlugins}), mises à jour d’architecture, amélioration avec la Data ◆, retrait de modules.</li>
      </ol>
      <div className="legend">
        <span><b className="c-compute">⚡ Compute</b> base du score, repart de l’architecture à chaque déploiement</span>
        <span><b className="c-scale">× Scale</b> multiplicateur, repart de l’architecture à chaque déploiement</span>
        <span><b className="c-data">◆ Data</b> stock persistant, pour améliorer ou alimenter les modules</span>
        <span><b className="c-budget">$ Budget</b> stock persistant, pour acheter</span>
      </div>
      <button className="deploy" onClick={onClose}>Compris</button>
    </Modal>
  );
}

export function ArchitecturesModal({ view, onClose }) {
  const current = view.placedCount ? view.preview.architecture.id : null;
  return (
    <Modal className="rules-modal arch-modal" onClose={onClose}>
      <h2 className="modal-title">Architectures</h2>
      <p className="dim small">La plus forte formée par les modules posés donne la base du déploiement, quelle que soit leur place. Les mises à jour de la boutique la font monter de niveau.</p>
      <ol className="arch-list">
        {ARCHITECTURES.map((architecture) => {
          const level = view.architectureLevels[architecture.id];
          const plays = view.architecturePlays[architecture.id];
          return (
            <li key={architecture.id} className={current === architecture.id ? "current" : ""}>
              <span className="arch-name">{architecture.name} <i className="num">niv. {level}</i></span>
              <span className="arch-rule">{architecture.rule}{plays ? ` · jouée ${plays} fois` : ""}</span>
              <ArchitecturePills {...architectureBase(architecture.id, level)} />
            </li>
          );
        })}
      </ol>
      <button className="deploy" onClick={onClose}>Retour</button>
    </Modal>
  );
}

export function ParcModal({ view, onClose }) {
  return (
    <Modal className="rules-modal parc-modal" onClose={onClose}>
      <h2 className="modal-title">Ton parc · {view.parc.length} modules</h2>
      <p className="dim small">Il reste {view.drawCount} cartes dans la pioche de ce contrat ({view.playedCount} jouées ou défaussées : elles reviennent au contrat suivant).</p>
      <div className="parc-grid">
        {view.parc.map((card) => (
          <div key={card.uid} className="slot drawer-slot filled parc-cell">
            <div className={tileClasses(card)}><ModuleFace card={card} /></div>
          </div>
        ))}
      </div>
      <button className="deploy" onClick={onClose}>Retour</button>
    </Modal>
  );
}

export function PluginModal({ id, onClose }) {
  return (
    <Modal className="plugin-modal" onClose={onClose}>
      <PluginCard id={id} variant="rail" />
      <p className="dim small">{PLUGINS[id].text}</p>
      <button className="deploy" onClick={onClose}>Fermer</button>
    </Modal>
  );
}

export function ConfirmNewRun({ onYes, onNo }) {
  return (
    <Modal className="confirm-modal quit-modal" onClose={onNo}>
      <h2 className="modal-title">Nouvelle partie ?</h2>
      <p className="qm-warn">La partie en cours sera perdue.</p>
      <div className="qm-acts">
        <button className="qm-stay" onClick={onNo} autoFocus>Je reste</button>
        <button className="deploy danger qm-quit" onClick={onYes}>Nouvelle partie</button>
      </div>
    </Modal>
  );
}
