// L'écran de jeu. Il lit la vue de la partie et transmet les actions du joueur au service.

import { useState } from "react";
import { ARCHITECTURE_BY_ID, MODULES, PACKS, PLUGINS, Phase, RULES } from "../domain/index.js";
import { useGame, useGameView } from "./GameContext.jsx";
import { refusalMessage } from "./messages.js";
import { fmt, fmtDec } from "./format.js";
import { MOBILE_QUERY, useMediaQuery } from "./hooks/useMediaQuery.js";
import { useToast } from "./hooks/useToast.js";
import { useDeployAnimation } from "./hooks/useDeployAnimation.js";
import { useTileDrag } from "./hooks/useTileDrag.js";
import { TopBar } from "./components/TopBar.jsx";
import { ScorePanel } from "./components/ScorePanel.jsx";
import { PluginRail } from "./components/PluginRail.jsx";
import { TerminalRail } from "./components/TerminalRail.jsx";
import { TerminalModal } from "./terminal/TerminalModal.jsx";
import { BoardView, HandRow } from "./components/BoardView.jsx";
import { ArchitectureList } from "./components/ArchitectureList.jsx";
import { TerminalTray } from "./components/TerminalTray.jsx";
import { GameHud } from "./components/GameHud.jsx";
import { ModuleDetail } from "./components/ModuleDetail.jsx";
import { FamilyBar } from "./components/FamilyBar.jsx";
import { SideDetail } from "./components/SideDetail.jsx";
import { ModuleSheet } from "./components/ModuleSheet.jsx";
import { ShopModal } from "./screens/ShopModal.jsx";
import { EndModal, WonModal } from "./screens/ResultModals.jsx";
import { PackOpening } from "./screens/Packs.jsx";
import { ArchitecturesModal, ConfirmNewRun, ParcModal, PluginModal, RulesModal } from "./screens/InfoModals.jsx";
import { MainMenu } from "./screens/MainMenu.jsx";
import { Tutorial, TutorialOffer } from "./tutorial/Tutorial.jsx";

const RULES_SEEN = "rulesSeen";
const TUTO_SEEN = "tutoSeen";

export function App() {
  const { game, sound, preferences } = useGame();
  const view = useGameView();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [screen, setScreen] = useState("menu");
  const [marked, setMarked] = useState([]);
  const [discarding, setDiscarding] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [hoverUid, setHoverUid] = useState(null);
  const firstVisit = preferences.get(RULES_SEEN) !== "1" && preferences.get(TUTO_SEEN) !== "1";
  const [overlay, setOverlay] = useState(null);
  const [terminal, setTerminal] = useState(null);
  const [tuto, setTuto] = useState(false);
  const [offerTuto, setOfferTuto] = useState(firstVisit);
  const endTuto = () => { preferences.set(TUTO_SEEN, "1"); preferences.set(RULES_SEEN, "1"); setTuto(false); setOfferTuto(false); };
  const startTuto = () => { game.startTutorial(); setMarked([]); setTerminal(null); setTuto(true); setOfferTuto(false); preferences.set(TUTO_SEEN, "1"); preferences.set(RULES_SEEN, "1"); };
  const [toast, showToast] = useToast();
  const { animation, play, setSpeed, skip } = useDeployAnimation({ game, sound, preferences });
  const busy = Boolean(animation);
  const open = (name, extra = {}) => setOverlay({ name, ...extra });
  const close = () => setOverlay(null);

  /** Exécute une action ; en cas de refus, explique pourquoi. */
  const attempt = (result, sfx = "click") => {
    if (result.ok) sound.play(sfx);
    else { sound.play("error"); showToast(refusalMessage(result.reason, view)); }
    return result.ok;
  };

  const toggleDiscard = (uid) => {
    sound.play("click");
    setMarked((current) => (current.includes(uid) ? current.filter((other) => other !== uid) : [...current, uid]));
  };

  const placeCard = (uid, cell) => {
    if (view.board[cell] && !attempt(game.takeBack(cell))) return false;
    if (!attempt(game.placeCard(uid, cell), "upgrade")) return false;
    setMarked((current) => current.filter((other) => other !== uid));
    return true;
  };

  const { drag, dragProps } = useTileDrag({
    locked: busy,
    onTap: (source) => {
      if (discarding) { if (source.kind === "hand") toggleDiscard(source.uid); return; }
      sound.play("click");
      setSheet(source);
    },
    onDrop: (source, target) => {
      if (!target) return;
      if (source.kind === "hand" && target.kind === "cell") placeCard(source.uid, target.cell);
      if (source.kind === "cell" && target.kind === "cell") attempt(game.moveCard(source.cell, target.cell));
      if (source.kind === "cell" && target.kind === "hand") attempt(game.takeBack(source.cell));
    },
  });

  const sheetActions = {
    place: (uid, cell) => { if (placeCard(uid, cell)) setSheet(null); },
    takeBack: (cell) => { if (attempt(game.takeBack(cell))) setSheet(null); },
    upgrade: (uid) => { if (attempt(game.upgradeCard(uid), "upgrade")) showToast("Module amélioré."); },
  };
  const sheetCard = sheet && (sheet.kind === "hand" ? view.hand : view.board).find((card) => card?.uid === sheet.uid);
  const sheetPlace = sheetCard && sheet.kind === "cell" ? { kind: "cell", cell: view.board.findIndex((card) => card?.uid === sheet.uid) } : { kind: "hand" };

  /** Défausser en deux temps : on entre dans le mode, on choisit, puis on confirme. */
  const stopDiscarding = () => { setDiscarding(false); setMarked([]); };
  const discard = () => {
    if (!discarding) { sound.play("click"); setSheet(null); setDiscarding(true); return; }
    if (!marked.length) { stopDiscarding(); return; } // rien de choisi : on annule
    if (attempt(game.discardCards(marked), "reroll")) stopDiscarding();
  };

  const deploy = async () => {
    stopDiscarding();
    const result = await play();
    if (result) showToast(`${ARCHITECTURE_BY_ID[result.architecture.id].name} · +${fmt(result.score)} Performance (${fmt(result.compute)} × ${fmtDec(result.scale)})`);
  };

  const pickFromPack = (choiceId, replacePluginId = null) => {
    if (!attempt(game.pickFromPack(choiceId, replacePluginId), choiceId ? "upgrade" : "click") || !choiceId) return;
    if (PACKS[view.openPack.packId].reward === "plugin") showToast(`${PLUGINS[choiceId].name} rejoint tes Plugins.`);
    else if (view.openPack.packId === "terminal") showToast(`${choiceId} rejoint ton Terminal.`);
    else if (view.openPack.packId === "booster") showToast(`Plan installé : ${ARCHITECTURE_BY_ID[choiceId].name} niveau ${view.architectureLevels[choiceId] + 1}.`);
    else showToast(`${MODULES[choiceId].name} rejoint ton parc.`);
  };

  const newRun = () => { game.newRun(); stopDiscarding(); setTerminal(null); setTuto(false); close(); };

  /** Ouvre le terminal sur la commande d'un emplacement (en refusant d'abord si elle ne s'utilise pas maintenant). */
  const useCommand = (slot) => {
    const id = view.commands[slot];
    const result = game.useCommand(slot);
    if (!attempt(result, "click")) return;
    setTerminal({ slot, id, commandId: result.value.commandId, value: result.value });
  };
  const closeTerminal = (cancel) => {
    if (cancel) game.cancelCommand();
    setTerminal(null);
  };

  const shopActions = {
    buy: (index, replacePluginId = null) => attempt(game.buyOffer(index, replacePluginId), replacePluginId ? "sell" : "cash"),
    buyPack: (slotIndex) => attempt(game.buyPack(slotIndex), "cash"),
    useCommand,
    reroll: () => attempt(game.rerollShop(), "reroll"),
    showParc: () => open("parc"),
    next: () => { attempt(game.nextContract()); stopDiscarding(); },
  };

  // Tant que le joueur n'a pas lancé ou repris une partie, l'accueil remplace le jeu.
  if (screen === "menu") {
    return <MainMenu onPlay={(fresh) => { if (fresh) setTuto(false); setScreen("game"); }} onTutorial={() => { startTuto(); setScreen("game"); }} />;
  }

  const phaseScreen = !busy && !overlay && {
    [Phase.WON]: <WonModal view={view} onShop={() => { attempt(game.openShop(), "cash"); }} />,
    [Phase.SHOP]: <ShopModal view={view} actions={shopActions} desktop={!mobile} />,
    [Phase.LOST]: <EndModal view={view} onNewRun={newRun} />,
    [Phase.VICTORY]: <EndModal view={view} onNewRun={newRun} />,
  }[view.phase];

  const side = <SideDetail marked={marked} discarding={discarding} desktop={!mobile} />;

  const hud = (
    <>
      <TopBar view={view} onRules={() => open("rules")} onRestart={() => open("confirm")} />
      <ScorePanel
        view={view}
        animation={animation}
        selectionCount={marked.length}
        discarding={discarding}
        onDiscard={discard}
        onDeploy={deploy}
        onParc={() => open("parc")}
        onArchitectures={() => open("archs")}
        onSkip={skip}
        onSpeed={setSpeed}
      />
    </>
  );

  const overlays = (
    <>
      {phaseScreen || null}
      {!busy && !overlay && view.phase === Phase.SHOP && view.openPack && (
        <PackOpening key={view.openPack.choices.join()} view={view} onPick={pickFromPack} />
      )}
      {sheetCard && !busy && (
        <ModuleSheet card={sheetCard} place={sheetPlace} view={view} desktop={!mobile} onClose={() => setSheet(null)} actions={sheetActions} />
      )}
      {overlay?.name === "rules" && <RulesModal onClose={() => { preferences.set(RULES_SEEN, "1"); close(); }} />}
      {overlay?.name === "archs" && <ArchitecturesModal view={view} onClose={close} />}
      {overlay?.name === "parc" && <ParcModal view={view} onClose={close} />}
      {overlay?.name === "plugin" && <PluginModal id={overlay.id} value={view.pluginValues[overlay.id] ?? null} onClose={close} />}
      {overlay?.name === "confirm" && <ConfirmNewRun onYes={newRun} onNo={close} />}
      {tuto && <Tutorial view={view} hidden={busy || Boolean(overlay)} onQuit={endTuto} onNewRun={() => { endTuto(); newRun(); }} />}
      {offerTuto && !tuto && <TutorialOffer onStart={startTuto} onSkip={endTuto} />}
      {terminal && <TerminalModal view={view} session={terminal} game={game} sound={sound} showToast={showToast} onClose={closeTerminal} />}
    </>
  );

  if (!mobile) {
    const hoverCard = [...view.board, ...view.hand].find((card) => card && String(card.uid) === hoverUid) ?? view.board.find(Boolean) ?? null;
    const upgradeCard = (uid) => { if (attempt(game.upgradeCard(uid), "upgrade")) showToast("Module amélioré."); };
    return (
      <div className={`app gd-app ${view.contract.boss ? "boss-mode" : ""}`}>
        <GameHud
          view={view}
          animation={animation}
          selectionCount={marked.length}
          discarding={discarding}
          onDiscard={discard}
          onDeploy={deploy}
          onParc={() => open("parc")}
          onArchitectures={() => open("archs")}
          onSkip={skip}
          onSpeed={setSpeed}
          onRules={() => open("rules")}
          onRestart={() => open("confirm")}
        />
        <div className="gd-center" onPointerOver={(event) => { const uid = event.target.closest?.("[data-uid]")?.dataset.uid; if (uid) setHoverUid(uid); }}>
          <div className="gd-strip">
            <section className="gd-pan gd-plugins" aria-label="Plugins">
              <header className="gd-panel-head"><span className="gd-label">Plugins · {view.pluginIds.length}/{RULES.maxPlugins}</span></header>
              <PluginRail pluginIds={view.pluginIds} values={view.pluginValues} fired={animation?.fired} firing={animation?.pluginFiring} locked={busy} onOpen={(id) => open("plugin", { id })} onMove={(from, to) => attempt(game.movePlugin(from, to), "click")} />
            </section>
            <TerminalTray view={view} locked={busy} onUse={useCommand} />
          </div>
          <div className="gd-mid">
            <div className="gd-piles" aria-label="Piles">
              <div className="gd-pile"><span className="gd-stack"><b className="num">{view.drawCount}</b></span><span className="gd-label">Pioche</span></div>
              <div className="gd-pile used"><span className="gd-stack"><b className="num">{view.playedCount}</b></span><span className="gd-label">Défausse</span></div>
            </div>
            <div className="gd-board">
              <BoardView view={view} marked={marked} discarding={discarding} animation={animation} locked={busy} drag={drag} dragProps={dragProps} withHand={false} />
            </div>
            <aside className="gd-info">
              <ArchitectureList view={view} onShowAll={() => open("archs")} />
              <ModuleDetail view={view} card={hoverCard} locked={busy} onUpgrade={upgradeCard} />
            </aside>
          </div>
          <HandRow view={view} marked={marked} discarding={discarding} locked={busy} drag={drag} dragProps={dragProps} />
        </div>
        {overlays}
      </div>
    );
  }

  return (
    <div className={`app ${view.contract.boss ? "boss-mode" : ""} ${mobile ? "is-mobile" : ""}`}>
      <aside className="hud">
        {hud}
        {!mobile && side}
      </aside>
      <div className="stage">
        <PluginRail pluginIds={view.pluginIds} values={view.pluginValues} fired={animation?.fired} firing={animation?.pluginFiring} locked={busy} compact={mobile} onOpen={(id) => open("plugin", { id })} onMove={(from, to) => attempt(game.movePlugin(from, to), "click")} />
        {view.commands.length > 0 && <TerminalRail view={view} locked={busy} onUse={useCommand} />}
        <main className="workspace">
          <section className="board-col">
            <div className="board-head">
              <h2>Architecture</h2>
              <span className="dim small board-hint">Les modules s’activent dans l’ordre des numéros. Glisse-les pour les poser ou les réorganiser.</span>
              <FamilyBar board={view.board} />
            </div>
            <BoardView view={view} marked={marked} discarding={discarding} animation={animation} locked={busy} drag={drag} dragProps={dragProps} />
          </section>
          {mobile && side}
        </main>
      </div>
      {overlays}
    </div>
  );
}
