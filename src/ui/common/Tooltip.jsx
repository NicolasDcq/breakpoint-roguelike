// Infobulle.

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IS_TOUCH } from "../hooks/useMediaQuery.js";

export function Tooltip({ content, children, className, disabled, touch }) {
  let n = disabled || IS_TOUCH && !touch;
  let l = useRef(null);
  let d = useRef(null);
  let [u, i] = useState(false);
  let [c, p] = useState({ x: 0, y: 0, below: false });
  useLayoutEffect(
    () => {
      if (!u || !l.current || !d.current) {
        return;
      }
      let v = l.current.getBoundingClientRect();
      let w = d.current.getBoundingClientRect();
      let T = 10;
      let te = v.left + v.width / 2 - w.width / 2;
      te = Math.max(T, Math.min(te, window.innerWidth - w.width - T));
      let H = v.top - w.height - T < 0;
      let N = H ? v.bottom + T : v.top - w.height - T;
      p({ x: te, y: N, below: H });
    },
    [u, content],
  );
  let m = () => !n && i(true);
  let y = () => i(false);
  return (
    <div
      ref={l}
      className={className}
      onMouseEnter={m}
      onMouseLeave={y}
      onFocus={m}
      onBlur={y}
      onPointerDown={y}
    >
      {children}
      {u
        && !n
        && createPortal(
          <div
            ref={d}
            className={`tooltip ${c.below ? "below" : ""}`}
            style={{ left: c.x, top: c.y }}
            role="tooltip"
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}
