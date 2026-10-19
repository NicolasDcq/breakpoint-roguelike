// Fenêtre modale générique.

import { useEffect } from "react";

export function Modal({ children, className = "", onClose }) {
  useEffect(
    () => {
      if (!onClose) {
        return;
      }
      let a = (r) => r.key === "Escape" && onClose();
      window.addEventListener("keydown", a);
      return () => window.removeEventListener("keydown", a);
    },
    [onClose],
  );
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        onClick={(a) => a.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
