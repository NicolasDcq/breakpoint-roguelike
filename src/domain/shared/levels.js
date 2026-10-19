// Valeur d'un effet selon le niveau (1, 2 ou 3) d'un module.
export const atLevel = (values, level) => values[level - 1];

// Nombre affiché à la française : 1.5 → « 1,5 ».
export const frNumber = (value) => String(Math.round(value * 100) / 100).replace(".", ",");
