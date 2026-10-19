// L'écran de jeu. Il lit la vue de la partie et transmet les actions du joueur au service.

import { useState } from "react";
import { ARCHITECTURE_BY_ID, Phase } from "../domain/index.js";
import { useGame, useGameView } from "./GameContext.jsx";
import { refusalMessage } from "./messages.js";
import { fmt, fmtDec } from "./format.js";
import { MOBILE_QUERY, useMediaQuery } from "./hooks/useMediaQuery.js";
import { useToast } from "./hooks/useToast.js";
import { useDeployAnimation } from "./hooks/useDeployAnimation.js";
import { TopBar } from "./components/TopBar.jsx";
import { ScorePanel } from "./components/ScorePanel.jsx";
import { PluginRail } from "./components/PluginRail.jsx";
import { BoardView } from "./components/BoardView.jsx";
import { FamilyBar } from "./components/FamilyBar.jsx";
import { SideDetail } from "./components/SideDetail.jsx";
import { ShopModal } from "./screens/ShopModal.jsx";
import { EndModal, WonModal } from "./screens/ResultModals.jsx";
import { ArchitecturesModal, ConfirmNewRun, ParcModal, PluginModal, RulesModal } from "./screens/InfoModals.jsx";

const RULES_SEEN = "rulesSeen";

export function App() {
  const { game, sound, preferences } = useGame();
  const view = useGameView();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [selection, setSelection] = useState([]);
  const [overlay, setOverlay] = useState(() => (preferences.get(RULES_SEEN) === "1" ? null : { name: "rules" }));
  const [shopMode, setShopMode] = useState(null);
  const [toast, showToast] = useToast();
  const { animation, play, setSpeed, skip } = useDeployAnimation({ game, sound });
  const busy = Boolean(animation);
  const open = (name, extra = {}) => setOverlay({ name, ...extra });
  const close = () => setOverlay(null);

  /** Exécute une action ; en cas de refus, explique pourquoi. */
  const attempt = (result, sfx = "click") => {
    if (result.ok) sound.play(sfx);
    else { sound.play("error"); showToast(refusalMessage(result.reason, view)); }
    return result.ok;
  };

  const toggleCard = (uid) => {
    if (busy) return;
    sound.play("click");
    setSelection((current) => (current.includes(uid) ? current.filter((other) => other !== uid) : [...current, uid]));
  };

  const touchCell = (cell) => {
    if (busy) return;
    if (view.board[cell]) { attempt(game.takeBack(cell)); setSelection([]); return; }
    if (selection.length === 1) { if (attempt(game.placeCard(selection[0], cell), "upgrade")) setSelection([]); }
    else if (selection.length > 1) showToast("Choisis une seule carte pour la poser.");
  };

  const discard = () => { if (attempt(game.discardCards(selection), "reroll")) setSelection([]); };

  const deploy = async () => {
    setSelection([]);
    const result = await play();
    if (result) showToast(`${ARCHITECTURE_BY_ID[result.architecture.id].name} · +${fmt(result.score)} Performance (${fmt(result.compute)} × ${fmtDec(result.scale)})`);
  };

  const newRun = () => { game.newRun(); setSelection([]); setShopMode(null); close(); };

  const shopActions = {
    buy: (index) => attempt(game.buyOffer(index), "cash"),
    reroll: () => attempt(game.rerollShop(), "reroll"),
    setMode: setShopMode,
    upgrade: (uid) => { if (attempt(game.upgradeCard(uid), "upgrade")) { showToast("Module amélioré."); setShopMode(null); } },
    remove: (uid) => { if (attempt(game.removeCard(uid), "sell")) { showToast("Module retiré du parc."); setShopMode(null); } },
    showParc: () => open("parc"),
    next: () => { attempt(game.nextContract()); setSelection([]); },
  };

  const phaseScreen = !busy && !overlay && {
    [Phase.WON]: <WonModal view={view} onShop={() => { setShopMode(null); attempt(game.openShop(), "cash"); }} />,
    [Phase.SHOP]: <ShopModal view={view} mode={shopMode} actions={shopActions} />,
    [Phase.LOST]: <EndModal view={view} onNewRun={newRun} />,
    [Phase.VICTORY]: <EndModal view={view} onNewRun={newRun} />,
  }[view.phase];

  const side = <SideDetail view={view} selection={selection} desktop={!mobile} />;

  return (
    <div className={`app ${view.contract.boss ? "boss-mode" : ""} ${mobile ? "is-mobile" : ""}`}>
      <aside className="hud">
        <TopBar view={view} onRules={() => open("rules")} onRestart={() => open("confirm")} />
        <ScorePanel
          view={view}
          animation={animation}
          selectionCount={selection.length}
          onDiscard={discard}
          onDeploy={deploy}
          onParc={() => open("parc")}
          onArchitectures={() => open("archs")}
          onSkip={skip}
          onSpeed={setSpeed}
        />
        {!mobile && side}
      </aside>
      <div className="stage">
        <PluginRail pluginIds={view.pluginIds} fired={animation?.fired} compact={mobile} onOpen={(id) => open("plugin", { id })} />
        <main className="workspace">
          <section className="board-col">
            <div className="board-head">
              <h2>Architecture</h2>
              <span className="dim small board-hint">Les modules s’activent dans l’ordre des numéros. Touche une carte de ta main, puis une case.</span>
              <FamilyBar board={view.board} />
            </div>
            <BoardView view={view} selection={selection} animation={animation} locked={busy} onCell={touchCell} onToggle={toggleCard} />
          </section>
          {mobile && side}
        </main>
      </div>
      {phaseScreen || null}
      {overlay?.name === "rules" && <RulesModal onClose={() => { preferences.set(RULES_SEEN, "1"); close(); }} />}
      {overlay?.name === "archs" && <ArchitecturesModal view={view} onClose={close} />}
      {overlay?.name === "parc" && <ParcModal view={view} onClose={close} />}
      {overlay?.name === "plugin" && <PluginModal id={overlay.id} onClose={close} />}
      {overlay?.name === "confirm" && <ConfirmNewRun onYes={newRun} onNo={close} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
