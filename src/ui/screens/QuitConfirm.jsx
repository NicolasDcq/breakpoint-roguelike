// Confirmation de nouvelle run avec Loup Niel.

import * as React from "react";
import { LOUP_SVG } from "../../tutorial/loupNielSprites.js";
import { Modal } from "../common/Modal.jsx";

export function QuitConfirm({ onYes, onNo }) {
  let RR = React;
  let [q] = RR.useState(() => QUIT_LINES[Math.floor(Math.random() * QUIT_LINES.length)]);
  return (
    <Modal className="confirm-modal quit-modal" onClose={onNo}>
      <div className="qm-scene">
        <span className="qm-wolf" dangerouslySetInnerHTML={{ __html: LOUP_SVG.inquiet }} />
        <div className="qm-bubble">
          <span className="qm-tag">LOUP NIEL · CTO</span>
          <p className="qm-say">{q}</p>
        </div>
      </div>
      <p className="qm-warn">
        Si tu lances une nouvelle run, la progression de celle-ci sera perdue.
      </p>
      <div className="qm-acts">
        <button className="qm-stay" onClick={onNo} autoFocus>Je reste</button>
        <button className="deploy danger qm-quit" onClick={onYes}>Nouvelle run</button>
      </div>
    </Modal>
  );
}

const QUIT_LINES = [
  "Tu pars déjà ? On venait à peine de passer en prod…",
  "Attends, tu démissionnes ? C’est moi qui vais devoir expliquer ça au client.",
  "Un rollback complet ? Toute cette run part dans /dev/null, hein.",
  "Sérieux ? J’avais commandé des croissants pour fêter le prochain contrat.",
  "Tu veux tout reformater ? Ton plateau commençait à avoir de la gueule.",
  "Partir maintenant ? Même le Stagiaire n’a pas osé.",
  "On ferme le ticket sans le résoudre ? Bon… c’est toi qui vois.",
];
