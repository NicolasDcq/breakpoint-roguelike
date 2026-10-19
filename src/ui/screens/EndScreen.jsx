import { CONTRACTS, Phase, PLUGINS } from "../../domain/index.js";
import { PLUGIN_ICONS } from "../visuals.js";
import { Overlay } from "../components/Overlay.jsx";

export function EndScreen({ view, onNewRun }) {
  const victory = view.phase === Phase.VICTORY;
  const delivered = victory ? CONTRACTS.length : view.contractIndex;
  return (
    <Overlay label={victory ? "Victoire" : "Contrat raté"}>
      <div className={`title-neon ${victory ? "gold" : "red"}`}>{victory ? "VICTOIRE" : "CONTRAT RATÉ"}</div>
      <div className="panel" style={{ padding: "10px 12px" }}>
        <div className="stat"><span>{victory ? "Tous les contrats livrés" : view.contract.name}</span><b className="num">{victory ? `${CONTRACTS.length} / ${CONTRACTS.length}` : `${view.score} / ${view.contract.target}`}</b></div>
        <div className="stat"><span>Contrats réussis</span><b className="num">{delivered} / {CONTRACTS.length}</b></div>
        <div className="stat"><span>Parc final</span><b className="num">{view.parc.length} modules</b></div>
        <div className="stat"><span>Plugins</span><span title={view.pluginIds.map((id) => PLUGINS[id].name).join(", ")}>{view.pluginIds.map((id) => PLUGIN_ICONS[id]).join(" ") || "aucun"}</span></div>
      </div>
      <button className="btn go" onClick={onNewRun}>NOUVELLE PARTIE</button>
    </Overlay>
  );
}
