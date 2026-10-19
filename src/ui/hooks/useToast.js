import { useCallback, useEffect, useRef, useState } from "react";

/** Message bref en bas de l'écran. */
export function useToast(duration = 2200) {
  const [text, setText] = useState(null);
  const timer = useRef(null);
  const show = useCallback((message) => {
    setText(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(null), duration);
  }, [duration]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [text, show];
}
