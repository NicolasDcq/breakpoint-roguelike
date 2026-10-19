// Aide du plateau (ordinateur) et consigne pendant la défausse.

export function SideDetail({ marked, discarding, desktop = false }) {
  let content = null;
  if (discarding) {
    content = marked.length
      ? <p><b>{marked.length} carte{marked.length > 1 ? "s" : ""} à défausser.</b> Touche « Confirmer » pour les jeter et piocher.</p>
      : <p><b>Défausse.</b> Touche les cartes de ta main à jeter, puis « Confirmer ». Sans carte choisie, « Confirmer » annule.</p>;
  } else if (desktop) {
    content = <p className="dim">Glisse une carte de ta main sur une case pour la poser. Glisse un module posé pour le déplacer, ou vers ta main pour le reprendre. Touche une tuile pour voir sa fiche.</p>;
  }
  return <aside className="side">{content && <div className="hint side-detail">{content}</div>}</aside>;
}
