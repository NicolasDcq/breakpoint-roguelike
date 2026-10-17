// Goodies : icônes, autocollants, laptop, offre en boutique.

import { GOODIES } from "../../engine/goodies.js";
import { Tooltip } from "../common/Tooltip.jsx";
import { FX } from "../fx.jsx";

const GOODIE_ICONS = {
  hoodie: <path d="M8 3L3 7l2 4 2-1v11h10V10l2 1 2-4-5-4c0 2-1.8 3-4 3S8 5 8 3z" />,
  tote: <path d="M4 8h16l-1.5 13h-13zM9 8V6a3 3 0 0 1 6 0v2" />,
  clavier: <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h1M10 10h1M14 10h1M17.5 10h.5M7 14h10" />
  </>,
  stickers: <path d="M4 4h16v10l-6 6H4zM14 20v-6h6" />,
  badge: <><rect x="5" y="7" width="14" height="14" rx="2" /><path d="M12 2v5M9 13h6M9 16.5h4" /></>,
  gourde: <path d="M9 2h6v3l2 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8l2-3zM7 12h10" />,
  casque: <>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="2.5" y="14" width="4" height="6" rx="1.5" />
    <rect x="17.5" y="14" width="4" height="6" rx="1.5" />
  </>,
};

function GoodieIcon({ id, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#05070f"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {GOODIE_ICONS[GOODIES[id].icon]}
    </svg>
  );
}

function Sticker({ id, index = 0, size = 22 }) {
  let a = GOODIES[id];
  let r = [-7, 5, -3, 8, -5, 4, -8, 6][index % 8];
  return (
    <span
      className={`sticker tier-${a.tier}`}
      style={{ background: a.color, width: size, height: size, "--r": `${r}deg` }}
    >
      <GoodieIcon id={id} size={Math.round(size * 0.62)} />
    </span>
  );
}

function GoodieList({ goodies }) {
  return (
    <div className="tip-body goodie-tip">
      <strong>Goodies de la run</strong>
      {goodies.length
        ? (
          <ul className="goodie-list">
            {goodies.map((t) => (
              <li key={t}>
                <Sticker id={t} size={20} />
                <span><b>{GOODIES[t].name}</b>{" "}{FX(GOODIES[t].text)}</span>
              </li>
            ))}
          </ul>
        )
        : (
          <p>
            Aucun pour l’instant. Un goodie est en vente dans la boutique à chaque version : son effet dure toute la run.
          </p>
        )}
    </div>
  );
}

export function Laptop({ goodies, max = 7 }) {
  let o = goodies.slice(0, max);
  let a = goodies.length - o.length;
  return (
    <Tooltip touch content={<GoodieList goodies={goodies} />} className="laptop-wrap">
      <div
        className={`laptop ${goodies.length ? "" : "empty"}`}
        tabIndex={0}
        aria-label={`${goodies.length} goodie${goodies.length > 1 ? "s" : ""}`}
      >
        <span className="laptop-logo" aria-hidden="true" />
        {o.map((r, n) => <Sticker key={r} id={r} index={n} />)}
        {a > 0 && <span className="laptop-more num">+{a}</span>}
        {!goodies.length && <span className="laptop-empty">Goodies</span>}
      </div>
    </Tooltip>
  );
}

export function GoodieOffer({ id, price, budget, disabled, nextVersion, allCollected, onBuy }) {
  if (!id || price === null) {
    return (
      <div className="goodie-sheet done">
        <span className="goodie-sheet-head">Planche de goodies</span>
        <span className="goodie-sheet-wait">
          {allCollected
            ? "Tous les goodies sont collés sur ton laptop."
            : `Prochain goodie à la version ${nextVersion}.`}
        </span>
      </div>
    );
  }
  let d = GOODIES[id];
  let u = budget >= price;
  return (
    <div className="goodie-sheet">
      <span className="goodie-sheet-corner" aria-hidden="true" />
      <div className="goodie-sheet-head">
        <span>Planche de goodies</span>
        <span className="goodie-sheet-note">1 par version · effet permanent</span>
      </div>
      <div className="goodie-sheet-body">
        <Sticker id={id} size={50} />
        <div className="goodie-sheet-text">
          <span className="goodie-name">
            {d.name}
            {" "}
            <span className="goodie-lvl">{"Niv. "}{d.tier}</span>
          </span>
          <span className="goodie-effect">{FX(d.text)}</span>
          {d.tier === 1
            && (
              <span className="goodie-next">
                {"Puis : "}
                {Object.values(GOODIES).find((i) => i.requires === id)?.name}
              </span>
            )}
        </div>
        <button
          className={`goodie-buy ${u ? "" : "short"}`}
          disabled={disabled || !u}
          onClick={onBuy}
        >
          <span className="num">{price}{" $"}</span>
        </button>
      </div>
    </div>
  );
}
