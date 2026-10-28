// Ce que fait chaque commande du Terminal (le catalogue est dans catalog/commands.js).
// Chaque effet reçoit la partie et les modules visés ; il rend un résultat : réussi (avec le détail
// à montrer au joueur) ou refusé. Il ne touche à la partie que par ses propriétés publiques.

import { ok, refuse, Refusal } from "../shared/Result.js";
import { Phase } from "./Phase.js";
import { RULES } from "../catalog/rules.js";
import { ARCHITECTURE_IDS } from "../catalog/architectures.js";

/** L'architecture la plus jouée de la partie ; à égalité, la jouée en dernier. Null si aucune. */
function mostPlayedArchitecture(run) {
  const plays = (id) => run.architecturePlays[id] ?? 0;
  const played = ARCHITECTURE_IDS.filter((id) => plays(id) > 0);
  if (!played.length) return null;
  const best = Math.max(...played.map(plays));
  const tied = played.filter((id) => plays(id) === best);
  return [...run.architectureOrder].reverse().find((id) => tied.includes(id)) ?? tied[0];
}

export const COMMAND_EFFECTS = {
  ping: (run) => {
    run.contractBonus = { ...run.contractBonus, deploys: run.contractBonus.deploys + 1 };
    run.round.deploysLeft++;
    return ok({ deploysLeft: run.round.deploysLeft });
  },
  ssh: (run) => {
    run.contractBonus = { ...run.contractBonus, maxPlaced: run.contractBonus.maxPlaced + 1 };
    return ok({ maxPlaced: run.limits.maxPlaced });
  },
  "ln -s": (run, [uid]) => {
    run.wildUid = uid;
    return ok({ uid });
  },
  cp: (run, [uid]) => {
    const source = run.card(uid);
    const copy = run.parc.add(source.moduleId, RULES.terminal.copyKeepsLevel ? source.level : 1);
    // Pendant un contrat, la copie rejoint la pioche, à une place au hasard.
    if (run.phase === Phase.PLAY) run.round.insertInDraw(copy.uid, run.rng.int(run.round.drawPile.length + 1));
    return ok({ uid: copy.uid, moduleId: copy.moduleId, parcSize: run.parc.size });
  },
  rm: (run, uids) => {
    if (run.parc.size - uids.length < RULES.minParcSize) return refuse(Refusal.PARC_TOO_SMALL);
    const inContract = run.phase === Phase.PLAY;
    // Pendant un contrat, on ne se retire pas les dernières cartes jouables.
    if (inContract && run.round.playableCount - uids.filter((uid) => run.round.whereIs(uid) !== "used").length <= 0) return refuse(Refusal.WOULD_LOSE);
    uids.forEach((uid) => {
      run.parc.remove(uid);
      if (inContract) run.round.forget(uid);
    });
    if (uids.includes(run.wildUid)) run.wildUid = null;
    if (inContract) run.round.drawUp(run.limits.handSize);
    return ok({ removed: uids.length, parcSize: run.parc.size });
  },
  motherlode: (run) => {
    const gain = Math.min(run.money, RULES.terminal.moneyDoubleMax);
    run.money += gain;
    return ok({ before: run.money - gain, gain, after: run.money });
  },
  mysqldump: (run) => {
    const gain = Math.min(run.data, RULES.terminal.dataDoubleMax);
    run.data += gain;
    return ok({ before: run.data - gain, gain, after: run.data });
  },
  "apt upgrade": (run) => {
    const id = mostPlayedArchitecture(run);
    if (!id) return refuse(Refusal.NO_ARCHITECTURE_PLAYED);
    const before = run.architectureLevels[id];
    run.architectureLevels = { ...run.architectureLevels, [id]: before + 1 };
    return ok({ architectureId: id, before, after: before + 1, plays: run.architecturePlays[id] });
  },
};
