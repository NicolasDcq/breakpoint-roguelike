// La vitesse du jeu (animation des déploiements) : ×1, ×2 ou ×3, gardée dans les préférences du joueur.

export const SPEEDS = [1, 2, 3];
const KEY = "speed";

/** La vitesse enregistrée (×1 si rien n'est enregistré ou si la valeur est inconnue). */
export function loadSpeed(preferences) {
  const value = Number(preferences?.get(KEY));
  return SPEEDS.includes(value) ? value : 1;
}

export function saveSpeed(preferences, speed) {
  if (SPEEDS.includes(speed)) preferences.set(KEY, String(speed));
}
