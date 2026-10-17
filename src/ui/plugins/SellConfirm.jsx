// Confirmation avant de vendre un Plugin.

import { PLUGINS, pluginSellPrice } from "../../engine/plugins.js";
import { Modal } from "../common/Modal.jsx";

export function SellConfirm({ defId, onYes, onNo }) {
  let p = PLUGINS[defId];
  let price = pluginSellPrice(defId);
  return (
    <Modal className="confirm-modal sell-modal" onClose={onNo}>
      <div className="sm-head">
        <span className="sm-emoji" aria-hidden="true">{p.emoji}</span>
        <div>
          <p className="sm-title">Vendre {p.name} ?</p>
          <p className="sm-gain">Tu récupères +{price} $.</p>
        </div>
      </div>
      <p className="sm-warn">Le Plugin quitte ta rangée.</p>
      <div className="sm-acts">
        <button className="sm-stay" onClick={onNo} autoFocus>Annuler</button>
        <button className="deploy danger sm-sell" onClick={onYes}>Vendre +{price} $</button>
      </div>
    </Modal>
  );
}
