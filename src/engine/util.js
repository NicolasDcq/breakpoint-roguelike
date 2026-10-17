// Petits utilitaires numériques du moteur.

export const byLevel = (e, t) => e[t - 1];

export const fmtNum = (e) => Number.isInteger(e) ? String(e) : e.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");

export const round2 = (e) => Math.round(e * 100) / 100;

export const frDecimal = (e) => String(e).replace(".", ",");
