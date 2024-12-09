import { Player } from './Player';

export interface Match {
    _id: string;
    players: Player[];
    gameId: string;
    accessCode: string;
    accessibility: boolean;
}
