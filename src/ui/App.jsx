// Application : état, sauvegarde, écrans.

import { DEV_TOOLS } from "../config.js";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { sfx } from "../audio/sfx.js";
import { arrivalKinds } from "../engine/arrivals.js";
import { COMPANIES } from "../engine/companies.js";
import { findRule } from "../engine/contracts.js";
import { disabledPlugins } from "../engine/deploy.js";
import { MAX_DIFFICULTY, difficultyInfo } from "../engine/difficulty.js";
import { brokenSlots } from "../engine/drawer.js";
import { betaCrashes } from "../engine/editions.js";
import { GOODIE_IDS } from "../engine/goodies.js";
import { findFusionPartner } from "../engine/moduleView.js";
import { PLUGINS, pluginSellPrice } from "../engine/plugins.js";
import {
  canDeploy,
  fusionPairs,
  nearFusions,
  previewDeploy,
  runReducer,
} from "../engine/reducer.js";
import { randomSeed } from "../engine/rng.js";
import {
  LEGACY_COLUMNS,
  buyableSlots,
  currentContract,
  firstBuyableSlot,
  freeUpgradeAvailable,
  goodieOfferPrice,
  newRun,
  packPrice,
  pluginSlots,
  sellPriceOf,
  unlockCost,
} from "../engine/run.js";
import { isCompanyUnlocked, recordRun } from "../save/profile.js";
import {
  DEV_LEVEL,
  KEY_DEV_UNLOCK,
  alreadyRecorded,
  loadProfile,
  loadRun,
  readNumber,
  saveProfile,
  saveRun,
  writeValue,
} from "../save/storage.js";
import { endTutorial, startTutorial } from "../tutorial/tutorial.js";
import { TutorialOverlay } from "../tutorial/TutorialOverlay.jsx";
import { playActionSound } from "./actionSounds.js";
import { Board } from "./board/Board.jsx";
import { FamilyBar } from "./board/ModuleParts.jsx";
import { FusionModal } from "./fusion/Fusion.jsx";
import { contractHint } from "./hints.js";
import { MOBILE_QUERY, useMediaQuery } from "./hooks/useMediaQuery.js";
import { usePlayback } from "./hooks/usePlayback.js";
import { TopBar } from "./hud/TopBar.jsx";
import { PluginSheet } from "./plugins/PluginCard.jsx";
import { PluginRail } from "./plugins/PluginRail.jsx";
import { ScorePanel } from "./score/ScorePanel.jsx";
import { EndModal } from "./screens/EndModal.jsx";
import { QuitConfirm } from "./screens/QuitConfirm.jsx";
import { SellConfirm } from "./plugins/SellConfirm.jsx";
import { RewardModal } from "./screens/Reward.jsx";
import { RulesModal } from "./screens/RulesModal.jsx";
import { TitleScreen } from "./screens/TitleScreen.jsx";
import { BoxOpening, PackOpening } from "./shop/Packs.jsx";
import { SidePanel } from "./SidePanel.jsx";

function endPhase(e, t) {
  return t
    ? null
    : e.phase === "reward" || e.phase === "victory" || e.phase === "defeat" ? e.phase : null;
}

export function App() {
  let [boot] = useState(() => {
    let k = loadRun();
    return { state: k ?? newRun(randomSeed()), resumed: k !== null };
  });
  let [run, rawDispatch] = useReducer(runReducer, boot.state);
  let runRef = useRef(run);
  runRef.current = run;
  let dispatch = useCallback(
    (k) => {
      if (k.type !== "DEPLOY" && k.type !== "NEW_RUN") {
        playActionSound(runRef.current, k);
      }
      rawDispatch(k);
    },
    [],
  );
  let { state: playback, start, skip, setSpeed } = usePlayback();
  let [snapshot, setSnapshot] = useState(null);
  let awaitingPlayback = useRef(false);
  let [selectedSlot, setSelectedSlot] = useState(null);
  let [sideTab, setSideTab] = useState("shop");
  let [showRules, setShowRules] = useState(false);
  let [showFusion, setShowFusion] = useState(false);
  let [shopPop, setShopPop] = useState(false);
  let [hintFor, setHintFor] = useState(null);
  let prevPhase = useRef(run.phase);
  let [confirmQuit, setConfirmQuit] = useState(false);
  let [toast, setToast] = useState(null);
  let [profile, setProfile] = useState(loadProfile);
  useEffect(() => saveProfile(profile), [profile]);
  useEffect(
    () => {
      let pv = prevPhase.current;
      prevPhase.current = run.phase;
      if (pv === "reward" && run.phase === "build") {
        let pc = run.contracts[run.contractIndex - 1];
        let cc = run.contracts[run.contractIndex];
        if (!cc?.rules?.some((r2) => r2.kind === "shopClosed")) {
          if (mobile) {
            ni();
          } else {
            setSelectedSlot(null);
            setShopPop(true);
          }
        }
      }
    },
    [run.phase, run.contractIndex],
  );
  let [newLevel, setNewLevel] = useState(null);
  let [newCompanies, setNewCompanies] = useState([]);
  let [devUnlock, setDevUnlock] = useState(() => DEV_TOOLS && readNumber(KEY_DEV_UNLOCK) === 1);
  let company = run.company ?? "startup";
  let companyRecord = profile.companies[company];
  let maxLevelOf = (k) => devUnlock ? MAX_DIFFICULTY : profile.companies[k].maxLevel;
  let maxLevel = maxLevelOf(company);
  let endlessUnlocked = devUnlock
    || companyRecord.endless
    || !!boot.state.endless && boot.state.company === run.company;
  let endlessBest = companyRecord.endlessBest;
  let mobile = useMediaQuery(MOBILE_QUERY);
  let [pluginDetail, setPluginDetail] = useState(null);
  let [sellAsk, setSellAsk] = useState(null);
  let contract = currentContract(run);
  let busy = playback.animating || snapshot !== null;
  let preview = useMemo(() => run.phase === "build" ? previewDeploy(run) : null, [run]);
  useEffect(
    () => {
      if (!(!awaitingPlayback.current || !run.lastExecution)) {
        awaitingPlayback.current = false;
        start(run.lastExecution.events, () => setSnapshot(null));
      }
    },
    [run.lastExecution, start],
  );
  useEffect(
    () => {
      setSideTab("shop");
      setSelectedSlot(null);
      setPluginDetail(null);
    },
    [run.contractIndex],
  );
  let isStarter = run.phase === "starter";
  useEffect(
    () => {
      if (!isStarter) {
        window.scrollTo(0, 0);
      }
    },
    [isStarter],
  );
  useEffect(() => saveRun(run), [run]);
  useEffect(
    () => {
      if (!boot.resumed) {
        return;
      }
      let k = currentContract(boot.state);
      setToast({ text: `Run reprise : version ${k.version}, contrat ${k.step}.`, tone: "info", id: -1 });
      let X = window.setTimeout(() => setToast(null), 2800);
      return () => window.clearTimeout(X);
    },
    [boot],
  );
  useEffect(
    () => {
      if (!run.notice) {
        return;
      }
      setToast(run.notice);
      let k = window.setTimeout(() => setToast(null), 2800);
      return () => window.clearTimeout(k);
    },
    [run.notice],
  );
  useEffect(
    () => {
      if (selectedSlot !== null && !run.board[selectedSlot]) {
        setSelectedSlot(null);
      }
    },
    [run.board, selectedSlot],
  );
  let handleDeploy = useCallback(
    () => {
      if (!(!canDeploy(run).ok || busy)) {
        setSnapshot({
          board: run.board,
          jokers: run.jokers,
          contractScore: run.contractScore,
          contractData: run.contractData,
          target: contract.target,
        });
        setSelectedSlot(null);
        setSideTab("log");
        setPluginDetail(null);
        if (mobile) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        awaitingPlayback.current = true;
        sfx.deploy();
        dispatch({ type: "DEPLOY" });
      }
    },
    [run, busy, mobile],
  );
  useEffect(
    () => {
      let k = (X) => {
        if (X.key === "Escape") {
          setSelectedSlot(null);
        }
      };
      window.addEventListener("keydown", k);
      return () => window.removeEventListener("keydown", k);
    },
    [],
  );
  let endScreen = endPhase(run, busy);
  useEffect(
    () => {
      if (endScreen === "reward") {
        sfx.cash();
      } else if (endScreen === "victory") {
        sfx.victory();
      } else if (endScreen === "defeat") {
        sfx.defeat();
      }
    },
    [endScreen],
  );
  useEffect(
    () => {
      if (run.tuto
        || run.phase !== "victory" && run.phase !== "defeat"
        || alreadyRecorded(`${run.seed}-${run.company}-${run.level}-${run.phase}-${run.contractIndex}`)) {
        return;
      }
      let k = recordRun(profile, run);
      setProfile(k.profile);
      setNewLevel(k.newEndless ? DEV_LEVEL : k.newLevel);
      setNewCompanies(k.newCompanies);
    },
    [run.phase],
  );
  let restart = () => {
    setConfirmQuit(false);
    setSnapshot(null);
    skip();
    setSelectedSlot(null);
    setNewLevel(null);
    setNewCompanies([]);
    dispatch({
      type: "NEW_RUN",
      seed: randomSeed(),
      level: Math.min(run.level, maxLevel),
      endless: !!run.endless && endlessUnlocked,
      company,
    });
  };
  if (run.phase === "starter") {
    return (
      <TitleScreen
        onTutorial={() => {
          setShopPop(false);
          setSelectedSlot(null);
          setShowFusion(false);
          dispatch({ type: "TUTO_SET", state: startTutorial() });
        }}
        choices={run.starterChoices}
        onPick={(k) => dispatch({ type: "CHOOSE_STARTER", jokerId: k })}
        level={run.level}
        maxUnlocked={maxLevel}
        onLevel={(k) => k <= maxLevel && dispatch({ type: "NEW_RUN", seed: run.seed, level: k })}
        endless={!!run.endless}
        endlessUnlocked={endlessUnlocked}
        endlessBest={endlessBest}
        onEndless={() => endlessUnlocked && dispatch({ type: "NEW_RUN", seed: run.seed, endless: true })}
        devUnlock={devUnlock}
        onDevUnlock={(k) => {
          setDevUnlock(k);
          writeValue(KEY_DEV_UNLOCK, k ? 1 : 0);
          if (!k) {
            let X = isCompanyUnlocked(profile, company) ? company : "startup";
            let Vt = profile.companies[X].maxLevel;
            if (X !== company || run.level > Vt || run.endless && !profile.companies[X].endless) {
              dispatch({ type: "NEW_RUN", seed: run.seed, level: Math.min(run.level, Vt), company: X });
            }
          }
        }}
        company={company}
        access={{ profile, dev: devUnlock }}
        onCompany={(k) => k !== company
          && dispatch({
            type: "NEW_RUN",
            seed: run.seed,
            level: Math.min(run.level, maxLevelOf(k)),
            company: k,
          })}
      />
    );
  }
  let shownBoard = snapshot?.board ?? run.board;
  let shownJokers = snapshot?.jokers ?? run.jokers;
  let liveTotals = playback.animating ? playback.totals : null;
  let shownScore = snapshot
    ? snapshot.contractScore + (liveTotals ? Math.floor(liveTotals.compute * liveTotals.scale) : 0)
    : run.contractScore;
  let shownData = snapshot ? snapshot.contractData : run.contractData;
  let disabledNotes = new Map();
  let disabledUids = disabledPlugins(shownJokers, contract);
  shownJokers.forEach((k, X) => {
    if (disabledUids.has(k.uid)) {
      disabledNotes.set(
        k.uid,
        X === 0 && findRule(contract, "disableLeftPlugin")
          ? "Réquisitionné par le client"
          : "Coincé en réunion",
      );
    }
  });
  let deployCost = findRule(contract, "deployCost")?.amount ?? 0;
  let selected = selectedSlot !== null && run.board[selectedSlot] && !busy
    ? { slot: selectedSlot, module: run.board[selectedSlot] }
    : null;
  let canAct = !busy;
  let Oa = new Set();
  if (run.phase === "build" && !busy) {
    run.board.forEach((k, X) => k && betaCrashes(k, contract.id, run.deploysUsed) && Oa.add(X));
  }
  let ni = () => {
    setSelectedSlot(null);
    setShopPop(true);
  };
  // Vente d'un Plugin : passe d'abord par la confirmation. `after` ferme la fiche éventuelle.
  let askSell = (uid, after) => setSellAsk({ uid, after });
  let sellTarget = sellAsk && run.jokers.find((n) => n.uid === sellAsk.uid);
  let ii = () => {
    if (!pluginDetail) {
      return null;
    }
    let k = () => setPluginDetail(null);
    if ("uid" in pluginDetail) {
      let Kt = shownJokers.findIndex((si) => si.uid === pluginDetail.uid);
      let tt = shownJokers[Kt];
      if (!tt) {
        return null;
      }
      let za = shownJokers[Kt + 1];
      return (
        <PluginSheet
          id={tt.defId}
          owned={tt}
          disabledText={disabledNotes.get(tt.uid)}
          note={PLUGINS[tt.defId].copiesRight
            ? za ? `Copie : ${PLUGINS[za.defId].name}` : "Rien à copier à droite"
            : undefined}
          onClose={k}
          actions={<>
            <button
              className="ghost"
              disabled={busy || Kt === 0}
              onClick={() => dispatch({ type: "MOVE_PLUGIN", uid: tt.uid, dir: -1 })}
            >
              ‹ Gauche
            </button>
            <button
              className="ghost"
              disabled={busy || Kt === shownJokers.length - 1}
              onClick={() => dispatch({ type: "MOVE_PLUGIN", uid: tt.uid, dir: 1 })}
            >
              Droite ›
            </button>
            <button
              className="ghost danger"
              disabled={busy}
              onClick={() => askSell(tt.uid, k)}
            >
              Vendre +
              {pluginSellPrice(tt.defId)}
              {" $"}
            </button>
          </>}
        />
      );
    }
    let X = run.shop[pluginDetail.offer];
    if (!X || X.kind !== "joker") {
      return null;
    }
    let Vt = !!findRule(contract, "shopClosed");
    return (
      <PluginSheet
        id={X.defId}
        onClose={k}
        actions={<button
          className="primary"
          disabled={X.sold || busy || Vt || run.budget < X.price}
          onClick={() => {
            dispatch({ type: "BUY", index: pluginDetail.offer });
            k();
          }}
        >
          {X.sold ? "Déjà recruté" : `Recruter pour ${X.price} $`}
        </button>}
      />
    );
  };
  return (
    <div className={`app ${contract.boss ? "boss-mode" : ""} ${mobile ? "is-mobile" : ""}`}>
      {run.tuto
        && (
          <TutorialOverlay
            t={run}
            r={dispatch}
            sel={selectedSlot}
            shop={shopPop && run.phase === "build"}
            anim={busy}
            fusion={showFusion}
            closeSel={() => setSelectedSlot(null)}
            onEnd={() => {
              setShopPop(false);
              setSelectedSlot(null);
              setShowFusion(false);
              setSnapshot(null);
              skip();
              dispatch({ type: "TUTO_SET", state: endTutorial() });
            }}
          />
        )}
      <aside className="hud">
        <TopBar
          contract={contract}
          contracts={run.contracts}
          envName={`${COMPANIES[company].name} · ${run.endless ? "∞ Prod infinie" : `${run.level}. ${difficultyInfo(run.level).name}`}`}
          endless={!!run.endless}
          contractIndex={run.contractIndex}
          score={shownScore}
          dataProduced={shownData}
          deploysUsed={run.deploysUsed}
          budget={liveTotals ? liveTotals.budget : run.budget}
          data={liveTotals ? liveTotals.data : run.data}
          goodies={run.goodies ?? []}
          onRules={() => setShowRules(true)}
          onRestart={() => setConfirmQuit(true)}
          onHint={() => setHintFor(hintFor === run.contractIndex ? null : run.contractIndex)}
          hintOn={hintFor === run.contractIndex}
          hintAvailable={!!contractHint(run.contractIndex, contract)}
        />
        <ScorePanel
          playback={playback}
          last={run.lastExecution}
          preview={preview}
          remaining={Math.max(
            0,
            (snapshot?.target ?? contract.target) - (snapshot?.contractScore ?? run.contractScore),
          )}
          canDeploy={busy ? { ok: false } : canDeploy(run)}
          deployCost={deployCost}
          onDeploy={handleDeploy}
          onSkip={skip}
          onSpeed={setSpeed}
          onShop={mobile
            ? ni
            : () => {
              setSelectedSlot(null);
              setShopPop(true);
            }}
          shopClosed={!!findRule(contract, "shopClosed")}
          fusionCount={fusionPairs(run.board).length}
          onFusion={() => {
            setSelectedSlot(null);
            setShowFusion(true);
          }}
        />
        {!mobile
          && (
            <SidePanel
              board={run.board}
              unlocked={run.unlocked}
              familyLevels={run.familyLevels}
              shopPop={shopPop && run.phase === "build"}
              onShopClose={() => setShopPop(false)}
              tab={sideTab}
              onTab={setSideTab}
              locked={busy}
              selected={selected}
              data={run.data}
              budget={run.budget}
              shop={run.shop}
              shopClosed={!!findRule(contract, "shopClosed")}
              rerollCost={run.rerollCost}
              jokers={shownJokers}
              last={run.lastExecution}
              revealed={playback.animating ? playback.index : null}
              hint={hintFor === run.contractIndex ? contractHint(run.contractIndex, contract) : null}
              onUpgrade={(k, X) => dispatch({ type: "UPGRADE", slot: k, branch: X })}
              onFuse={() => {
                setSelectedSlot(null);
                setShowFusion(true);
              }}
              fusionPartner={selected ? findFusionPartner(run.board, selected.slot) : -1}
              fusionShortcut={!run.tuto}
              onSell={(k) => dispatch({ type: "SELL_MODULE", slot: k })}
              onDeselect={() => setSelectedSlot(null)}
              onBuy={(k) => dispatch({ type: "BUY", index: k })}
              onReroll={() => dispatch({ type: "REROLL" })}
              goodies={run.goodies ?? []}
              goodieOffer={run.goodieOffer ?? null}
              goodiePrice={goodieOfferPrice(run)}
              goodiesDone={(run.goodies ?? []).length >= GOODIE_IDS.length}
              nextVersion={contract.version + 1}
              onBuyGoodie={() => dispatch({ type: "BUY_GOODIE" })}
              packAvailable={run.packAvailable === true
                ? 2
                : run.packAvailable === false ? 0 : run.packAvailable | 0}
              packPrice={packPrice(run)}
              onBuyPack={() => dispatch({ type: "BUY_PACK" })}
              arr={arrivalKinds(run)}
              arrTaken={run.arrTaken ?? [false, false]}
              onBuySlot={(k) => dispatch({ type: "BUY_PACK", slot: k })}
              sellValue={selected ? sellPriceOf(selected.module) : null}
              freeUpgrade={freeUpgradeAvailable(run)}
              mobile={mobile}
              onInspectOffer={(k) => setPluginDetail({ offer: k })}
            />
          )}
      </aside>
      <div className="stage">
        <PluginRail
          jokers={shownJokers}
          slots={pluginSlots(run)}
          disabled={disabledNotes}
          pulse={playback.jokerPulse}
          locked={busy}
          onMove={(k, X) => dispatch({ type: "MOVE_PLUGIN", uid: k, dir: X })}
          onSell={askSell}
          compact={mobile}
          onOpen={(k) => setPluginDetail({ uid: k })}
        />
        <main className="workspace">
          <section className="board-col">
            <div className="board-head">
              <h2>Architecture</h2>
              <span className="dim small board-hint">
                Les modules s’activent dans l’ordre des numéros. Glisse-les pour les réorganiser.
              </span>
              <FamilyBar board={shownBoard} levels={run.familyLevels} />
            </div>
            <Board
              board={shownBoard}
              unlocked={run.unlocked}
              broken={brokenSlots(contract)}
              selected={selected ? selectedSlot : null}
              unlockCost={unlockCost(run)}
              budget={run.budget}
              nextUnlock={firstBuyableSlot(run)}
              buyable={buyableSlots(run.unlocked)}
              holes={run.holes}
              drawer={run.drawer}
              onExpand={() => dispatch({ type: "DRAWER_EXPAND" })}
              gatedFrom={99}
              gateLabel={`Rangée 4 : version ${LEGACY_COLUMNS}`}
              fusedUid={run.fusedUid}
              playback={playback}
              locked={busy}
              mobile={mobile}
              onSelect={setSelectedSlot}
              onMove={(k, X) => dispatch({ type: "MOVE_MODULE", from: k, to: X })}
              onUnlock={(k) => dispatch({ type: "UNLOCK", slot: k })}
              crashSlots={Oa}
            />
          </section>
          {mobile
            && (
              <SidePanel
                board={run.board}
                unlocked={run.unlocked}
                familyLevels={run.familyLevels}
                shopPop={shopPop && run.phase === "build"}
                onShopClose={() => setShopPop(false)}
                tab={sideTab}
                onTab={setSideTab}
                locked={busy}
                selected={selected}
                data={run.data}
                budget={run.budget}
                shop={run.shop}
                shopClosed={!!findRule(contract, "shopClosed")}
                rerollCost={run.rerollCost}
                jokers={shownJokers}
                last={run.lastExecution}
                revealed={playback.animating ? playback.index : null}
                hint={hintFor === run.contractIndex ? contractHint(run.contractIndex, contract) : null}
                onUpgrade={(k, X) => dispatch({ type: "UPGRADE", slot: k, branch: X })}
                onFuse={() => {
                  setSelectedSlot(null);
                  setShowFusion(true);
                }}
                fusionPartner={selected ? findFusionPartner(run.board, selected.slot) : -1}
              fusionShortcut={!run.tuto}
                onSell={(k) => dispatch({ type: "SELL_MODULE", slot: k })}
                onDeselect={() => setSelectedSlot(null)}
                onBuy={(k) => dispatch({ type: "BUY", index: k })}
                onReroll={() => dispatch({ type: "REROLL" })}
                goodies={run.goodies ?? []}
                goodieOffer={run.goodieOffer ?? null}
                goodiePrice={goodieOfferPrice(run)}
                goodiesDone={(run.goodies ?? []).length >= GOODIE_IDS.length}
                nextVersion={contract.version + 1}
                onBuyGoodie={() => dispatch({ type: "BUY_GOODIE" })}
                packAvailable={run.packAvailable === true
                  ? 2
                  : run.packAvailable === false ? 0 : run.packAvailable | 0}
                packPrice={packPrice(run)}
                onBuyPack={() => dispatch({ type: "BUY_PACK" })}
                arr={arrivalKinds(run)}
                arrTaken={run.arrTaken ?? [false, false]}
                onBuySlot={(k) => dispatch({ type: "BUY_PACK", slot: k })}
                sellValue={selected ? sellPriceOf(selected.module) : null}
                freeUpgrade={freeUpgradeAvailable(run)}
                mobile={mobile}
                onInspectOffer={(k) => setPluginDetail({ offer: k })}
              />
            )}
        </main>
      </div>
      {pluginDetail && ii()}
      {toast
        && <div key={toast.id} className={`toast ${toast.tone}`} role="status">{toast.text}</div>}
      {canAct
        && run.phase === "reward"
        && (
          <RewardModal
            state={run}
            onChoose={(k) => dispatch({ type: "CHOOSE_REWARD", index: k })}
            onSkip={() => dispatch({ type: "SKIP_REWARD" })}
            onPick={(k, X) => dispatch({ type: "CHOOSE_REWARD", index: k, pick: X })}
            onSellPlugin={askSell}
          />
        )}
      {canAct
        && (run.phase === "victory" || run.phase === "defeat")
        && (
          <EndModal
            state={run}
            onRestart={restart}
            unlocked={newLevel}
            endlessBest={endlessBest}
            newCompanies={newCompanies}
          />
        )}
      {run.phase === "build"
        && !busy
        && !!run.packChoices?.length
        && (
          <PackOpening
            choices={run.packChoices}
            levels={run.familyLevels}
            onPick={(k) => dispatch({ type: "PICK_PACK", family: k })}
            onSkip={() => dispatch({ type: "SKIP_PACK" })}
          />
        )}
      {run.phase === "build"
        && !busy
        && !!run.boxChoices?.length
        && (
          <BoxOpening
            choices={run.boxChoices}
            full={run.jokers.length >= pluginSlots(run)}
            onPick={(k) => dispatch({ type: "PICK_BOX", defId: k })}
            onSkip={() => dispatch({ type: "SKIP_BOX" })}
          />
        )}
      {showFusion
        && run.phase === "build"
        && (
          <FusionModal
            board={run.board}
            pairs={fusionPairs(run.board)}
            near={nearFusions(run)}
            locked={busy}
            mobile={mobile}
            onFuse={(k, X) => dispatch({ type: "FUSE", slot: k, partner: X })}
            onClose={() => setShowFusion(false)}
          />
        )}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {confirmQuit && <QuitConfirm onYes={restart} onNo={() => setConfirmQuit(false)} />}
      {sellTarget
        && (
          <SellConfirm
            defId={sellTarget.defId}
            onNo={() => setSellAsk(null)}
            onYes={() => {
              dispatch({ type: "SELL_PLUGIN", uid: sellTarget.uid });
              sellAsk.after?.();
              setSellAsk(null);
            }}
          />
        )}
    </div>
  );
}
