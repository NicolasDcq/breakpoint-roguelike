// Colonne latérale : fiche, boutique, journal.

import { Modal } from "./common/Modal.jsx";
import { Journal } from "./journal/Journal.jsx";
import { ModuleInspector } from "./module/ModuleInspector.jsx";
import { ModuleSheetMobile } from "./module/ModuleSheetMobile.jsx";
import { Shop, ShopModal } from "./shop/Shop.jsx";

export function SidePanel(e) {
  return (
    <>
      {e.shopPop && <ShopModal {...e} />}
      <aside className="side">
        {e.selected && e.mobile
          ? <ModuleSheetMobile {...e} selected={e.selected} key="mm" />
          : null}
        {e.selected && !e.mobile
          ? (
            <Modal className="module-modal" onClose={e.onDeselect}>
              <ModuleInspector {...e} selected={e.selected} />
            </Modal>
          )
          : e.hint && <div className="hint"><p>{e.hint}</p></div>}
        {!e.mobile
          && (
            <div className="panel">
              {e.mobile
                ? (
                  <div className="tabs" role="tablist">
                    <button
                      role="tab"
                      aria-selected={e.tab === "shop"}
                      className={e.tab === "shop" ? "on" : ""}
                      onClick={() => e.onTab("shop")}
                    >
                      Boutique
                    </button>
                    <button
                      role="tab"
                      aria-selected={e.tab === "log"}
                      className={e.tab === "log" ? "on" : ""}
                      onClick={() => e.onTab("log")}
                    >
                      Journal d’exécution
                    </button>
                  </div>
                )
                : (
                  <div className="tabs">
                    <button className="on" aria-selected>Journal d’exécution</button>
                  </div>
                )}
              {e.mobile && e.tab === "shop" ? <Shop {...e} /> : <Journal {...e} />}
            </div>
          )}
      </aside>
    </>
  );
}
