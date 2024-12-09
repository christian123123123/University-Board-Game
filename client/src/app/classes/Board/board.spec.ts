import { Character } from '@app/interfaces/Character';
import { Board } from './board';

class TestBoard extends Board {
    testIsValidPosition(row: number, col: number): boolean {
        return this.isValidPosition(row, col);
    }
}

describe('Board', () => {
    const NUM_COLS = 3;
    const NUM_ROWS = 2;
    let board: TestBoard;

    beforeEach(() => {
        board = new TestBoard(NUM_ROWS, NUM_COLS);
    });

    it('should initialize with correct number of rows and columns', () => {
        expect(board.rows).toBe(NUM_ROWS);
        expect(board.cols).toBe(NUM_COLS);
    });

    it('should return true for valid positions', () => {
        expect(board.testIsValidPosition(0, 0)).toBeTrue();
        expect(board.testIsValidPosition(1, 2)).toBeTrue();
    });

    it('should return false for invalid positions', () => {
        expect(board.testIsValidPosition(-1, 0)).toBeFalse();
        expect(board.testIsValidPosition(NUM_COLS, NUM_COLS)).toBeFalse();
    });

    it('should create a grid with null values', () => {
        const grid = board.getGrid();
        expect(grid.length).toBe(NUM_ROWS);
        expect(grid[0].length).toBe(NUM_COLS);
        grid.forEach((row) => {
            row.forEach((cell) => {
                expect(cell).toBeNull();
            });
        });
    });

    it('should return the grid via getGrid method', () => {
        const grid = board.getGrid();
        expect(grid).toBeInstanceOf(Array);
    });

    it('should place characters correctly if number of characters is less than or equal to board slots', () => {
        const characters: Character[] = [
            {
                name: 'Character1',
                image: 'img1',
                face: 'face1',
                stats: { health: 100, speed: 10, attack: 50, defense: 20 },
                body: '',
                victories: 0,
                position: { row: 0, col: 0 },
                dice: 'attack',
                initialPosition: { row: 0, col: 0 },
            },
            {
                name: 'Character2',
                image: 'img2',
                face: 'face2',
                stats: { health: 100, speed: 10, attack: 50, defense: 20 },
                body: '',
                victories: 0,
                position: { row: 0, col: 0 },
                dice: 'attack',
                initialPosition: { row: 0, col: 0 },
            },
            {
                name: 'Character3',
                image: 'img3',
                face: 'face3',
                stats: { health: 100, speed: 10, attack: 50, defense: 20 },
                body: '',
                victories: 0,
                position: { row: 0, col: 0 },
                dice: 'attack',
                initialPosition: { row: 0, col: 0 },
            },
            {
                name: 'Character4',
                image: 'img4',
                face: 'face4',
                stats: { health: 100, speed: 10, attack: 50, defense: 20 },
                body: '',
                victories: 0,
                position: { row: 0, col: 0 },
                dice: 'attack',
                initialPosition: { row: 0, col: 0 },
            },
        ];

        board.placeCharacters(characters);
        const grid = board.getGrid();

        expect(grid[0][0]).toEqual(characters[0]);
        expect(grid[0][1]).toEqual(characters[1]);
        expect(grid[0][2]).toEqual(characters[2]);
        expect(grid[1][0]).toEqual(characters[3]);
        expect(grid[1][1]).toBeNull();
        expect(grid[1][2]).toBeNull();
    });
});
