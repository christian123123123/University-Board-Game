import { Stats } from './Stats';
export interface Character {
    name: string;
    image: string;
    face: string;
    body: string;
    stats: Stats;
    dice: string;
    victories: number;
    disabled?: boolean;
    position: { row: number; col: number } | null;
    initialPosition: { row: number; col: number } | null;
    effects?: string[];
    hasFlag?: boolean;
}
