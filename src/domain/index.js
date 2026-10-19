// Porte d'entrée du domaine : ce que les autres couches ont le droit d'utiliser.
export { Run } from "./run/Run.js";
export { Phase } from "./run/Phase.js";
export { Refusal } from "./shared/Result.js";
export { OfferKind } from "./shop/Shop.js";
export { RULES, upgradeCost } from "./catalog/rules.js";
export { FAMILIES, FAMILY_IDS } from "./catalog/families.js";
export { MODULES, MODULE_IDS, familyOf } from "./catalog/modules.js";
export { PLUGINS } from "./catalog/plugins.js";
export { BOSSES } from "./catalog/bosses.js";
export { STARTERS } from "./catalog/starters.js";
export { ARCHITECTURES, ARCHITECTURE_BY_ID, architectureBase } from "./catalog/architectures.js";
export { CELLS, GRID_SIZE, CELL_COUNT, neighborCells } from "./board/grid.js";
export { Board } from "./board/Board.js";
export { frNumber } from "./shared/levels.js";
