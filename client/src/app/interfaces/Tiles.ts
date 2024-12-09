export interface Tiles {
    fieldTile: string;
    door: boolean;
    wall: boolean;
    object: string | null;
    avatar: string | null;
    isTileSelected: boolean;
    position: { row: number; col: number } | null;
}
