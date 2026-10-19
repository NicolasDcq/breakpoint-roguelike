// En-tête : le contrat en cours, sa progression, la caisse et la Data.

export function ContractHeader({ view }) {
  const { contract, score, bossRule, money, data } = view;
  const progress = Math.min(100, Math.round((score / contract.target) * 100));
  return (
    <div className="panel head">
      <div className={`chip-v ${contract.boss ? "boss" : ""}`}>
        <span><small>V{contract.version}</small><b>{contract.letter}</b></span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="head-name">{contract.name}</div>
        <div className="num" style={{ fontSize: 13 }}>
          <span style={{ color: "var(--amber)" }}>{score}</span> / {contract.target} Performance
        </div>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        {bossRule && <div className="head-rule">⚠ {bossRule}</div>}
      </div>
      <div className="res num"><span className="m">{money} $</span><span className="d">{data} ◆</span></div>
    </div>
  );
}
