import { RULES } from "../../domain/index.js";
import { Overlay } from "../components/Overlay.jsx";

export function RulesScreen({ onClose }) {
  return (
    <Overlay label="Règles">
      <div className="title-neon">BREAKPOINT</div>
      <p style={{ color: "var(--dim)" }}>Le Parc · un roguelike de modules informatiques.</p>
      <div className="panel" style={{ padding: "10px 14px" }}>
        <ul className="rules" style={{ paddingLeft: 18, margin: 0 }}>
          <li>Ton <b>parc</b> est ta collection de modules, comme un paquet de cartes ({RULES.startParc.length} au départ).</li>
          <li>À chaque contrat, tu as <b>{RULES.deploysPerContract} déploiements</b> et <b>{RULES.discardsPerContract} défausses</b>. Ta main contient <b>{RULES.handSize} modules</b> piochés au hasard.</li>
          <li>Pose jusqu'à <b>{RULES.maxPlaced} modules</b> sur le plateau 3×3, puis <b>déploie</b>. L'ordre des numéros et les voisins comptent.</li>
          <li>Score d'un déploiement : <b>Compute × Scale</b>, en partant de la base de l'architecture. Les déploiements s'additionnent jusqu'à l'objectif.</li>
          <li><b>Architectures</b>, comme les mains au poker : 2 modules identiques font une <b>Redondance</b>, 3 un <b>Cluster</b>, 3+2 une <b>Haute dispo</b>, les 5 familles un <b>Full-stack</b>… La plus forte donne la <b>base</b> du déploiement (par exemple 10 ⚡ × 2 pour une Redondance). Ensuite, chaque module posé améliore cette base.</li>
          <li>Chaque famille a son rôle. Seuls les modules <b>Calcul</b> produisent du Compute ⚡. Les autres apportent du Scale ×, de la Data ◆, des $ ou des réactivations, sauf si leur effet dit autre chose.</li>
          <li>Les modules joués ou défaussés <b>ne reviennent pas avant le contrat suivant</b>. Si la pioche est vide, le contrat est perdu.</li>
          <li>En boutique : achète des modules, des Plugins et des <b>mises à jour d'architecture</b>, <b>retire</b> les modules faibles, <b>améliore</b> avec la Data ◆.</li>
          <li>12 contrats en 4 versions. Le contrat C de chaque version a une contrainte.</li>
        </ul>
      </div>
      <button className="btn go" onClick={onClose}>JOUER</button>
    </Overlay>
  );
}
