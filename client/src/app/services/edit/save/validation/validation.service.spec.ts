import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { GAME_TILES } from '@app/shared/game-tiles';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
    let service: ValidationService;

    const mockGames: Omit<Game, '_id' | 'updatedAt'>[] = [
        { title: 'Game A', description: 'allo', mapSize: '', mode: '', visibility: true, board: [] },
        { title: 'Game B', description: '', mapSize: '', mode: '', visibility: true, board: [] },
        { title: '', description: 'description valide', mapSize: '', mode: '', visibility: true, board: [] },
    ];

    const mockBoard: Tiles[][] = [
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: true, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 1 } },
        ],
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 1, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 1, col: 1 } },
        ],
    ];

    const mockBoard2: Tiles[][] = [
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 1 } },
        ],
        [
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: null, isTileSelected: false, position: { row: 1, col: 0 } },
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: null, isTileSelected: false, position: { row: 1, col: 1 } },
        ],
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 1 } },
        ],
    ];

    const mockBoard3: Tiles[][] = [
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 1 } },
        ],
        [
            {
                fieldTile: GAME_TILES.DOOR_CLOSED,
                avatar: '',
                door: true,
                wall: false,
                object: null,
                isTileSelected: false,
                position: { row: 1, col: 0 },
            },
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: null, isTileSelected: false, position: { row: 1, col: 1 } },
        ],
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 1 } },
        ],
    ];

    const mockBoard4: Tiles[][] = [
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 0 } },
            {
                fieldTile: GAME_TILES.DOOR_CLOSED,
                avatar: '',
                door: true,
                wall: false,
                object: null,
                isTileSelected: false,
                position: { row: 0, col: 1 },
            },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 2 } },
        ],
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: true, wall: false, object: null, isTileSelected: false, position: { row: 1, col: 0 } },
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: null, isTileSelected: false, position: { row: 1, col: 1 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 1, col: 2 } },
        ],
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 1 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 2 } },
        ],
    ];

    const mockBoard5: Tiles[][] = [
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 0 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 1 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 2 } },
        ],
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: true, wall: false, object: null, isTileSelected: false, position: { row: 1, col: 0 } },
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: null, isTileSelected: false, position: { row: 1, col: 1 } },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 1, col: 2 } },
        ],
        [
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 0 } },
            {
                fieldTile: GAME_TILES.DOOR_CLOSED,
                avatar: '',
                door: true,
                wall: false,
                object: null,
                isTileSelected: false,
                position: { row: 2, col: 1 },
            },
            { fieldTile: GAME_TILES.BASE, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 2, col: 2 } },
        ],
    ];
    const mockBoard6: Tiles[][] = [
        [
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: '', isTileSelected: false, position: { row: 0, col: 0 } },
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: '', isTileSelected: false, position: { row: 0, col: 1 } },
        ],
        [
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: '', isTileSelected: false, position: { row: 1, col: 0 } },
            { fieldTile: GAME_TILES.WALL, avatar: '', door: false, wall: true, object: '', isTileSelected: false, position: { row: 1, col: 1 } },
        ],
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ValidationService],
        });
        service = TestBed.inject(ValidationService);
    });

    describe('isTitleOrDescriptionMissing', () => {
        it('should return true if title is missing', () => {
            expect(service.isTitleOrDescriptionMissing(mockGames[2])).toBeTrue();
        });

        it('should return true if description is missing', () => {
            expect(service.isTitleOrDescriptionMissing(mockGames[1])).toBeTrue();
        });

        it('should return false if both title and description are present', () => {
            expect(service.isTitleOrDescriptionMissing(mockGames[0])).toBeFalse();
        });
    });

    describe('isValidBoardPercentage', () => {
        it('should return true if more than 50% of the board is terrain tiles', () => {
            expect(service.isValidBoardPercentage(mockBoard)).toBeTrue();
        });

        it('should return false if less than 50% of the board is terrain tiles', () => {
            expect(service.isValidBoardPercentage(mockBoard2)).toBeFalse();
        });
    });

    describe('areAllTerrainTilesAccessible', () => {
        it('should return true if all terrain tiles are accessible', () => {
            expect(service.areAllTerrainTilesAccessible(mockBoard)).toBeTrue();
        });

        it('should return false if some terrain tiles are not accessible', () => {
            expect(service.areAllTerrainTilesAccessible(mockBoard2)).toBeFalse();
        });

        it('should return false when no terrain tiles are found', () => {
            expect(service.areAllTerrainTilesAccessible(mockBoard6)).toBeFalse();
        });
    });

    describe('areStartingPointsSet', () => {
        it('should return true if the count of universalCube matches the required starting points for the map size', () => {
            const mockBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                ],
            ];

            const mapSize = 'petite'; // Expect 2 universalCube objects for this size
            expect(service.areStartingPointsSet(mockBoard, mapSize)).toBeTrue();
        });

        it('should return false if the count of universalCube does not match the required starting points for the map size', () => {
            const mockBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];

            const mapSize = 'petite'; // Expect 2 universalCube objects for this size
            expect(service.areStartingPointsSet(mockBoard, mapSize)).toBeFalse();
        });
    });

    describe('isDoorNotSurrounded', () => {
        it('should return true if there is a door not surrounded by walls', () => {
            expect(service.isDoorNotSurrounded(mockBoard)).toBeTrue();
        });

        it('should return false if all doors are surrounded by walls properly', () => {
            expect(service.isDoorNotSurrounded(mockBoard3)).toBeFalse();
        });
        it('should handle a door on the top row where upper tile is null', () => {
            expect(service.isDoorNotSurrounded(mockBoard4)).toBeFalse();
        });
        it('should handle a door on the bottom row where down tile is null ', () => {
            expect(service.isDoorNotSurrounded(mockBoard5)).toBeFalse();
        });
    });

    describe('isFlagHere', () => {
        it('should return true if a flag is present on the board', () => {
            const service = new ValidationService();
            const mockBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.flag.object, // Simulate a flag object
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];

            const result = service.isFlagHere(mockBoard);

            expect(result).toBeTrue(); // Expect true because a flag is present
        });

        it('should return false if no flag is present on the board', () => {
            const service = new ValidationService();
            const mockBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: null, // No flag
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];

            const result = service.isFlagHere(mockBoard);

            expect(result).toBeFalse(); // Expect false because no flag is present
        });

        it('should return false for an empty board', () => {
            const service = new ValidationService();
            const mockBoard: Tiles[][] = [];

            const result = service.isFlagHere(mockBoard);

            expect(result).toBeFalse(); // Expect false because the board is empty
        });

        it('should return true if a flag is present in any tile on the board', () => {
            const service = new ValidationService();
            const mockBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: null, // No flag here
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS['flag'].object, // Flag is here
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                ],
            ];

            const result = service.isFlagHere(mockBoard);

            expect(result).toBeTrue(); // Expect true because a flag is present
        });
    });
});
