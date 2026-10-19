// L'écran de jeu. Il lit la vue de la partie et transmet les actions du joueur au service.

import { useState } from "react";
import { ARCHITECTURE_BY_ID, Phase, frNumber } from "../domain/index.js";
import { useGame, useGameView } from "./GameContext.jsx";
import { refusalMessage } from "./messages.js";
import { useToast } from "./hooks/useToast.js";
import { useDeployAnimation } from "./hooks/useDeployAnimation.js";
import { ContractHeader } from "./components/ContractHeader.jsx";
import { Counters } from "./components/Counters.jsx";
import { ArchitectureBanner } from "./components/ArchitectureBanner.jsx";
import { Formula } from "./components/Formula.jsx";
import { PluginRail } from "./components/PluginRail.jsx";
import { BoardGrid } from "./components/BoardGrid.jsx";
import { Hand } from "./components/Hand.jsx";
import { DetailPanel } from "./components/DetailPanel.jsx";
import { Toast } from "./components/Toast.jsx";
import { WonScreen } from "./screens/WonScreen.jsx";
import { ShopScreen } from "./screens/ShopScreen.jsx";
import { EndScreen } from "./screens/EndScreen.jsx";
import { ParcScreen } from "./screens/ParcScreen.jsx";
import { ArchitecturesScreen } from "./screens/ArchitecturesScreen.jsx";
import { RulesScreen } from "./screens/RulesScreen.jsx";

const RULES_SEEN = "rulesSeen";

export function App() {
  const { game, sound, preferences } = useGame();
  const view = useGameView();
  const [selection, setSelection] = useState([]);
  const [overlay, setOverlay] = useState(() => (preferences.get(RULES_SEEN) === "1" ? null : { name: "rules" }));
  const [shopMode, setShopMode] = useState(null);
  const [toast, showToast] = useToast();
  const { animation, play } = useDeployAnimation({ game, sound });
  const busy = Boolean(animation);

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
    if (selection.length === 1) { if (attempt(game.placeCard(selection[0], cell))) setSelection([]); }
    else if (selection.length > 1) showToast("Choisis une seule carte pour la poser.");
  };

  const discard = () => { if (attempt(game.discardCards(selection), "reroll")) setSelection([]); };

  const deploy = async () => {
    setSelection([]);
    const result = await play();
    if (result) showToast(`${ARCHITECTURE_BY_ID[result.architecture.id].name} · +${result.score} Performance (${result.compute} × ${frNumber(result.scale)})`);
  };

  const shopActions = {
    buy: (index) => attempt(game.buyOffer(index), "cash"),
    reroll: () => attempt(game.rerollShop(), "reroll"),
    setMode: setShopMode,
    upgrade: (uid) => { if (attempt(game.upgradeCard(uid), "upgrade")) { showToast("Module amélioré."); setShopMode(null); } },
    remove: (uid) => { if (attempt(game.removeCard(uid), "sell")) { showToast("Module retiré du parc."); setShopMode(null); } },
    showParc: () => setOverlay({ name: "parc", from: "shop" }),
    showArchitectures: () => setOverlay({ name: "archs", from: "shop" }),
    next: () => { attempt(game.nextContract()); setSelection([]); },
  };

  const closeOverlay = () => setOverlay(null);
  const backLabel = overlay?.from === "shop" ? "Retour à la boutique" : "Retour au plateau";
  const preview = view.preview;
  const formula = animation?.formula ?? preview;
  const canPlace = selection.length === 1 && view.placedCount < view.limits.maxPlaced;

  return (
    <>
      <main className="app">
        <div className="left">
          <ContractHeader view={view} />
          <Counters view={view} />
          <ArchitectureBanner preview={preview} flash={animation?.flash} onShowAll={() => setOverlay({ name: "archs", from: "board" })} />
          <Formula compute={formula.compute} scale={formula.scale} score={formula.score} pulse={animation?.step} />
          <PluginRail pluginIds={view.pluginIds} fired={animation?.fired} />
          <BoardGrid
            view={view}
            canPlace={canPlace}
            highlight={animation?.highlight ?? (preview.count && preview.architecture.id !== "monolithe" ? preview.architecture.members : [])}
            firing={animation?.firing}
            pops={animation?.pops}
            onCell={touchCell}
          />
        </div>
        <div className="right">
          <Hand view={view} selection={selection} onToggle={toggleCard} onShowParc={() => setOverlay({ name: "parc", from: "board" })} onShowRules={() => setOverlay({ name: "rules" })} />
          <div className="actions">
            <button className="btn discard" disabled={!view.discardsLeft || !selection.length || busy} onClick={discard}>
              Défausser{selection.length ? ` (${selection.length})` : ""}
            </button>
            <button className="btn deploy" disabled={!view.placedCount || busy} onClick={deploy}>DÉPLOYER</button>
          </div>
          <DetailPanel view={view} selection={selection} />
        </div>
      </main>

      {!busy && !overlay && view.phase === Phase.WON && <WonScreen view={view} onShop={() => { setShopMode(null); attempt(game.openShop(), "cash"); }} />}
      {!busy && !overlay && view.phase === Phase.SHOP && <ShopScreen view={view} mode={shopMode} actions={shopActions} />}
      {!busy && !overlay && (view.phase === Phase.LOST || view.phase === Phase.VICTORY) && (
        <EndScreen view={view} onNewRun={() => { sound.play(view.phase === Phase.VICTORY ? "victory" : "click"); game.newRun(); setSelection([]); }} />
      )}
      {overlay?.name === "parc" && <ParcScreen view={view} backLabel={backLabel} onBack={closeOverlay} />}
      {overlay?.name === "archs" && <ArchitecturesScreen view={view} backLabel={backLabel} onBack={closeOverlay} />}
      {overlay?.name === "rules" && <RulesScreen onClose={() => { preferences.set(RULES_SEEN, "1"); closeOverlay(); }} />}
      <Toast text={toast} />
    </>
  );
}
