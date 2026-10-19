// Les cinq familles de modules. Seule la famille Calcul produit du Compute.

export const FAMILIES = Object.freeze({
  calcul: { id: "calcul", name: "Calcul", role: "Produit du Compute ⚡." },
  stockage: { id: "stockage", name: "Stockage", role: "Produit de la Data ◆." },
  reseau: { id: "reseau", name: "Réseau", role: "Produit du Scale ×." },
  business: { id: "business", name: "Business", role: "Rapporte des $." },
  ops: { id: "ops", name: "Ops", role: "Réactive et booste les autres." },
});

export const FAMILY_IDS = Object.keys(FAMILIES);
