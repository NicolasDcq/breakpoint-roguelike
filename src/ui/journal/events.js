// Traduction des événements du moteur en lignes de journal.

import { fmt, fmtDec } from "../../engine/format.js";
import { FUSED_MODULES } from "../../engine/fusedModules.js";
import { MODULES } from "../../engine/modules.js";
import { PLUGINS } from "../../engine/plugins.js";

export function describeEvent(e, t) {
  let o = (a) => {
    let r = t.find((n) => n.uid === a);
    return r ? `${PLUGINS[r.defId].emoji} ${PLUGINS[r.defId].name}` : "Plugin";
  };
  switch (e.t) {
    case "activate": {
      let a = MODULES[e.defId];
      let r = [];
      if (e.out.compute) {
        r.push(`+${fmt(e.out.compute)} ⚡`);
      }
      if (e.out.data) {
        r.push(`+${fmt(e.out.data)} ◆`);
      }
      if (e.out.scale) {
        r.push(`+${fmtDec(e.out.scale)} Scale`);
      }
      if (e.out.budget) {
        r.push(`+${fmt(e.out.budget)} $`);
      }
      if (a.kind === "utility") {
        r.push(e.defId === "cache" ? "arme un boost" : "lance des réactivations");
      }
      return {
        kind: e.retrigger ? "retrigger" : "module",
        depth: e.depth,
        slot: e.slot,
        title: `${e.retrigger ? "↺ " : ""}${e.fused ? FUSED_MODULES[e.defId].name : a.name}`,
        detail: [r.join("  "), e.sources.length ? `(${e.sources.join(", ")})` : ""].filter(Boolean).join(" "),
      };
    }
    case "fizzle":
      return {
        kind: "fail",
        depth: 0,
        slot: e.slot,
        title: `Échec en ${e.slot + 1}`,
        detail: e.reason,
      };
    case "boost":
      return {
        kind: "boost",
        depth: 0,
        slot: e.slot,
        title: `Boost en attente ×${fmtDec(e.mult)}`,
        detail: e.remaining > 1 ? `pour ${e.remaining} producteurs` : "pour le prochain producteur",
      };
    case "retrigger":
      return null;
    case "joker":
      return { kind: "joker", depth: 0, title: o(e.jokerUid), detail: e.text };
    case "limit":
      return { kind: "danger", depth: 0, title: "Limite atteinte", detail: e.text };
    case "info":
      return { kind: "info", depth: 0, title: e.text };
    case "end":
      return {
        kind: "end",
        depth: 0,
        title: `Performance : ${fmt(e.score)}`,
        detail: `${fmt(e.totals.compute)} ⚡ × ${fmtDec(e.totals.scale)}`,
      };
    case "destroy":
      return { kind: "danger", depth: 0, title: o(e.jokerUid), detail: e.text };
  }
}
