import { RULES } from "../../domain/index.js";
import { Pips } from "./Pips.jsx";

export function Counters({ view }) {
  return (
    <div className="counters">
      <div className="panel counter"><span className="lbl">Déploiements</span><Pips total={view.limits.deploys} left={view.deploysLeft} /></div>
      <div className="panel counter"><span className="lbl">Défausses</span><Pips className="dis" total={RULES.discardsPerContract} left={view.discardsLeft} /></div>
    </div>
  );
}
