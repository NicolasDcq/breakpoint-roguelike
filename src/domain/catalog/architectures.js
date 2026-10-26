// Les architectures : l'équivalent des mains de poker.
// Elles dépendent des modules posés, pas de leur place. La plus forte donne la base
// du déploiement (Compute et Scale de départ) ; chaque niveau gagné monte cette base.
// L'ordre de la liste est l'ordre de force : la première qui correspond gagne.

/**
 * Profil d'un ensemble de modules posés : groupes de modules identiques et de familles,
 * triés du plus grand au plus petit.
 */
export function profileOf(cards, familyOf) {
  const byModule = new Map();
  const byFamily = new Map();
  for (const card of cards) {
    byModule.set(card.moduleId, [...(byModule.get(card.moduleId) ?? []), card.uid]);
    const family = familyOf(card.moduleId);
    byFamily.set(family, [...(byFamily.get(family) ?? []), card.uid]);
  }
  const bySize = (a, b) => b.length - a.length;
  return {
    all: cards.map((card) => card.uid),
    modules: [...byModule.values()].sort(bySize),
    families: [...byFamily.values()].sort(bySize),
  };
}

const groupSize = (groups, rank) => groups[rank]?.length ?? 0;
const firstGroup = (key) => (profile) => profile[key][0];
const firstTwoGroups = (profile) => [...profile.modules[0], ...profile.modules[1]];
const everything = (profile) => profile.all;

const DEFINITIONS = [
  { id: "datacenter", name: "Datacenter", rule: "5 modules identiques", base: [120, 12], perLevel: [35, 3],
    matches: (p) => groupSize(p.modules, 0) >= 5, members: firstGroup("modules") },
  { id: "ferme", name: "Ferme de serveurs", rule: "4 modules identiques", base: [60, 7], perLevel: [30, 3],
    matches: (p) => groupSize(p.modules, 0) >= 4, members: firstGroup("modules") },
  { id: "hautedispo", name: "Haute dispo", rule: "3 identiques + 2 identiques", base: [40, 4], perLevel: [25, 2],
    matches: (p) => groupSize(p.modules, 0) >= 3 && groupSize(p.modules, 1) >= 2, members: firstTwoGroups },
  { id: "stack", name: "Stack", rule: "5 modules de la même famille", base: [35, 4], perLevel: [15, 2],
    matches: (p) => groupSize(p.families, 0) >= 5, members: firstGroup("families") },
  { id: "fullstack", name: "Full-stack", rule: "5 modules des 5 familles", base: [30, 4], perLevel: [30, 3],
    matches: (p) => p.families.length >= 5, members: everything },
  { id: "cluster", name: "Cluster", rule: "3 modules identiques", base: [30, 3], perLevel: [20, 2],
    matches: (p) => groupSize(p.modules, 0) >= 3, members: firstGroup("modules") },
  { id: "double", name: "Double redondance", rule: "2 identiques + 2 identiques", base: [20, 2], perLevel: [20, 1],
    matches: (p) => groupSize(p.modules, 0) >= 2 && groupSize(p.modules, 1) >= 2, members: firstTwoGroups },
  { id: "redondance", name: "Redondance", rule: "2 modules identiques", base: [10, 2], perLevel: [15, 1],
    matches: (p) => groupSize(p.modules, 0) >= 2, members: firstGroup("modules") },
  { id: "monolithe", name: "Monolithe", rule: "Rien de spécial", base: [5, 1], perLevel: [10, 1],
    matches: () => true, members: everything },
];

export const ARCHITECTURES = Object.freeze(DEFINITIONS.map(Object.freeze));
export const ARCHITECTURE_BY_ID = Object.freeze(Object.fromEntries(ARCHITECTURES.map((a) => [a.id, a])));
export const ARCHITECTURE_IDS = ARCHITECTURES.map((a) => a.id);

/** Base (Compute, Scale) d'une architecture à un niveau donné. */
export function architectureBase(id, level) {
  const { base, perLevel } = ARCHITECTURE_BY_ID[id];
  return { compute: base[0] + perLevel[0] * (level - 1), scale: base[1] + perLevel[1] * (level - 1) };
}

/** L'architecture la plus forte formée par ces modules, et les modules qui la forment. */
export function detectArchitecture(cards, familyOf) {
  const profile = profileOf(cards, familyOf);
  const found = ARCHITECTURES.find((architecture) => architecture.matches(profile));
  return { id: found.id, members: found.members(profile) };
}
