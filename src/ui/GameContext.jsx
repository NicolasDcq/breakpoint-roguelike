// Branche l'interface sur le service applicatif et les adaptateurs (son, préférences).

import { createContext, useContext, useSyncExternalStore } from "react";

const GameContext = createContext(null);

export function GameProvider({ game, sound, preferences, children }) {
  return <GameContext.Provider value={{ game, sound, preferences }}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}

/** La vue de la partie, mise à jour à chaque action. */
export function useGameView() {
  const { game } = useGame();
  return useSyncExternalStore((listener) => game.subscribe(listener), () => game.getView());
}
