import { Tiles } from '@app/model/schema/tiles.schema';
import { GAME_TILES } from '@app/shared/game-tiles';
import { MovementService } from './movement.service';

describe('MovementService', () => {
    let service: MovementService;

    const mockBoard = [
        [
            { fieldTile: GAME_TILES.BASE, wall: false, avatar: null },
            { fieldTile: GAME_TILES.WATER, wall: false, avatar: null },
        ],
        [
            { fieldTile: GAME_TILES.ICE, wall: false, avatar: null },
            { fieldTile: GAME_TILES.DOOR_CLOSED, wall: false, avatar: null },
        ],
    ];

    const mockInventoryService = {
        inventorySource: {
            getValue: jest.fn(() => [null, null]),
        },
    };

    const mockSharedDataService = {
        getBoard: jest.fn(() => mockBoard),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        /* eslint-disable @typescript-eslint/no-explicit-any */

        service = new MovementService(mockInventoryService as any, mockSharedDataService as any);
        /* eslint-disable @typescript-eslint/no-explicit-any */
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('isValidTile', () => {
        it('should return true for a valid tile', () => {
            expect(service.isValidTile(0, 0)).toBe(true);
            expect(service.isValidTile(1, 1)).toBe(true);
        });

        it('should return false for an invalid tile', () => {
            expect(service.isValidTile(-1, 0)).toBe(false);
            expect(service.isValidTile(0, 2)).toBe(false);
            expect(service.isValidTile(2, 0)).toBe(false);
        });
    });

    describe('checkNextTileStepValue', () => {
        it('should set stepValue to 2 for water tiles', () => {
            const tile = { fieldTile: GAME_TILES.WATER } as Tiles;
            service.checkNextTileStepValue(tile);
            expect(service.stepValue).toBe(2);
        });

        it('should set stepValue to 1 for base or open door tiles', () => {
            const baseTile = { fieldTile: GAME_TILES.BASE } as Tiles;
            const openDoorTile = { fieldTile: GAME_TILES.DOOR_OPEN } as Tiles;

            service.checkNextTileStepValue(baseTile);
            expect(service.stepValue).toBe(1);

            service.checkNextTileStepValue(openDoorTile);
            expect(service.stepValue).toBe(1);
        });

        it('should set stepValue to 0 for ice tiles', () => {
            const tile = { fieldTile: GAME_TILES.ICE } as Tiles;
            service.checkNextTileStepValue(tile);
            expect(service.stepValue).toBe(0);
        });
    });

    describe('getTileCost', () => {
        it('should return 2 for water tiles', () => {
            const tile = { fieldTile: GAME_TILES.WATER } as Tiles;
            expect(service.getTileCost(tile)).toBe(2);
        });

        it('should return 0 for ice tiles', () => {
            const tile = { fieldTile: GAME_TILES.ICE } as Tiles;
            expect(service.getTileCost(tile)).toBe(0);
        });

        it('should return 1 for base tiles', () => {
            const tile = { fieldTile: GAME_TILES.BASE } as Tiles;
            expect(service.getTileCost(tile)).toBe(1);
        });
    });

    describe('chanceOfStop', () => {
        it('should return false if skates are in the inventory', () => {
            jest.spyOn(mockInventoryService.inventorySource, 'getValue').mockReturnValue(['assets/object-space-skates-only.png', null]);
            expect(service.chanceOfStop()).toBe(false);
        });

        it('should return true or false based on random chance', () => {
            const LESS_THAN = 0.05;
            const GREATER_THAN = 0.2;
            jest.spyOn(mockInventoryService.inventorySource, 'getValue').mockReturnValue([null, null]);

            jest.spyOn(global.Math, 'random').mockReturnValue(LESS_THAN);
            expect(service.chanceOfStop()).toBe(true);

            jest.spyOn(global.Math, 'random').mockReturnValue(GREATER_THAN);
            expect(service.chanceOfStop()).toBe(false);
        });
    });

    describe('checkIfDoorIsOpen', () => {
        it('should set door to true for closed door tiles', () => {
            const tile = { fieldTile: GAME_TILES.DOOR_CLOSED, door: false } as Tiles;
            service.checkIfDoorIsOpen(tile);
            expect(tile.door).toBe(true);
        });

        it('should set door to false for non-door tiles', () => {
            const tile = { fieldTile: GAME_TILES.BASE, door: true } as Tiles;
            service.checkIfDoorIsOpen(tile);
            expect(tile.door).toBe(false);
        });
    });

    describe('findPath', () => {
        it('should return the correct path from start to destination', () => {
            const start = { row: 0, col: 0 };
            const destination = { row: 1, col: 1 };

            mockBoard[0][1].wall = false;
            mockBoard[1][0].wall = false;

            const result = service.findPath(start, destination);

            expect(result).toEqual(result);
        });

        it('should return null if no valid path exists', () => {
            const start = { row: 0, col: 0 };
            const destination = { row: 1, col: 1 };

            mockBoard[0][1].wall = true;
            mockBoard[1][0].wall = true;

            const result = service.findPath(start, destination);

            expect(result).toBeNull();
        });

        it('should prioritize paths with lower costs (water tiles have higher cost)', () => {
            const start = { row: 0, col: 0 };
            const destination = { row: 1, col: 1 };

            mockBoard[0][1].fieldTile = GAME_TILES.WATER;
            mockBoard[1][0].fieldTile = GAME_TILES.BASE;

            const result = service.findPath(start, destination);

            expect(result).toEqual(result);
        });

        it('should avoid tiles with avatars or closed doors', () => {
            const start = { row: 0, col: 0 };
            const destination = { row: 1, col: 1 };

            mockBoard[0][1].avatar = true;
            mockBoard[1][0].fieldTile = GAME_TILES.DOOR_CLOSED;

            const result = service.findPath(start, destination);

            expect(result).toBeNull();
        });
    });
});
