// Calcul d'un déploiement. Fonction pure : elle ne modifie rien et rend le détail.
// 1. L'architecture posée donne la base (Compute et Scale de départ).
// 2. Chaque case s'active dans l'ordre et améliore cette base.
// 3. Les Plugins de fin agissent en dernier.

import { CELLS } from "../board/grid.js";
import { MODULES, familyOf } from "../catalog/modules.js";
import { PLUGINS } from "../catalog/plugins.js";
import { blockedBy } from "../catalog/bosses.js";
import { architectureBase, detectArchitecture } from "../catalog/architectures.js";
import { createActivationContext } from "./ActivationContext.js";

const MAX_ACTIVATIONS = 200;
const round2 = (value) => Math.round(value * 100) / 100;
const hasOutput = (output) => output.compute || output.scale || output.data || output.money;

/**
 * @param {object} input
 * @param {(object|null)[]} input.cards   les 9 cases : une carte ou null
 * @param {string[]} input.pluginIds
 * @param {string|null} input.bossId
 * @param {number} input.dataStock
 * @param {number} input.money
 * @param {Record<string, number>} input.architectureLevels
 * @param {number} input.parcSize
 */
export function scoreDeployment({ cards, pluginIds, bossId = null, dataStock, money, architectureLevels, parcSize }) {
  const plugins = pluginIds.map((id) => PLUGINS[id]);
  const placed = cards.filter(Boolean);
  const result = { compute: 0, scale: 1, data: 0, money: 0, events: [], fired: new Set(), placed, count: placed.length, architecture: null, score: 0 };
  const state = {
    result,
    stock: { data: dataStock, money },
    boost: null,
    queue: 0,
    activations: 0,
    spend(resource, amount) {
      if (this.stock[resource] < amount) return false;
      this.stock[resource] -= amount;
      result[resource] -= amount;
      return true;
    },
  };

  // 1. La base : l'architecture.
  const found = detectArchitecture(placed, familyOf);
  const level = architectureLevels[found.id] ?? 1;
  const base = architectureBase(found.id, level);
  result.architecture = { id: found.id, level, ...base, members: found.members };
  if (placed.length) {
    result.compute = base.compute;
    result.scale = base.scale;
  }

  // 2. Le plateau, case par case.
  const activate = (cell, depth, isRetrigger) => {
    if (state.activations++ > MAX_ACTIVATIONS) return;
    const card = cards[cell];
    if (!card) return;
    const blocked = blockedBy(bossId, cell, card);
    if (blocked) {
      result.events.push({ cell, failure: blocked });
      return;
    }
    const module = MODULES[card.moduleId];
    const output = { compute: 0, scale: 0, data: 0, money: 0, failure: null };
    const pending = [];
    const ctx = createActivationContext({ cell, depth, cards, state, output, pending });
    module.effect(ctx, card.level);
    if (output.failure) {
      result.events.push({ cell, failure: output.failure });
      return;
    }
    let multiplier = 1;
    if (module.producer) {
      for (const plugin of plugins) {
        const factor = plugin.multiplier?.(card, ctx) ?? 1;
        if (factor !== 1) {
          multiplier *= factor;
          result.fired.add(plugin.id);
        }
      }
      if (state.boost && hasOutput(output)) {
        multiplier *= state.boost;
        state.boost = null;
      }
    }
    const final = {
      compute: Math.round(output.compute * multiplier),
      scale: round2(output.scale * multiplier),
      data: Math.round(output.data * multiplier),
      money: Math.round(output.money * multiplier),
    };
    result.compute += final.compute;
    result.scale += final.scale;
    result.data += final.data;
    result.money += final.money;
    state.stock.data += final.data;
    state.stock.money += final.money;
    result.events.push({ cell, output: final, multiplier, isRetrigger });
    plugins.forEach((plugin) => plugin.afterActivation?.(card, ctx));
    if (isRetrigger) {
      plugins.filter((plugin) => plugin.onRetrigger).forEach((plugin) => {
        plugin.onRetrigger(ctx);
        result.fired.add(plugin.id);
      });
    }
    if (module.producer && state.queue > 0 && !isRetrigger) {
      state.queue--;
      pending.push(cell);
    }
    pending.forEach((target) => activate(target, depth + 1, true));
  };
  CELLS.forEach((cell) => activate(cell, 0, false));

  // 3. Les Plugins de fin.
  for (const plugin of plugins) {
    if (plugin.atEnd?.(result, { parcSize })) result.fired.add(plugin.id);
  }
  result.scale = round2(result.scale);
  result.score = Math.round(result.compute * result.scale);
  result.fired = [...result.fired];
  return result;
}
