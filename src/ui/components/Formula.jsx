// Compute × Scale = score prévu.
import { frNumber } from "../../domain/index.js";

export function Formula({ compute, scale, score, pulse }) {
  return (
    <div className={`panel formula ${pulse ? "live" : ""}`} key={pulse}>
      <div className="box c num">{Math.round(compute)}</div>
      <span className="x">×</span>
      <div className="box s num">{frNumber(scale)}</div>
      <div className="eq"><span className="lbl">Prévu</span><b className="num">{score}</b></div>
    </div>
  );
}
