// Fenêtres d'information : règles, architectures, parc, Plugin, nouvelle partie.

import { ARCHITECTURES, CELL_COUNT, CardPlace, GRID_SIZE, PACKS, PLUGINS, RULES, architectureBase } from "../../domain/index.js";
import { Modal } from "../common/Modal.jsx";
import { tileClasses } from "../visuals.js";
import { ArchitecturePills } from "../components/ArchitectureLine.jsx";
import { ArchitectureDiagram, ARCHITECTURE_HINTS } from "../components/ArchitectureDiagram.jsx";
import { ModuleFace } from "../components/ModuleFace.jsx";
import { PluginCard } from "../components/PluginCard.jsx";

export function RulesModal({ onClose }) {
  return (
    <Modal className="rules-modal" onClose={onClose}>
      <h2 className="modal-title">Comment jouer</h2>
      <ol className="rules">
        <li><b>Ton parc est ton paquet de cartes</b> ({RULES.startParcSize} modules au départ, selon le profil tiré). À chaque contrat, tu pioches une main de {RULES.handSize} modules.</li>
        <li><b>Pose jusqu’à {RULES.maxPlaced} modules</b> sur le plateau {GRID_SIZE}×{GRID_SIZE}, puis déploie. Ils s’activent dans l’ordre des numéros (1 → {CELL_COUNT}) ; l’ordre et les voisins comptent.</li>
        <li><b>Performance = Compute ⚡ × Scale.</b> L’architecture formée par les modules posés donne la base, puis chaque module l’améliore. Les déploiements s’additionnent jusqu’à l’objectif.</li>
        <li><b>Architectures</b>, comme les mains au poker : 2 identiques font une Redondance, 3 un Cluster, 3 + 2 une Haute dispo, les 5 familles un Full-stack…</li>
        <li><b>Seuls les modules Calcul produisent du Compute.</b> Les autres apportent Scale, Data, $ ou réactivations, sauf si leur effet dit autre chose.</li>
        <li><b>{RULES.deploysPerContract} déploiements et {RULES.discardsPerContract} défausses par contrat.</b> Une carte jouée ou défaussée ne revient qu’au contrat suivant ; pioche vide, contrat perdu.</li>
        <li><b>Chaque partie est différente</b> : profil de départ, clients, objectifs et boss sont tirés au hasard. Tu découvres les boss d’une version en y arrivant.</li>
        <li><b>En boutique</b> : l’arrivage (2 emplacements au hasard : colis de modules, boosters de plans ou Pack de Plugins ; tu en gardes une carte), des Plugins (jusqu’à {RULES.maxPlugins}, plus ou moins rares) et des <b>commandes du Terminal</b> ({RULES.terminal.slots} emplacements, {RULES.terminal.price} $ pièce, un Pack Terminal à {PACKS.terminal.price} $ en donne une au hasard). Une commande se consomme : <b>cp</b>, <b>rm</b>, <b>ln -s</b>, <b>motherlode</b>, <b>mysqldump</b> et <b>apt upgrade</b> s’utilisent à la boutique ; <b>ping</b> (+1 déploiement) et <b>ssh</b> (+1 module posé) pendant un contrat ; <b>!!</b> rejoue la dernière.</li>
        <li><b>Améliorer un module</b> : touche-le en partie (en main ou posé) et paie en Data ◆. Il garde son niveau pour toute la partie.</li>
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
      <p className="dim small">La plus forte formée par les modules posés donne la base du déploiement, quelle que soit leur place. Les plans trouvés dans les boosters de la boutique la font monter de niveau.</p>
      <ol className="arch-list">
        {ARCHITECTURES.map((architecture) => {
          const level = view.architectureLevels[architecture.id];
          const plays = view.architecturePlays[architecture.id];
          return (
            <li key={architecture.id} className={current === architecture.id ? "current" : ""}>
              <span className="arch-name">{architecture.name} <i className="num">niv. {level}</i></span>
              <span className="arch-pose"><ArchitectureDiagram id={architecture.id} size={14} /></span>
              <span className="arch-rule">{ARCHITECTURE_HINTS[architecture.id]}{plays ? ` · jouée ${plays} fois` : ""}</span>
              <ArchitecturePills {...architectureBase(architecture.id, level)} />
            </li>
          );
        })}
      </ol>
      <button className="deploy" onClick={onClose}>Retour</button>
    </Modal>
  );
}

const PLACE_LABEL = { [CardPlace.HAND]: "En main", [CardPlace.BOARD]: "Posé" };
const PLACE_ORDER = { [CardPlace.DRAW]: 0, [CardPlace.HAND]: 1, [CardPlace.BOARD]: 1, [CardPlace.USED]: 2 };

export function ParcModal({ view, onClose }) {
  // D'abord ce qui reste à piocher, puis la main et le plateau, puis ce qui est déjà utilisé.
  const cards = view.parc
    .map((card) => ({ card, place: view.placeOf(card.uid) }))
    .sort((a, b) => PLACE_ORDER[a.place] - PLACE_ORDER[b.place]);
  const count = (place) => cards.filter((entry) => entry.place === place).length;
  return (
    <Modal className="rules-modal parc-modal" onClose={onClose}>
      <h2 className="modal-title">Ton parc · {view.parc.length} modules</h2>
      <div className="parc-legend">
        <span><b className="num">{count(CardPlace.DRAW)}</b> dans la pioche</span>
        <span><b className="num">{count(CardPlace.HAND) + count(CardPlace.BOARD)}</b> en main</span>
        <span className="used"><b className="num">{count(CardPlace.USED)}</b> utilisés</span>
      </div>
      <p className="dim small">Les modules grisés ont été joués ou défaussés : ils reviennent au contrat suivant.</p>
      <div className="parc-grid">
        {cards.map(({ card, place }) => (
          <div key={card.uid} className={`slot drawer-slot filled parc-cell place-${place}`}>
            <div className={tileClasses(card)}><ModuleFace card={card} /></div>
            {PLACE_LABEL[place] && <span className="parc-badge">{PLACE_LABEL[place]}</span>}
          </div>
        ))}
      </div>
      <button className="deploy" onClick={onClose}>Retour</button>
    </Modal>
  );
}

export function PluginModal({ id, value = null, onClose }) {
  return (
    <Modal className="plugin-modal" onClose={onClose}>
      <PluginCard id={id} value={value} />
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
