// Adaptateur : graines tirées au hasard pour les nouvelles parties.
export const randomSeedSource = { next: () => Math.floor(Math.random() * 1e9) };

/** Graines fixes, pour les tests et le bot. */
export const fixedSeedSource = (...seeds) => {
  let index = 0;
  return { next: () => seeds[index++ % seeds.length] };
};
