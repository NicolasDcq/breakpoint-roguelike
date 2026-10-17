// Fenêtre « Comment jouer ».

import { Modal } from "../common/Modal.jsx";
import { RulesList } from "./TitleScreen.jsx";

export function RulesModal({ onClose }) {
  return (
    <Modal className="rules-modal" onClose={onClose}>
      <h2 className="modal-title">Comment jouer</h2>
      <RulesList />
      <div className="legend">
        <span>
          <b className="c-compute">⚡ Compute</b>
          {" base du score, remis à zéro à chaque déploiement"}
        </span>
        <span>
          <b className="c-scale">× Scale</b>
          {" multiplicateur, repart de 1 à chaque déploiement"}
        </span>
        <span>
          <b className="c-data">◆ Data</b>
          {" stock persistant, pour améliorer ou alimenter les modules"}
        </span>
        <span><b className="c-budget">$ Budget</b>{" stock persistant, pour acheter"}</span>
      </div>
      <p className="dim small">
        {"Familles : chaque module appartient à une famille (Calcul, Stockage, Réseau, Business, Ops) ; certains modules et Plugins comptent les modules par famille. Fusion : deux modules identiques au niveau 3 fusionnent en une version 2.0 plus puissante et libèrent un emplacement. Utilitaires (Cache, Worker, Load Balancer) : ne produisent rien et ne consomment pas le boost du Cache. Réactivations : elles rejouent le Compute, le Scale, la Data et les $ (un module gagne au plus 3 / 4 / 5 $ par déploiement selon son niveau, le +1 $ de l’édition Freemium en plus), et une chaîne s’arrête au 2e niveau (DNS → Load Balancer → Serveur). Garde-fou : 1 000 activations par déploiement. Fin de contrat : "}
        3 $ + numéro du contrat
        , plus 2 $ par déploiement non utilisé. Entreprises : chacune a son plateau de départ, un avantage et une contrepartie, et ses propres difficultés à gagner une par une. Goodies : à chaque version, la boutique en vend un (hoodie, tote bag, gourde…). Son effet dure toute la run et il se colle sur ton laptop ; sa version améliorée ne peut sortir qu’une fois le premier acheté. Mises à jour de famille : chaque boutique vend un paquet (un seul, la relance ne le renouvelle pas) qui montre 3 familles tirées au hasard ; tu en gardes une, qui monte d’un niveau pour toute la run, sans limite (ou aucune). Calcul : +10 % de Compute par niveau ; Stockage : +10 % de Data ; Business : +10 % de $ ; Réseau : +0,05 de Scale par module Réseau au début du déploiement ; Ops : +0,03 de Scale à chaque réactivation d’un producteur.
      </p>
      <button className="deploy" onClick={onClose}>Compris</button>
    </Modal>
  );
}
