// Tutoriel : bulles de Loup Niel et zone éclairée.

import * as React from "react";
import * as ReactDOM from "react-dom";
import { COMPANIES } from "../engine/companies.js";
import { currentContract } from "../engine/run.js";
import { LOUP_SVG } from "./loupNielSprites.js";
import { TUTO_STEPS, setTutorialDone, startTutorial, tutoSnapshot } from "./tutorial.js";

function LoupNiel(p) {
  return (
    <span
      className={"tz-por" + (p.big ? " big" : "")}
      dangerouslySetInnerHTML={{ __html: LOUP_SVG[p.pose] || LOUP_SVG.neutre }}
    />
  );
}

function targetRect(sel) {
  if (!sel) {
    return null;
  }
  for (var i = 0; i < sel.length; i++) {
    var els = document.querySelectorAll(sel[i]);
    for (var j = 0; j < els.length; j++) {
      var el = els[j];
      var r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4 && getComputedStyle(el).visibility !== "hidden") {
        if (r.bottom < 8 || r.top > window.innerHeight - 8 || targetRect.fresh) {
          targetRect.fresh = false;
          if (r.top < 0 || r.bottom > window.innerHeight) {
            try {
              el.scrollIntoView({ block: r.height > window.innerHeight * 0.8 ? "start" : "center" });
            } catch (e) { }
            r = el.getBoundingClientRect();
          }
        }
        return r;
      }
    }
  }
  return null;
}

export function TutorialOverlay(p) {
  var R2 = React;
  var t = p.t;
  var st2 = R2.useState(0);
  var k = st2[0];
  var setK = st2[1];
  var sn2 = R2.useState(null);
  var snap = sn2[0];
  var setSnap = sn2[1];
  var tk = R2.useState(0);
  var tick = tk[0];
  var setTick = tk[1];
  var entered = R2.useRef(-1);
  var ce = currentContract(t);
  var co2 = (COMPANIES[t.company] || COMPANIES.startup).name;
  var c = {
    t,
    ce,
    co: co2,
    sel: p.sel,
    shop: p.shop,
    anim: p.anim,
    fusion: p.fusion,
    closeSel: p.closeSel,
    patch: function(o) {
      p.r({ type: "TUTO_PATCH", patch: o });
    },
    ensure: function(o) {
      var x = {};
      if (o.budget != null && t.budget < o.budget) {
        x.budget = o.budget;
      }
      if (o.data != null && t.data < o.data) {
        x.data = o.data;
      }
      if (Object.keys(x).length) {
        p.r({ type: "TUTO_PATCH", patch: x });
      }
    },
  };
  var step = TUTO_STEPS[k];
  var active = !!step && step.when(c);
  R2.useEffect(
    function() {
      var i = setInterval(
        function() {
          setTick(function(n) {
            return n + 1;
          });
        },
        300,
      );
      var f2 = function() {
        setTick(function(n) {
          return n + 1;
        });
      };
      window.addEventListener("resize", f2);
      return function() {
        clearInterval(i);
        window.removeEventListener("resize", f2);
      };
    },
    [],
  );
  R2.useEffect(function() {
    if (!step) {
      return;
    }
    if (active && entered.current !== k) {
      entered.current = k;
      targetRect.fresh = true;
      setSnap(tutoSnapshot(t));
      if (step.enter) {
        step.enter(c);
      }
    }
  });
  R2.useEffect(function() {
    // Pas de test « active » ici : une étape doit pouvoir se valider même si la situation a déjà changé
    // (ex. le premier déploiement livre le contrat : la phase passe en récompense).
    if (!step || !snap || entered.current !== k) {
      return;
    }
    if (step.done && step.done(c, snap)) {
      if ((step.id === "upgrade" || step.id === "branch") && p.closeSel) {
        p.closeSel();
      }
      setK(k + 1);
    }
  });
  if (!step) {
    return null;
  }
  var finish = function() {
    setTutorialDone();
    p.onEnd();
  };
  var skip = function() {
    setTutorialDone();
    p.onEnd();
  };
  var defeat = t.phase === "defeat";
  var mobile = window.innerWidth <= 1180;
  if (defeat) {
    return ReactDOM.createPortal(
      <div className="tz-root">
        <div className="tz-dim tz-full" />
        <div className="tz-card hero">
          <LoupNiel pose="inquiet" big />
          <div className="tz-say">
            <span className="tz-tag">LOUP NIEL · CTO</span>
            <div
              dangerouslySetInnerHTML={{
                __html: "Aïe, le client n’est pas content… Pas grave, c’était un entraînement ! On recommence ?",
              }}
            />
            <div className="tz-acts">
              <button className="tz-skip" onClick={skip}>Terminer</button>
              <button
                className="tz-next"
                onClick={function() {
                  setK(0);
                  entered.current = -1;
                  p.r({ type: "TUTO_SET", state: startTutorial() });
                }}
              >
                Recommencer
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  }
  var blockByOverlay = !!(t.boxChoices?.length || t.packChoices?.length || p.fusion);
  if (!active || blockByOverlay) {
    var w = step.wait ? step.wait(c) : blockByOverlay ? null : null;
    if (blockByOverlay && step.action) {
      w = typeof step.action === "function" ? step.action(c) : step.action;
    }
    if (!w && !blockByOverlay && c.shop && t.phase === "build") {
      w = "Retourne au plateau pour continuer.";
    }
    if (!w) {
      return null;
    }
    return ReactDOM.createPortal(
      <div className="tz-root tz-pass">
        <div className={"tz-mini" + (blockByOverlay ? " up" : "")}>
          <LoupNiel pose={step.pose || "explique"} />
          <span className="tz-mini-t">{w}</span>
          <button className="tz-skip" onClick={skip}>Passer</button>
        </div>
      </div>,
      document.body,
    );
  }
  var sel = typeof step.target === "function" ? step.target(c) : step.target;
  var r = targetRect(sel);
  var pad = 6;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var hole = r
    ? {
      l: Math.max(0, r.left - pad),
      t: Math.max(0, r.top - pad),
      r: Math.min(vw, r.right + pad),
      b: Math.min(vh, r.bottom + pad),
    }
    : null;
  var txt = typeof step.text === "function" ? step.text(c) : step.text;
  var act = step.action ? typeof step.action === "function" ? step.action(c) : step.action : null;
  var dims = [];
  if (step.float) { } else if (hole) {
    dims = [
      { left: 0, top: 0, width: vw, height: hole.t },
      { left: 0, top: hole.b, width: vw, height: vh - hole.b },
      { left: 0, top: hole.t, width: hole.l, height: hole.b - hole.t },
      { left: hole.r, top: hole.t, width: vw - hole.r, height: hole.b - hole.t },
    ];
  } else {
    dims = [{ left: 0, top: 0, width: vw, height: vh }];
  }
  var below = hole ? (hole.t + hole.b) / 2 < vh * 0.5 : true;
  // Zone éclairée presque aussi haute que l'écran (fiche d'un module sur ordinateur) : la bulle ne doit pas
  // la recouvrir (elle cacherait les boutons à toucher). On la met sur le côté le plus libre, si la place suffit.
  var side = null;
  var sideWidth = 0;
  if (hole && !mobile && !step.hero && !step.float && hole.b - hole.t > vh * 0.6) {
    var roomLeft = hole.l;
    var roomRight = vw - hole.r;
    side = roomRight >= roomLeft ? "right" : "left";
    sideWidth = Math.min(460, (side === "right" ? roomRight : roomLeft) - 28);
    if (sideWidth < 260) {
      side = null;
    }
  }
  var pos = step.hero
    ? "hero"
    : step.float
      ? mobile && document.querySelector(".rw-m") ? "mid" : "top"
      : side ? "side" : below ? "bottom" : "top";
  var nextBtn = !act
    && (
      <button
        className="tz-next"
        onClick={function() {
          if (step.finish) {
            finish();
          } else {
            setK(k + 1);
          }
        }}
      >
        {step.next || "Suivant"}
      </button>
    );
  return ReactDOM.createPortal(
    <div className={"tz-root" + (step.float ? " tz-pass" : "")}>
      {dims.map(function(d, i) {
        return <div key={i} className="tz-dim" style={d} />;
      })}
      {hole
        && !step.float
        && (
          <div
            className="tz-ring"
            style={{ left: hole.l, top: hole.t, width: hole.r - hole.l, height: hole.b - hole.t }}
          />
        )}
      <div
        className={"tz-card " + pos + (mobile ? " m" : "")}
        style={side ? { [side]: 12, width: sideWidth } : undefined}
      >
        <LoupNiel pose={step.pose || "explique"} big={!!step.hero} />
        <div className="tz-say">
          <div className="tz-head">
            <span className="tz-tag">LOUP NIEL · CTO</span>
            <span className="tz-n">{k + 1 + " / " + TUTO_STEPS.length}</span>
          </div>
          <div className="tz-txt" dangerouslySetInnerHTML={{ __html: txt }} />
          {act && <div className="tz-todo">{"▶ " + act}</div>}
          <div className="tz-acts">
            {step.finish
              ? <span />
              : <button className="tz-skip" onClick={skip}>Passer le tuto</button>}
            {nextBtn}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TutorialWelcome(p) {
  return (
    <div className="tz-welcome">
      <LoupNiel pose="salut" />
      <div className="tz-w-txt">
        <b>Première fois ?</b>
        <span>Loup Niel, ton CTO, te fait faire le tour en une partie d’entraînement.</span>
        <button className="tz-next" onClick={p.onStart}>Lancer le tutoriel</button>
      </div>
    </div>
  );
}
