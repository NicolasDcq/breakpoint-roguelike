// Choix du premier Plugin.

import * as React from "react";
import { sfx } from "../../audio/sfx.js";
import { PLUGINS } from "../../engine/plugins.js";
import { PluginCard } from "../plugins/PluginCard.jsx";

export function PickStarter({ ids, onPick, J }) {
  let R2 = React;
  let [c, f2] = R2.useState(null);
  return (
    <div className="pack-table box-table pick-box">
      <div className="box-cards">
        {ids.map((N, w) => (
          <button
            key={N}
            className={`box-card ${c === N ? "sel" : ""}`}
            style={{ "--i": w }}
            onClick={() => {
              sfx.click();
              f2(N);
            }}
            aria-pressed={c === N}
            aria-label={`Choisir ${PLUGINS[N].name}`}
          >
            <PluginCard id={N} variant="offer" />
          </button>
        ))}
      </div>
      <div className="pack-actions">
        <button
          className="primary pack-take"
          disabled={!c}
          onClick={() => {
            if (c) {
              sfx.upgrade();
              onPick(c);
            }
          }}
        >
          {c ? `Commencer avec : ${PLUGINS[c].name}` : "Touche un Plugin"}
        </button>
      </div>
    </div>
  );
}
