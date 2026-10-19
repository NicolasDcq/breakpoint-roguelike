// Aide du plateau (ordinateur) et rappel des cartes marquées pour la défausse.

export function SideDetail({ marked, desktop = false }) {
  let content = null;
  if (marked.length) {
    content = <p><b>{marked.length} carte{marked.length > 1 ? "s" : ""} à défausser.</b> Touche « Défausser » pour en piocher d’autres.</p>;
  } else if (desktop) {
    content = <p className="dim">Glisse une carte de ta main sur une case pour la poser. Glisse un module posé pour le déplacer, ou vers ta main pour le reprendre. Touche une tuile pour voir sa fiche.</p>;
  }
  return <aside className="side">{content && <div className="hint side-detail">{content}</div>}</aside>;
}
