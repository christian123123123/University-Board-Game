import { Character } from './Character';

export interface Player {
    username: string;
    character: Character;
    isAdmin: boolean;
    isVirtual?: boolean;
    inventory: [string | null, string | null];
    profile?: string;
}
