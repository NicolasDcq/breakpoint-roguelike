// Son joué après chaque action du joueur.

import { sfx } from "../audio/sfx.js";
import { runReducer } from "../engine/reducer.js";

export function playActionSound(e, t) {
  let o = runReducer(e, t);
  if (o !== e) {
    if (o.notice && o.notice !== e.notice && o.notice.tone === "error") {
      sfx.error();
      return;
    }
    switch (t.type) {
      case "BUY":
        sfx.cash();
        break;
      case "BUY_GOODIE":
        sfx.goodie();
        break;
      case "BUY_PACK":
        sfx.pack();
        break;
      case "SKIP_PACK":
        sfx.click();
        break;
      case "SELL_MODULE":
      case "SELL_PLUGIN":
        sfx.sell();
        break;
      case "UPGRADE":
      case "CHOOSE_STARTER":
        sfx.upgrade();
        break;
      case "FUSE":
        sfx.fusion();
        break;
      case "UNLOCK":
        sfx.unlock();
        break;
      case "REROLL":
        sfx.reroll();
        break;
      case "CHOOSE_REWARD":
      case "SKIP_REWARD":
        sfx.upgrade();
        break;
      case "MOVE_MODULE":
      case "MOVE_PLUGIN":
        sfx.click();
        break;
    }
  }
}
