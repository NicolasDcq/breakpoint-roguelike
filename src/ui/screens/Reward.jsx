// Récompense de fin de version (ordinateur et téléphone).

import * as React from "react";
import { ruleText } from "../../engine/contracts.js";
import { fmt } from "../../engine/format.js";
import { MODULES } from "../../engine/modules.js";
import { PLUGINS, RARITY_LABELS, pluginSellPrice } from "../../engine/plugins.js";
import { pluginSlots } from "../../engine/run.js";
import { Modal } from "../common/Modal.jsx";
import { ModuleIcon } from "../common/ModuleIcon.jsx";
import { FX } from "../fx.jsx";
import { PluginCard } from "../plugins/PluginCard.jsx";

function rewardView(e) {
  switch (e.kind) {
    case "joker":
      return {
        title: "Recruter",
        text: PLUGINS[e.defId].name,
        visual: <PluginCard id={e.defId} variant="offer" />,
      };
    case "module":
      return {
        title: "Module offert",
        text: `${MODULES[e.defId].name} : ${MODULES[e.defId].describe(1)}`,
        visual: <span className={`reward-glyph accent-${MODULES[e.defId].accent}`}>
          <ModuleIcon id={e.defId} size={56} />
        </span>,
      };
    case "patch":
      return {
        title: "Patch correctif",
        text: `Tous tes modules ${MODULES[e.defId].name} gagnent un niveau.`,
        visual: <span className={`reward-glyph accent-${MODULES[e.defId].accent}`}>
          <ModuleIcon id={e.defId} size={56} />
          <b className="glyph-badge">+1</b>
        </span>,
      };
    case "budget":
      return {
        title: "Levée de fonds",
        text: `+${e.amount} $ de Budget.`,
        visual: <span className="reward-glyph accent-amber big-sym">$</span>,
      };
    case "data":
      return {
        title: "Dump de données",
        text: `+${e.amount} Data en stock.`,
        visual: <span className="reward-glyph accent-violet big-sym">◆</span>,
      };
    case "rack":
      return {
        title: "Extension de rack",
        text: "Ouvre gratuitement un emplacement du plateau.",
        visual: <span className="reward-glyph accent-cyan big-sym">＋</span>,
      };
  }
}

function RewardMobile({ state, onChoose, onPick, onSkip, onSellPlugin }) {
  let R2 = React;
  let [sel, setSel] = R2.useState(null);
  let n = state.contracts[state.contractIndex];
  let l = state.contracts[state.contractIndex + 1];
  let d = state.lastPayout;
  let u = pluginSlots(state);
  let full = state.jokers.length >= u;
  let p = state.rewardChoices.findIndex((w) => w.kind === "recruit");
  let m = p >= 0 ? state.rewardChoices[p] : null;
  let oth = state.rewardChoices.map((w, T) => ({ o: w, i: T })).filter((w) => w.o.kind !== "recruit");
  let items = [];
  if (m) {
    m.defIds.forEach((id, T) => items.push({ key: "r" + T, plugin: id, go: () => onPick(p, T) }));
  }
  oth.forEach(({ o, i }) => items.push({ key: "o" + i, plugin: o.kind === "joker" ? o.defId : null, w: o, go: () => onChoose(i) }));
  let cur = items.find((x) => x.key === sel);
  let blocked = !!(cur && cur.plugin && full);
  let pays = [];
  if (d) {
    pays.push(["Paiement", d.base]);
    if (d.unusedDeploys > 0) {
      pays.push(["Déploiements économisés", d.unusedDeploys]);
    }
    if (d.goodies) {
      pays.push(["Gourde", d.goodies]);
    }
    if (d.interest > 0) {
      pays.push(["Bonus", d.interest]);
    }
  }
  let det = null;
  if (cur) {
    if (cur.plugin) {
      let q = PLUGINS[cur.plugin];
      det = (
        <>
          <div className="pd-head">
            <span className="pd-emoji" aria-hidden="true">{q.emoji}</span>
            <b className="pd-name">{q.name}</b>
            <span className={"pd-rarity r-" + q.rarity}>{RARITY_LABELS[q.rarity]}</span>
          </div>
          <p className="pd-text">{FX(q.text)}</p>
          <p className="pd-flavor">{q.flavor}</p>
          {blocked
            && (
              <p className="reward-warn">
                {"Tu as déjà "}
                {u}
                {" Plugins : vends-en un pour le prendre."}
              </p>
            )}
        </>
      );
    } else {
      let z2 = rewardView(cur.w);
      det = (
        <>
          <div className="pd-head"><b className="pd-name">{z2.title}</b></div>
          <p className="pd-text">{FX(z2.text)}</p>
        </>
      );
    }
  }
  let ds2 = cur && cur.plugin
    ? { "--j1": PLUGINS[cur.plugin].hue[0], "--j2": PLUGINS[cur.plugin].hue[1] }
    : undefined;
  return (
    <Modal className="reward-modal rw-m">
      <div className="rw-head">
        <span className="dim small">{"Version "}{n.version}{", contrat "}{n.step}</span>
        <h2 className="modal-title rw-title">{n.name}{" livré"}</h2>
        <div className="rw-line">
          <span>
            <b className="num">{fmt(state.contractScore)}</b>
            {" / "}
            {fmt(n.target)}
            {" Performance"}
          </span>
          {pays.map(([lab, v]) => (
            <span key={lab} className="rw-chip">
              {lab}
              {" "}
              <b className="num c-budget">+{v}{" $"}</b>
            </span>
          ))}
        </div>
      </div>
      {l
        && (
          <div className={`rw-next ${l.boss ? "boss" : ""}`}>
            <span className="dim">{l.boss ? "Contrat final :" : "Prochain :"}</span>
            <b>{l.name}{" "}<span className="num">{fmt(l.target)}</span></b>
            <span className="rw-rules">
              {l.rules.length
                ? l.rules.map((w) => ruleText(w, l.deploys)).join(" ")
                : "Pas de contrainte particulière."}
            </span>
          </div>
        )}
      <h3 className="reward-title rw-h">Choisis une récompense</h3>
      {m
        && (
          <div className="rw-sec">
            <span className="reward-kind">Recrutement : un Plugin parmi trois</span>
            <div className={"pick-row pick-mobile rw-plugins" + (sel ? " has-sel" : "")}>
              {m.defIds.map((w, T) => (
                <button
                  key={w}
                  className={"pick" + (sel === "r" + T ? " on" : "")}
                  onClick={() => setSel("r" + T)}
                  aria-pressed={sel === "r" + T}
                  aria-label={`Voir ${PLUGINS[w].name}`}
                >
                  <PluginCard id={w} variant="offer" />
                </button>
              ))}
            </div>
          </div>
        )}
      {oth.length > 0
        && (
          <div className="rw-others" style={{ "--n": Math.min(3, oth.length) }}>
            {oth.map(({ o, i }) => {
              let z2 = rewardView(o);
              return (
                <button
                  key={i}
                  className={"rw-opt" + (sel === "o" + i ? " on" : "")}
                  onClick={() => setSel("o" + i)}
                  aria-pressed={sel === "o" + i}
                >
                  <span className="rw-ic">
                    {o.kind === "joker"
                      ? <span className="reward-glyph">{PLUGINS[o.defId].emoji}</span>
                      : z2.visual}
                  </span>
                  <b>{z2.title}</b>
                  <span className="rw-t">{o.kind === "joker" ? PLUGINS[o.defId].name : z2.text}</span>
                </button>
              );
            })}
          </div>
        )}
      <div className={"pick-detail rw-detail" + (det ? "" : " empty")} style={ds2}>
        {det || <p>Touche une récompense pour la voir en entier, puis prends-la.</p>}
      </div>
      {full
        && items.some((x) => x.plugin)
        && (
          <div className="rw-sell">
            {state.jokers.map((w) => (
              <button key={w.uid} className="ghost" onClick={() => onSellPlugin(w.uid)}>
                {"Vendre "}
                {PLUGINS[w.defId].emoji}
                {" "}
                {PLUGINS[w.defId].name}
                {" (+"}
                {pluginSellPrice(w.defId)}
                {" $)"}
              </button>
            ))}
          </div>
        )}
      <div className="rw-bar">
        <button className="ghost rw-skip" onClick={onSkip}>Ne rien prendre</button>
        <button
          className="deploy rw-take"
          disabled={!cur || blocked}
          onClick={() => cur && !blocked && cur.go()}
        >
          Prendre
        </button>
      </div>
    </Modal>
  );
}

export function RewardModal({ state, onChoose, onPick, onSkip, onSellPlugin }) {
  if (state.rewardChoices.length > 0
    && window.matchMedia
    && window.matchMedia("(max-width:700px)").matches) {
    return (
      <RewardMobile
        state={state}
        onChoose={onChoose}
        onPick={onPick}
        onSkip={onSkip}
        onSellPlugin={onSellPlugin}
      />
    );
  }
  let n = state.contracts[state.contractIndex];
  let l = state.contracts[state.contractIndex + 1];
  let d = state.lastPayout;
  let u = pluginSlots(state);
  let i = state.jokers.length >= u;
  let c = state.rewardChoices.length > 0;
  let p = state.rewardChoices.findIndex((w) => w.kind === "recruit");
  let m = p >= 0 ? state.rewardChoices[p] : null;
  let y = state.rewardChoices.map((w, T) => ({ o: w, i: T })).filter((w) => w.o.kind !== "recruit");
  let v = m !== null || y.some((w) => w.o.kind === "joker");
  return (
    <Modal className="reward-modal">
      <span className="dim small">{"Version "}{n.version}{", contrat "}{n.step}</span>
      <h2 className="modal-title">{n.name}{" livré"}</h2>
      <p className="modal-sub">
        <span className="num">{fmt(state.contractScore)}</span>
        {" de Performance pour un objectif de"}
        {" "}
        <span className="num">{fmt(n.target)}</span>
        .
      </p>
      {d
        && (
          <div className="payout">
            <span>{"Paiement "}<b className="num">+{d.base}{" $"}</b></span>
            {d.unusedDeploys > 0
              && (
                <span>
                  {"Déploiements économisés "}
                  <b className="num">+{d.unusedDeploys}{" $"}</b>
                </span>
              )}
            {!!d.goodies && <span>{"Gourde "}<b className="num">+{d.goodies}{" $"}</b></span>}
            {d.interest > 0
              && <span>{"Bonus de fin de contrat "}<b className="num">+{d.interest}{" $"}</b></span>}
          </div>
        )}
      {l
        && (
          <div className={`next-contract ${l.boss ? "boss" : ""}`}>
            <span className="dim small">{l.boss ? "Contrat final" : "Prochain contrat"}</span>
            <strong>{l.name}{" "}<span className="num">{fmt(l.target)}</span></strong>
            <span className="small">
              {l.rules.length
                ? l.rules.map((w) => ruleText(w, l.deploys)).join(" ")
                : "Pas de contrainte particulière."}
            </span>
          </div>
        )}
      {c && <h3 className="reward-title">Choisis une récompense</h3>}
      {!c
        && (
          <p className="dim small">
            Les récompenses arrivent après chaque livraison majeure (contrat C). La boutique se renouvelle au prochain contrat.
          </p>
        )}
      {m
        && (
          <div className="recruit">
            <span className="reward-kind">Recrutement : un Plugin parmi trois</span>
            <div className="recruit-row">
              {m.defIds.map((w, T) => (
                <button
                  key={w}
                  className="recruit-pick"
                  disabled={i}
                  onClick={() => onPick(p, T)}
                  aria-label={`Recruter ${PLUGINS[w].name}`}
                >
                  <PluginCard id={w} variant="offer" />
                </button>
              ))}
            </div>
            {i
              && (
                <span className="reward-warn">
                  {"Tu as déjà "}
                  {u}
                  {" Plugins : vends-en un ci-dessous."}
                </span>
              )}
          </div>
        )}
      {c
        && (
          <div className="reward-row">
            {y.map(({ o, i: T }) => {
              let te = rewardView(o);
              let H = o.kind === "joker" && i;
              return (
                <button
                  key={T}
                  className={`reward ${o.kind}`}
                  onClick={() => onChoose(T)}
                  disabled={H}
                >
                  <span className="reward-kind">{te.title}</span>
                  <span className="reward-visual">{te.visual}</span>
                  <span className="reward-text">
                    {FX(o.kind === "joker" ? PLUGINS[o.defId].text : te.text)}
                  </span>
                  {H
                    && (
                      <span className="reward-warn">
                        {"Tu as déjà "}
                        {u}
                        {" Plugins : vends-en un ci-dessous."}
                      </span>
                    )}
                </button>
              );
            })}
          </div>
        )}
      {i
        && v
        && (
          <div className="sell-row">
            {state.jokers.map((w) => (
              <button key={w.uid} className="ghost" onClick={() => onSellPlugin(w.uid)}>
                {"Vendre "}
                {PLUGINS[w.defId].emoji}
                {" "}
                {PLUGINS[w.defId].name}
                {" (+"}
                {pluginSellPrice(w.defId)}
                {" $)"}
              </button>
            ))}
          </div>
        )}
      {c
        ? <button className="ghost skip" onClick={onSkip}>Ne rien prendre</button>
        : <button className="deploy skip" onClick={onSkip}>Contrat suivant</button>}
    </Modal>
  );
}
