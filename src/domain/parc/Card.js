// Une carte du parc : un exemplaire d'un module, avec son niveau.

export const createCard = (uid, moduleId, level = 1) => Object.freeze({ uid, moduleId, level });

export const withLevel = (card, level) => createCard(card.uid, card.moduleId, level);
