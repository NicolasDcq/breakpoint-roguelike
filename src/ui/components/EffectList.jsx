// Les lignes d'effet d'un module, avec leur pastille de couleur.

import { Fragment } from "react";
import { MODULES } from "../../domain/index.js";
import { PILL_CLASS } from "../visuals.js";

export function EffectList({ moduleId, level }) {
  return (
    <div className="eff">
      {MODULES[moduleId].lines(level).map((line, index) => (
        <Fragment key={index}>
          <span className={`pill ${PILL_CLASS[line.kind]}`}>{line.value}</span>
          <span>{line.text}</span>
          {line.condition && <span className="cond">{line.condition}</span>}
        </Fragment>
      ))}
    </div>
  );
}
