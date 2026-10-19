// Point d'entrée et racine de composition : on branche ici les adaptateurs
// (sauvegarde, hasard, son, préférences) sur le service applicatif et l'interface.

import "./ui/styles/parc.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameService } from "./application/GameService.js";
import { LocalStorageRunRepository } from "./infrastructure/storage/LocalStorageRunRepository.js";
import { LocalPreferenceStore } from "./infrastructure/storage/LocalPreferenceStore.js";
import { randomSeedSource } from "./infrastructure/random/RandomSeedSource.js";
import { webAudioSound } from "./infrastructure/audio/WebAudioSound.js";
import { GameProvider } from "./ui/GameContext.jsx";
import { App } from "./ui/App.jsx";

const game = new GameService({ repository: new LocalStorageRunRepository(), seeds: randomSeedSource });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GameProvider game={game} sound={webAudioSound} preferences={new LocalPreferenceStore()}>
      <App />
    </GameProvider>
  </StrictMode>,
);
