import { Character } from '@app/interfaces/Character';

export class Board {
    private grid: (null | Character)[][];

    constructor(
        public rows: number,
        public cols: number,
    ) {
        this.grid = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => null));
    }
    getGrid(): (null | Character)[][] {
        return this.grid;
    }

    placeCharacters(characters: Character[]) {
        const totalCharacters = characters.length;
        let characterIndex = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (characterIndex < totalCharacters) {
                    this.placeCharacter(row, col, characters[characterIndex]);
                    characterIndex++;
                }
            }
        }
    }
    protected isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    private placeCharacter(row: number, col: number, character: Character) {
        if (this.isValidPosition(row, col)) {
            this.grid[row][col] = character;
        }
    }
}
