// Fenêtre de validation avant d'ouvrir un emplacement.

import { sfx } from "../../audio/sfx.js";
import { Modal } from "../common/Modal.jsx";

export function UnlockAsk({ slot, cost, budget, onNo, onYes }) {
  let left = (budget ?? 0) - cost;
  return (
    <Modal className="unlock-ask" onClose={onNo}>
      <div className="ua-icon" aria-hidden="true">
        <svg
          width={30}
          height={30}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x={5} y={11} width={14} height={9} rx={2} />
          <path d="M8 11V7a4 4 0 0 1 7.5-2" />
        </svg>
      </div>
      <h2 className="ua-title">{"Ouvrir l’emplacement "}{slot + 1}{" ?"}</h2>
      <p className="ua-text">
        Ton plateau gagne une case pour toute la partie. Tu pourras y poser un module.
      </p>
      <div className="ua-sum">
        <span>Coût</span>
        <b className="num ua-cost">{cost}{" $"}</b>
        <span>Il te restera</span>
        <b className="num">{left}{" $"}</b>
      </div>
      <div className="ua-acts">
        <button className="ghost ua-no" onClick={onNo}>Annuler</button>
        <button
          className="primary ua-yes"
          onClick={() => {
            if (sfx.upgrade) {
              sfx.upgrade();
            }
            onYes();
          }}
        >
          {"Ouvrir · "}
          {cost}
          {" $"}
        </button>
      </div>
    </Modal>
  );
}
