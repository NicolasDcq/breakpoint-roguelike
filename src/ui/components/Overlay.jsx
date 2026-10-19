// Écran posé par-dessus le jeu (boutique, parc, règles…).
import { useEffect, useRef } from "react";

export function Overlay({ children, label }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.querySelector("button")?.focus({ preventScroll: true }); }, []);
  return (
    <div className="screen" role="dialog" aria-modal="true" aria-label={label}>
      <div className="sheet" ref={ref}>{children}</div>
    </div>
  );
}
