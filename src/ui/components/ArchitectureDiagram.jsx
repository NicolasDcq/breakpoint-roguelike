// Dessin d'une architecture : les modules qu'il faut poser, en petites tuiles.
// Mêmes modules = même icône ; les couleurs sont celles des familles.
// On comprend la règle d'un coup d'œil, sans connaître le nom.

import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { FAMILY_ACCENT } from "../visuals.js";
import { MODULES } from "../../domain/index.js";

const same = (moduleId, count) => Array(count).fill(moduleId);

/** Exemple de pose pour chaque architecture : des groupes de modules. */
export const ARCHITECTURE_EXAMPLES = {
  cinqneufs: [same("server", 3), same("micro", 2)],
  datacenter: [same("server", 5)],
  ferme: [same("server", 4)],
  hautedispo: [same("server", 3), same("database", 2)],
  stack: [["server", "micro", "api", "gpu", "lambda"]],
  fullstack: [["server", "database", "cdn", "saas", "cache"]],
  cluster: [same("server", 3)],
  double: [same("server", 2), same("database", 2)],
  redondance: [same("server", 2)],
  monolithe: [["server"]],
};

/** Ce que montre le dessin, en mots (pour les lecteurs d'écran et les infobulles). */
export const ARCHITECTURE_HINTS = {
  cinqneufs: "3 fois un module + 2 fois un autre, tous de la même famille",
  datacenter: "5 fois le même module",
  ferme: "4 fois le même module",
  hautedispo: "3 fois un module + 2 fois un autre",
  stack: "5 modules de la même famille",
  fullstack: "1 module de chaque famille",
  cluster: "3 fois le même module",
  double: "2 fois un module + 2 fois un autre",
  redondance: "2 fois le même module",
  monolithe: "n'importe quels modules",
};

export function ArchitectureDiagram({ id, size = 18 }) {
  return (
    <span className="arch-diagram" role="img" aria-label={ARCHITECTURE_HINTS[id]} style={{ "--mini": `${size + 8}px` }}>
      {ARCHITECTURE_EXAMPLES[id].map((group, groupIndex) => (
        <span key={groupIndex} className="arch-group">
          {group.map((moduleId, index) => (
            <span key={index} className={`arch-mini accent-${FAMILY_ACCENT[MODULES[moduleId].family]}`}>
              <ModuleIcon id={moduleId} size={size} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
