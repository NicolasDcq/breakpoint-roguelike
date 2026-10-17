// Choix et badges des entreprises.

import { useRef } from "react";
import { COMPANIES, COMPANY_IDS } from "../../engine/companies.js";
import { MAX_DIFFICULTY } from "../../engine/difficulty.js";
import { MODULES } from "../../engine/modules.js";
import { UNLOCK_CONDITIONS, totalWins } from "../../save/profile.js";

export const STAKE_COLORS = ["#eef2ff", "#ff5a5a", "#2bd96b", "#3b4466", "#3d7bff", "#9b6bff", "#ff8a1f", "#ffd23a"];

const COMPANY_ICONS = {
  startup: <>
    <path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10zM9 16l-3 4h4M15 16l3 4h-4" />
    <circle cx="12" cy="9" r="2" />
  </>,
  banque: <path d="M3 9l9-6 9 6M5 9v9M10 9v9M14 9v9M19 9v9M3 21h18" />,
  labo: <>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M10 10h4v4h-4z" />
  </>,
  agence: <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </>,
  scaleup: <path d="M3 20h18M5 16l5-5 4 3 6-7M16 7h4v4" />,
  admin: <path d="M3 9l9-5 9 5H3zM5 9v9M9 9v9M15 9v9M19 9v9M3 18h18v3H3z" />,
  esn: <>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
  </>,
  cloud: <path d="M7 18a4 4 0 0 1-.5-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18z" />,
};

export function CompanyIcon({ id, size = 28 }) {
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
      {COMPANY_ICONS[id]}
    </svg>
  );
}

function StakeBadge({ won, size = 22 }) {
  return (
    <div
      className="stake-row"
      aria-label={`${won} difficulté${won > 1 ? "s" : ""} gagnée${won > 1 ? "s" : ""} sur ${MAX_DIFFICULTY}`}
    >
      {STAKE_COLORS.map((o, a) => (
        <span
          key={a}
          className={`stake num ${a < won ? "won" : ""} ${a === 3 ? "dark" : ""}`}
          style={{ width: size, height: size, "--stake": o }}
        >
          {a + 1}
        </span>
      ))}
    </div>
  );
}

const canAccessCompany = (e, t) => {
  if (e.dev) {
    return true;
  }
  let o = UNLOCK_CONDITIONS[t];
  if (!o) {
    return true;
  }
  let [a, r] = o.progress(e.profile);
  return a >= r;
};

function unlockProgressText(e, t) {
  let o = UNLOCK_CONDITIONS[t];
  if (!o) {
    return "";
  }
  let [a, r] = o.progress(e.profile);
  return `${o.text} (${Math.min(a, r)}/${r})`;
}

function CompanyBadge({ id, access }) {
  let o = COMPANIES[id];
  let a = canAccessCompany(access, id);
  return (
    <div className={`co-badge ${a ? "" : "locked"}`} style={{ "--co": o.color }}>
      <div className="co-body">
        <span className="co-clip" aria-hidden="true" />
        <div className="co-head"><b>{o.name}</b><span className="co-tag num">BADGE</span></div>
        <div className="co-intro">
          <span className="co-logo"><CompanyIcon id={id} size={36} /></span>
          <span className="co-tagline">{o.tagline}</span>
        </div>
        <div className="co-start">
          <span className="co-lbl">Plateau de départ</span>
          <div className="co-mods">
            {o.start.map((r, n) => (
              <span key={n} className={`co-mod accent-${MODULES[r].accent}`}>
                <i />
                <span>{MODULES[r].name}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="co-effects">
          <p><span className="co-sign plus">+</span>{o.plus}</p>
          <p><span className="co-sign minus">−</span>{o.minus}</p>
        </div>
        <div className="co-stakes">
          <div className="co-stakes-head">
            <span className="co-lbl">Difficultés gagnées</span>
            <span className="num">{access.profile.companies[id].won}/{MAX_DIFFICULTY}</span>
          </div>
          <StakeBadge won={access.profile.companies[id].won} />
        </div>
      </div>
      {!a
        && (
          <div className="co-lock">
            <b>🔒 Verrouillée</b>
            <span>{unlockProgressText(access, id)}</span>
          </div>
        )}
    </div>
  );
}

export function CompanyCarousel({ selected, access, onSelect }) {
  let a = COMPANY_IDS.indexOf(selected);
  let r = (d) => onSelect(COMPANY_IDS[(a + d + COMPANY_IDS.length) % COMPANY_IDS.length]);
  let n = useRef(null);
  let l = COMPANY_IDS.filter((d) => canAccessCompany(access, d)).length;
  return (
    <div className="co-carousel">
      <div
        className="co-stage"
        onTouchStart={(d) => n.current = d.touches[0].clientX}
        onTouchEnd={(d) => {
          if (n.current === null) {
            return;
          }
          let u = d.changedTouches[0].clientX - n.current;
          n.current = null;
          if (Math.abs(u) > 40) {
            r(u < 0 ? 1 : -1);
          }
        }}
      >
        <div className="co-side left" aria-hidden="true" onClick={() => r(-1)}>
          <CompanyBadge
            id={COMPANY_IDS[(a - 1 + COMPANY_IDS.length) % COMPANY_IDS.length]}
            access={access}
          />
        </div>
        <div key={selected} className="co-center">
          <CompanyBadge id={selected} access={access} />
        </div>
        <div className="co-side right" aria-hidden="true" onClick={() => r(1)}>
          <CompanyBadge id={COMPANY_IDS[(a + 1) % COMPANY_IDS.length]} access={access} />
        </div>
      </div>
      <div className="co-dots">
        <button className="co-arrow" onClick={() => r(-1)} aria-label="Entreprise précédente">
          ‹
        </button>
        {COMPANY_IDS.map((d) => (
          <button
            key={d}
            className={`co-dot ${d === selected ? "on" : ""} ${canAccessCompany(access, d) ? "" : "locked"}`}
            onClick={() => onSelect(d)}
            aria-label={COMPANIES[d].name}
          />
        ))}
        <button className="co-arrow" onClick={() => r(1)} aria-label="Entreprise suivante">
          ›
        </button>
      </div>
      <span className="co-count">
        {l}
        {" / "}
        {COMPANY_IDS.length}
        {" débloquées · glisse ou utilise les flèches"}
      </span>
    </div>
  );
}

export function CompanyGrid({ selected, access, onSelect }) {
  return (
    <div className="co-grid-wrap">
      <div className="co-grid-head">
        <span className="co-lbl">Ta collection</span>
        <span className="num gold">
          {totalWins(access.profile)}
          {" / "}
          {COMPANY_IDS.length * MAX_DIFFICULTY}
          {" difficultés gagnées"}
        </span>
      </div>
      <div className="co-grid">
        {COMPANY_IDS.map((a) => {
          let r = COMPANIES[a];
          let n = canAccessCompany(access, a);
          return (
            <button
              key={a}
              className={`co-cell ${n ? "" : "locked"} ${a === selected ? "on" : ""}`}
              style={{ "--co": r.color }}
              onClick={() => onSelect(a)}
            >
              <span className="co-cell-head">
                <span className="co-logo small"><CompanyIcon id={a} size={20} /></span>
                <b>{r.name}</b>
              </span>
              {n
                ? (
                  <>
                    <span className="co-cell-plus">{r.plus}</span>
                    <StakeBadge won={access.profile.companies[a].won} size={15} />
                  </>
                )
                : <span className="co-cell-lock">{"🔒 "}{unlockProgressText(access, a)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function isCompanyAvailable(e, t) {
  return canAccessCompany(e, t);
}
