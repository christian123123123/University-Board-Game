import { Tiles } from './Tiles';

export interface Game {
    _id: string;
    title: string;
    mapSize: string;
    mode: string;
    visibility: boolean;
    description: string;
    board: Tiles[][];
    updatedAt: Date;
}
