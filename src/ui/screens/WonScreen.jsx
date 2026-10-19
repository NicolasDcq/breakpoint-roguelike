import { PLUGIN_ICONS } from "../visuals.js";
import { Overlay } from "../components/Overlay.jsx";

export function WonScreen({ view, onShop }) {
  const { contract, score, lastPay, money, data } = view;
  return (
    <Overlay label="Contrat livré">
      <div className="title-neon gold">CONTRAT LIVRÉ</div>
      <div className="panel" style={{ padding: "10px 12px" }}>
        <div className="stat"><span>{contract.name}</span><b className="num">{score} / {contract.target}</b></div>
        <div className="stat"><span>Paiement</span><b className="num" style={{ color: "var(--amber)" }}>+{lastPay.pay} $</b></div>
        <div className="stat"><span>Déploiements non utilisés</span><b className="num" style={{ color: "var(--amber)" }}>+{lastPay.left} $</b></div>
        {lastPay.interest > 0 && <div className="stat"><span>{PLUGIN_ICONS.accountant} Intérêts du Comptable</span><b className="num" style={{ color: "var(--amber)" }}>+{lastPay.interest} $</b></div>}
        <div className="stat"><span>Caisse</span><b className="num">{money} $ · {data} ◆</b></div>
      </div>
      <button className="btn go" onClick={onShop}>BOUTIQUE</button>
    </Overlay>
  );
}
