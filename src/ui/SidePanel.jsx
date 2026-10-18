// Colonne latérale : fiche, boutique, journal.

import { Journal } from "./journal/Journal.jsx";
import { ModuleSheetMobile } from "./module/ModuleSheetMobile.jsx";
import { Shop, ShopModal } from "./shop/Shop.jsx";

export function SidePanel(e) {
  return (
    <>
      {e.shopPop && <ShopModal {...e} />}
      <aside className="side">
        {/* Même fiche sur téléphone et ordinateur (panneau qui monte / fenêtre au centre). */}
        {e.selected
          ? <ModuleSheetMobile {...e} selected={e.selected} desktop={!e.mobile} key="mm" />
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
