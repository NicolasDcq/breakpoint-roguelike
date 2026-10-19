// Effets d'un module en lignes : pastille, phrase, condition.

import { MODULES } from "../../domain/index.js";
import { LINE_CLASS } from "../visuals.js";
import { FX } from "../fx.jsx";

export function EffectLines({ moduleId, level, compact = false }) {
  return (
    <ol className={`effect-lines ${compact ? "compact" : ""}`}>
      {MODULES[moduleId].lines(level).map((line, index) => (
        <li key={index} className="el-row">
          <span className={`el-pill num ${LINE_CLASS[line.kind]}`}>{line.value}</span>
          <span className="el-text">{line.text}</span>
          {!compact && line.condition && <span className="el-cond">{FX(line.condition)}</span>}
        </li>
      ))}
    </ol>
  );
}
