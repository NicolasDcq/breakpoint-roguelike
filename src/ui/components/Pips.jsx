// Petites cases allumées : déploiements ou défausses restants.
export function Pips({ total, left, className = "" }) {
  return (
    <span className={`pips ${className}`} aria-label={`${left} sur ${total}`}>
      {Array.from({ length: total }, (_, index) => <i key={index} className={index < left ? "on" : ""} />)}
    </span>
  );
}
