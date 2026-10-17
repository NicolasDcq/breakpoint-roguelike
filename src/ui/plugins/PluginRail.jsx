// Rangée des Plugins équipés.

import { PLUGINS, pluginSellPrice } from "../../engine/plugins.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { pluginDrag, pluginDropZone } from "../pluginDnd.js";
import { PluginCard, PluginTip } from "./PluginCard.jsx";

export function PluginRail({ jokers, slots, disabled, pulse, locked, onMove, onSell, compact, onOpen }) {
  return compact
    ? (
      <section className="joker-rail compact" aria-label="Plugins équipés">
        <div className={`chip-row ${slots > 5 ? "many" : ""}`} style={{ "--slots": slots }}>
          {Array.from({ length: slots }, (i, c) => {
            let p = jokers[c];
            if (!p) {
              return <div key={`empty${c}`} className="joker-chip empty" aria-hidden="true" />;
            }
            let m = PLUGINS[p.defId];
            let y = pulse && pulse.uid === p.uid ? pulse : null;
            return (
              <button
                key={p.uid}
                className={`joker-chip r-${m.rarity} ${disabled.has(p.uid) ? "disabled" : ""} ${y ? "pulsing" : ""}`}
                style={{ "--j1": m.hue[0], "--j2": m.hue[1] }}
                onClick={() => onOpen?.(p.uid)}
                aria-label={`${c + 1}. ${m.name}`}
              >
                <span className="chip-order num">{c + 1}</span>
                <span className="chip-emoji" aria-hidden="true">{m.emoji}</span>
                <span className="chip-name">{m.name.replace(/^(Le |La |L’|L'|Les )/, "")}</span>
                {y && <span key={y.id} className="joker-pulse">{y.text}</span>}
              </button>
            );
          })}
        </div>
      </section>
    )
    : (
      <section className="joker-rail" aria-label="Plugins équipés">
        <div className="rail-label">
          <span>Plugins</span>
          <span className="num small">{jokers.length}/{slots}</span>
          <span className="dim small">Ils agissent de gauche à droite : l’ordre compte.</span>
        </div>
        <div className="rail-slots" style={{ "--slots": slots }}>
          {Array.from({ length: slots }, (i, c) => {
            let p = jokers[c];
            return p
              ? (
                <div key={p.uid} {...pluginDrag(c, jokers.length, p.uid, onMove, locked)}>
                  <Tooltip
                    content={<PluginTip id={p.defId} />}
                    disabled={locked}
                    className="joker-wrap"
                  >
                    <PluginCard
                      id={p.defId}
                      owned={p}
                      order={c + 1}
                      disabled={disabled.has(p.uid)}
                      disabledText={disabled.get(p.uid)}
                      note={PLUGINS[p.defId].copiesRight
                        ? jokers[c + 1]
                          ? `Copie : ${PLUGINS[jokers[c + 1].defId].name}`
                          : "Rien à copier à droite"
                        : undefined}
                      pulse={pulse && pulse.uid === p.uid ? pulse : null}
                      footer={!locked
                        && (
                          <div className="joker-actions">
                            <button
                              aria-label="Déplacer à gauche"
                              disabled={c === 0}
                              onClick={() => onMove(p.uid, -1)}
                            >
                              ‹
                            </button>
                            <button className="sell" onClick={() => onSell(p.uid)}>
                              Vendre +
                              {pluginSellPrice(p.defId)}
                              {" $"}
                            </button>
                            <button
                              aria-label="Déplacer à droite"
                              disabled={c === jokers.length - 1}
                              onClick={() => onMove(p.uid, 1)}
                            >
                              ›
                            </button>
                          </div>
                        )}
                    />
                  </Tooltip>
                </div>
              )
              : (
                <div
                  key={`empty${c}`}
                  {...locked ? {} : pluginDropZone(jokers.length, onMove)}
                  className="joker-empty"
                >
                  <span>Emplacement libre</span>
                </div>
              );
          })}
        </div>
      </section>
    );
}
