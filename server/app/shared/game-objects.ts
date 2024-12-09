export const GAME_OBJECTS: { [key: string]: { object: string; count: number; description: string } } = {
    universalCube: {
        object: 'assets/object-universal-cube-only.png',
        count: 0,
        description: 'Cube universel : Point de départ.',
    },
    randomItem: {
        object: 'assets/object-random-item-only.png',
        count: 0,
        description: 'Item aléatoire : ???.',
    },
    powerFruit: {
        object: 'assets/object-Power-fruit-only.png',
        count: 1,
        description: "Fruit de pouvoir : Augmente l'attacque si joueur a aucune victoire.",
    },
    shield: {
        object: 'assets/object-shield-only.png',
        count: 1,
        description: 'Bouclier : Protection contre les attaques si le joueur a déjà une victoire.',
    },
    masterKey: {
        object: 'assets/object-master-key-only.png',
        count: 1,
        description: 'Clé : Permet de traverser toutes les portes.',
    },
    spaceSword: {
        object: 'assets/object-space-sword-only.png',
        count: 1,
        description: 'Sabre laser : Aide avec attaque mais rend plus lourd.',
    },
    spaceSkates: {
        object: 'assets/object-space-skates-only.png',
        count: 1,
        description: 'Patins lunaires : Permettent de traverser la glace sans problème.',
    },
    boots: {
        object: 'assets/object-boots-only.png',
        count: 1,
        description: 'Bottes : Accélèrent la vitesse de déplacement, mais diminuent la vie.',
    },
    flag: { object: 'assets/object-flag-only.png', count: 1, description: 'Drapeau : Objectif.' },
};
