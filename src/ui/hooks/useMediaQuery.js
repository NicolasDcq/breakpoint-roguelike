// Requêtes média (téléphone, écran tactile).

import { useEffect, useState } from "react";

const mediaQuery = (e) => typeof window < "u" && window.matchMedia ? window.matchMedia(e) : null;

export function useMediaQuery(e) {
  let [t, o] = useState(() => mediaQuery(e)?.matches ?? false);
  useEffect(
    () => {
      let a = mediaQuery(e);
      if (!a) {
        return;
      }
      let r = () => o(a.matches);
      r();
      a.addEventListener("change", r);
      return () => a.removeEventListener("change", r);
    },
    [e],
  );
  return t;
}

export const MOBILE_QUERY = "(max-width: 700px)";

export const IS_TOUCH = mediaQuery("(hover: none)")?.matches ?? false;
