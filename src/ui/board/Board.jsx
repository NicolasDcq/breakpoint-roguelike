// Plateau : tuiles, glisser-déposer, cases à ouvrir, tiroir.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sfx } from "../../audio/sfx.js";
import { moduleAt } from "../../engine/drawer.js";
import { FAMILY_LABELS } from "../../engine/families.js";
import { diagonals, neighbors, previousFilledSlot } from "../../engine/grid.js";
import { MODULES } from "../../engine/modules.js";
import { findFusionPartner, moduleView } from "../../engine/moduleView.js";
import {
  TRACE_HEIGHT,
  TRACE_WIDTH,
  arcPath,
  busPath,
  returnPaths,
  slotX,
  slotY,
} from "./boardGeometry.js";
import { EditionOverlay, ModuleTip } from "./ModuleParts.jsx";
import { UnlockAsk } from "./UnlockAsk.jsx";
import { Tooltip } from "../common/Tooltip.jsx";

const DRAG_THRESHOLD = 6;

function slotAtPoint(e, t, o) {
  if (!e) {
    return null;
  }
  let a = e.getBoundingClientRect();
  if (t < a.left - 12 || t > a.right + 12 || o < a.top - 12 || o > a.bottom + 12) {
    return null;
  }
  let r = null;
  let n = 1 / 0;
  e.querySelectorAll("[data-slot]").forEach((l) => {
    let d = l.getBoundingClientRect();
    let u = Math.max(d.left - t, 0, t - d.right);
    let i = Math.max(d.top - o, 0, o - d.bottom);
    let c = u * u + i * i;
    if (c < n) {
      n = c;
      r = Number(l.dataset.slot);
    }
  });
  return r;
}

export function Board(e) {
  let [zq, setZq] = useState(null);
  let [t, o] = useState(null);
  let [a, r] = useState(null);
  let n = useRef(null);
  let l = useRef(null);
  let d = useRef(null);
  let u = useRef(false);
  let i = useRef(e);
  i.current = e;
  let c = a?.from ?? null;
  let p = a?.over ?? null;
  let m = e.selected ?? t;
  let y = new Set();
  if (m !== null && e.board[m]) {
    let N = e.board[m];
    if (moduleView(N).usesNeighbors) {
      neighbors(m).forEach((j) => e.board[j] && y.add(j));
    }
    if (N.fused && (N.defId === "server" || N.defId === "cdn" || N.defId === "balancer")) {
      diagonals(m).forEach((j) => e.board[j] && y.add(j));
    }
    let U = findFusionPartner(e.board, m);
    if (U >= 0) {
      y.add(U);
    }
    if (N.defId === "dns"
      && (m - 5 >= 0 && e.board[m - 5] && (N.level > 1 || N.fused) && y.add(m - 5),
        m + 5 < 25 && e.board[m + 5] && y.add(m + 5),
        N.fused)) {
      for (let j = m % 5; j < 25; j += 5) {
        if (j !== m && e.board[j]) {
          y.add(j);
        }
      }
    }
    if (N.defId === "worker") {
      let j = previousFilledSlot(e.board, m);
      if (j >= 0) {
        y.add(j);
      }
    }
    if (N.defId === "cache") {
      for (let j = m + 1; j < 25; j++) {
        let ne = e.board[j];
        if (ne && MODULES[ne.defId].kind === "producer") {
          y.add(j);
          break;
        }
      }
    }
  }
  let v = e.playback;
  let w = v.activeSlot;
  let T = (N) => {
    if (!e.locked && e.unlocked[N]) {
      if (e.board[N]) {
        e.onSelect(e.selected === N ? null : N);
      } else {
        e.onSelect(null);
      }
    }
  };
  let te = (N) => {
    d.current = N;
    r(N);
  };
  useEffect(
    () => {
      let N = (L) => {
        let Q = l.current;
        if (!Q || L.pointerId !== Q.id) {
          return;
        }
        let q = d.current;
        if (!q) {
          if (Math.hypot(L.clientX - Q.x, L.clientY - Q.y) < DRAG_THRESHOLD) {
            return;
          }
          let le = Q.el.getBoundingClientRect();
          te({
            from: Q.slot,
            x: L.clientX,
            y: L.clientY,
            dx: Q.x - le.left,
            dy: Q.y - le.top,
            width: le.width,
            height: le.height,
            over: slotAtPoint(n.current?.parentElement?.parentElement, L.clientX, L.clientY),
          });
          return;
        }
        L.preventDefault();
        te({
          ...q,
          x: L.clientX,
          y: L.clientY,
          over: slotAtPoint(n.current?.parentElement?.parentElement, L.clientX, L.clientY),
        });
      };
      let S = (L, Q) => {
        let q = l.current;
        if (!q || L.pointerId !== q.id) {
          return;
        }
        l.current = null;
        let le = d.current;
        if (!le || (te(null), u.current = true, window.setTimeout(() => u.current = false, 0), Q)) {
          return;
        }
        let fe = slotAtPoint(n.current?.parentElement?.parentElement, L.clientX, L.clientY);
        let ze = i.current;
        if (fe !== null && fe !== le.from && (fe >= 100 || ze.unlocked[fe]) && !ze.locked) {
          ze.onMove(le.from, fe);
        }
        ze.onSelect(null);
      };
      let U = (L) => S(L, false);
      let j = (L) => S(L, true);
      let ne = (L) => {
        if (L.key === "Escape" && d.current) {
          l.current = null;
          te(null);
        }
      };
      window.addEventListener("pointermove", N, { passive: false });
      window.addEventListener("pointerup", U);
      window.addEventListener("pointercancel", j);
      window.addEventListener("keydown", ne);
      return () => {
        window.removeEventListener("pointermove", N);
        window.removeEventListener("pointerup", U);
        window.removeEventListener("pointercancel", j);
        window.removeEventListener("keydown", ne);
      };
    },
    [],
  );
  useEffect(
    () => {
      document.body.classList.toggle("is-dragging", a !== null);
      return () => document.body.classList.remove("is-dragging");
    },
    [a !== null],
  );
  let H = (N) => (S) => {
    if (!(e.locked || S.button !== 0)) {
      l.current = { slot: N, x: S.clientX, y: S.clientY, id: S.pointerId, el: S.currentTarget };
    }
  };
  return (
    <div className={`board ${e.locked ? "running" : ""}`}>
      <div className="drawer-row">
        <span className="drawer-label">Tiroir de pièces détachées</span>
        <div className="drawer-cells">
          {Array.from({ length: 6 }, (q, i2) => {
            let d2 = e.drawer ?? [];
            let m2 = d2[i2];
            return i2 < d2.length
              ? (
                <div
                  key={i2}
                  className={"slot drawer-slot" + (m2 ? " filled" : "")}
                  data-slot={100 + i2}
                >
                  {m2
                    ? (
                      <div className="tile-wrap">
                        <div
                          className={`tile accent-${MODULES[m2.defId].accent} famtile-${MODULES[m2.defId].family} kind-${MODULES[m2.defId].kind} ${m2.edition ? `ed-${m2.edition}` : ""} ${m2.fused ? "fused" : ""} ${c === 100 + i2 ? "drag-source" : ""}`}
                          onPointerDown={H(100 + i2)}
                          onDragStart={(q2) => q2.preventDefault()}
                          aria-label={`${moduleView(m2).name}, dans le tiroir`}
                        >
                          <EditionOverlay m={m2} />
                        </div>
                      </div>
                    )
                    : null}
                </div>
              )
              : <div key={i2} className="slot drawer-slot locked" data-slot={100 + i2}>🔒</div>;
          })}
        </div>
        <button
          className="drawer-expand"
          disabled={!((e.drawer ?? []).length < 6)}
          onClick={() => e.onExpand?.()}
        >
          {(e.drawer ?? []).length < 6
            ? `+1 emplacement · ${[20, 40, 70, 110][(e.drawer ?? []).length - 2]} $ + goodie`
            : "Tiroir au maximum"}
        </button>
      </div>
      <svg
        className="trace"
        viewBox={`0 0 ${TRACE_WIDTH} ${TRACE_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="trace-bus" d={busPath()} />
        {Array.from({ length: 5 }, (N, S) => S).filter((N) => e.board.slice(N * 5, N * 5 + 5).some((S) => S?.edition === "ctr")).map((N) => (
          <line
            key={`ctr${N}`}
            className="ctr-cable"
            x1={slotX(N * 5)}
            y1={slotY(N * 5)}
            x2={slotX(N * 5 + 5 - 1)}
            y2={slotY(N * 5)}
          />
        ))}
        {returnPaths().map((N) => <path key={N} className="trace-return" d={N} />)}
        {w !== null && <circle className="trace-dot" cx={slotX(w)} cy={slotY(w)} r={7} />}
      </svg>
      <div className="slots" ref={n}>
        {Array.from({ length: 25 }, (N, S) => {
          let U = e.board[S];
          let j = e.unlocked[S];
          let ne = e.broken.has(S);
          let L = [
            "slot",
            !j && "locked",
            e.holes?.includes(S) && "hole",
            U && "filled",
            ne && "broken",
            e.selected === S && "selected",
            y.has(S) && "related",
            w === S && "active",
            v.retriggerTargets.includes(S) && "retrig",
            p === S && c !== S && j && "dragover",
            p === S && c !== S && !j && "nodrop",
            (e.selected !== null && e.selected !== S || c !== null && c !== S) && j && "droppable",
          ].filter(Boolean).join(" ");
          let Q = v.popups.filter((q) => q.slot === S);
          return j
            ? (
              <div
                key={S}
                className={L}
                data-slot={S}
                onClick={() => {
                  if (!u.current) {
                    T(S);
                  }
                }}
                onMouseEnter={() => o(S)}
                onMouseLeave={() => o((q) => q === S ? null : q)}
              >
                <span className="slot-order">{S + 1}</span>
                {ne && <span className="broken-label">En panne</span>}
                {U
                  ? (
                    <Tooltip
                      content={<ModuleTip
                        id={U.defId}
                        level={U.level}
                        fused={U.fused}
                        branch={U.branch}
                        patch={U.patch}
                        edition={U.edition}
                        learn={U.learn}
                      />}
                      disabled={e.locked || c !== null}
                      className="tile-wrap"
                    >
                      <div
                        className={`tile accent-${MODULES[U.defId].accent} famtile-${MODULES[U.defId].family} kind-${MODULES[U.defId].kind} ${U.edition ? `ed-${U.edition}` : ""} ${e.crashSlots?.has(S) ? "crash" : ""} ${U.fused ? "fused" : ""} ${U.uid === e.fusedUid ? "fusing" : ""} ${c === S ? "drag-source" : ""}`}
                        onPointerDown={H(S)}
                        onDragStart={(q) => q.preventDefault()}
                        tabIndex={0}
                        role="button"
                        aria-pressed={e.selected === S}
                        aria-label={`${moduleView(U).name}${U.fused ? " (fusionné)" : ` niveau ${U.level}`}, famille ${FAMILY_LABELS[MODULES[U.defId].family]}, emplacement ${S + 1}`}
                        onKeyDown={(q) => {
                          if (q.key === "Enter" || q.key === " ") {
                            q.preventDefault();
                            T(S);
                          }
                        }}
                      >
                        <EditionOverlay m={U} crash={e.crashSlots?.has(S)} />
                        {!e.locked
                          && findFusionPartner(e.board, S) >= 0
                          && (
                            <span
                              className="fuse-ready fuse-dot"
                              title="Fusion possible : bouton Fusion"
                              aria-label="Fusion possible"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M6 3v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M12 14v7" />
                              </svg>
                            </span>
                          )}
                        {!e.locked
                          && e.upgradable?.has(S)
                          && findFusionPartner(e.board, S) < 0
                          && (
                            <span
                              className="up-ready up-dot"
                              title={e.upgradable.get(S) === "choix"
                                ? "Spécialisation à choisir : touche le module"
                                : "Amélioration possible : touche le module"}
                              aria-label={e.upgradable.get(S) === "choix"
                                ? "Spécialisation à choisir"
                                : "Amélioration possible"}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M5 11l7-6 7 6M5 20l7-6 7 6" />
                              </svg>
                            </span>
                          )}
                      </div>
                    </Tooltip>
                  )
                  : (
                    <span className="slot-empty">
                      {e.selected !== null || c !== null && p === S ? "Déplacer ici" : ""}
                    </span>
                  )}
                {Q.map((q) => (
                  <div key={q.id} className="popup">
                    {q.lines.map((le, fe) => <span key={fe} className={`pop-${le.tone}`}>{le.text}</span>)}
                  </div>
                ))}
              </div>
            )
            : S >= e.gatedFrom
              ? (
                <div key={S} data-slot={S} className={`${L} later gated`}>
                  <span className="slot-order">{S + 1}</span>
                  <span className="gate-label">{S === e.gatedFrom ? e.gateLabel : ""}</span>
                </div>
              )
              : !e.buyable.includes(S)
                ? (
                  <div key={S} data-slot={S} className={`${L} later`}>
                    <span className="slot-order">{S + 1}</span>
                    <span className="lock-later" aria-label={`Emplacement ${S + 1} verrouillé`}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                  </div>
                )
                : (
                  <div key={S} data-slot={S} className={`${L} next-unlock`}>
                    <span className="slot-order">{S + 1}</span>
                    <button
                      className={"unlock" + ((e.budget ?? 1 / 0) < e.unlockCost ? " short" : "")}
                      disabled={e.locked || (e.budget ?? 1 / 0) < e.unlockCost}
                      aria-label={(e.budget ?? 1 / 0) < e.unlockCost
                        ? `Emplacement ${S + 1} : pas assez de $`
                        : `Ouvrir l’emplacement ${S + 1}`}
                      onClick={() => {
                        sfx.click();
                        setZq(S);
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                      <span>Ouvrir</span>
                      <span className="num">{e.unlockCost}{" $"}</span>
                    </button>
                    {zq === S
                      && createPortal(
                        <UnlockAsk
                          slot={S}
                          cost={e.unlockCost}
                          budget={e.budget}
                          onNo={() => setZq(null)}
                          onYes={() => {
                            setZq(null);
                            e.onUnlock(S);
                          }}
                        />,
                        document.body,
                      )}
                  </div>
                );
        })}
      </div>
      <svg
        className="arcs"
        viewBox={`0 0 ${TRACE_WIDTH} ${TRACE_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {w !== null
          && v.retriggerTargets.map((N) => <path key={`${w}-${N}-${v.index}`} className="arc" d={arcPath(w, N)} />)}
      </svg>
      {a
        && moduleAt(e, a.from)
        && createPortal(
          <div
            className={`tile drag-ghost accent-${MODULES[moduleAt(e, a.from).defId].accent} famtile-${MODULES[moduleAt(e, a.from).defId].family} kind-${MODULES[moduleAt(e, a.from).defId].kind} ${moduleAt(e, a.from).edition ? `ed-${moduleAt(e, a.from).edition}` : ""} ${moduleAt(e, a.from).fused ? "fused" : ""}`}
            style={{ left: a.x - a.dx, top: a.y - a.dy, width: a.width, height: a.height }}
            aria-hidden="true"
          >
            <EditionOverlay m={moduleAt(e, a.from)} />
          </div>,
          document.body,
        )}
    </div>
  );
}
