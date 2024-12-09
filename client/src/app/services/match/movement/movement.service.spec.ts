import { TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_TILES } from '@app/shared/game-tiles';
import { MovementService } from './movement.service';

/* eslint-disable @typescript-eslint/no-magic-numbers */ // using magic number to help us out during testing.
describe('MovementService', () => {
    let service: MovementService;
    let mockBoard: Tiles[][];
    let mockSharedDataService: jasmine.SpyObj<SharedDataService>;
    let mockSocketService: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        mockSharedDataService = jasmine.createSpyObj('SharedDataService', ['getDebugModeStatus', 'getPlayer', 'getAccessCode']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['emit']);

        TestBed.configureTestingModule({
            providers: [
                MovementService,
                { provide: SharedDataService, useValue: mockSharedDataService },
                { provide: SocketService, useValue: mockSocketService },
            ],
        });

        service = TestBed.inject(MovementService);

        mockBoard = [
            [{ fieldTile: GAME_TILES.BASE, wall: false, door: false, avatar: '', isTileSelected: false, position: { row: 0, col: 0 }, object: '' }],
            [{ fieldTile: GAME_TILES.WATER, wall: false, door: false, avatar: '', isTileSelected: false, position: { row: 0, col: 0 }, object: '' }],
            [{ fieldTile: GAME_TILES.ICE, wall: false, door: false, avatar: '', isTileSelected: false, position: { row: 0, col: 0 }, object: '' }],
        ];

        service.board = mockBoard;
    });

    describe('#findPath', () => {
        it('should return the path from start to destination on a simple board', () => {
            const start = { row: 0, col: 0 };
            const destination = { row: 1, col: 0 };
            const path = service.findPath(start, destination);
            expect(path).toEqual([start, destination]);
        });

        it('should return null if destination is unreachable due to walls', () => {
            service.board[1][0].wall = true;
            const start = { row: 0, col: 0 };
            const destination = { row: 1, col: 0 };
            const path = service.findPath(start, destination);
            expect(path).toBeNull();
        });
    });

    describe('#highlightPossiblePaths', () => {
        it('should mark attainable tiles up to max steps', () => {
            const start = { row: 0, col: 0 };
            const maxSteps = 2;
            service.highlightPossiblePaths(start, maxSteps);
            expect(service.attainableTiles.has('1-0')).toBeTrue();
        });

        it('should not mark tiles beyond max steps', () => {
            const start = { row: 0, col: 0 };
            const maxSteps = 1;
            service.highlightPossiblePaths(start, maxSteps);
            expect(service.attainableTiles.has('2-0')).toBeFalse();
        });
    });

    describe('#isValidTile', () => {
        it('should return true for valid tile within board boundaries', () => {
            expect(service.isValidTile(0, 0)).toBeTrue();
            expect(service.isValidTile(1, 0)).toBeTrue();
        });

        it('should return false for invalid tile outside board boundaries', () => {
            expect(service.isValidTile(-1, 0)).toBeFalse();
            expect(service.isValidTile(3, 0)).toBeFalse();
        });
    });

    describe('#checkNextTileStepValue', () => {
        it('should set stepValue to 2 for WATER tile', () => {
            service.checkNextTileStepValue({ fieldTile: GAME_TILES.WATER } as Tiles);
            expect(service.stepValue).toBe(2);
        });

        it('should set stepValue to 1 for BASE or DOOR_OPEN tile', () => {
            service.checkNextTileStepValue({ fieldTile: GAME_TILES.BASE } as Tiles);
            expect(service.stepValue).toBe(1);
            service.checkNextTileStepValue({ fieldTile: GAME_TILES.DOOR_OPEN } as Tiles);
            expect(service.stepValue).toBe(1);
        });

        it('should set stepValue to 0 for ICE tile', () => {
            service.checkNextTileStepValue({ fieldTile: GAME_TILES.ICE } as Tiles);
            expect(service.stepValue).toBe(0);
        });
    });

    describe('#getTileCost', () => {
        it('should return 2 for WATER tile', () => {
            const cost = service.getTileCost({ fieldTile: GAME_TILES.WATER } as Tiles);
            expect(cost).toBe(2);
        });

        it('should return 0 for ICE tile', () => {
            const cost = service.getTileCost({ fieldTile: GAME_TILES.ICE } as Tiles);
            expect(cost).toBe(0);
        });

        it('should return 1 for any other tile', () => {
            const cost = service.getTileCost({ fieldTile: GAME_TILES.BASE } as Tiles);
            expect(cost).toBe(1);
        });
    });

    describe('#chanceOfStop', () => {
        it('should return a boolean result', () => {
            // Create a mock Player object
            const mockPlayer: Player = {
                username: 'testPlayer',
                inventory: [null, null],
                isAdmin: false,
                character: {
                    name: 'Test Character',
                    body: 'avatar',
                    image: 'image.png',
                    face: 'face.png',
                    dice: '1d6',
                    victories: 0,
                    position: { row: 0, col: 0 },
                    initialPosition: { row: 0, col: 0 },
                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                },
            };

            const result = service.chanceOfStop(mockPlayer);
            expect(typeof result).toBe('boolean');
        });
    });

    describe('#checkIfDoorIsOpen', () => {
        it('should set door to true for DOOR_CLOSED tile', () => {
            const tile: Tiles = { fieldTile: GAME_TILES.DOOR_CLOSED, door: false } as Tiles;
            service.checkIfDoorIsOpen(tile);
            expect(tile.door).toBeTrue();
        });

        it('should set door to false for any tile other than DOOR_CLOSED', () => {
            const tile: Tiles = { fieldTile: GAME_TILES.BASE, door: true } as Tiles;
            service.checkIfDoorIsOpen(tile);
            expect(tile.door).toBeFalse();
        });
    });

    describe('#clearPathHighlights', () => {
        it('should reset showPreviewPath to false and clear tile highlights', () => {
            service.showPreviewPath = true;
            mockBoard[0][0].isTileSelected = true;

            service.clearPathHighlights();

            expect(service.showPreviewPath).toBeFalse();
            expect(mockBoard[0][0].isTileSelected).toBeFalse();
        });
    });

    describe('#isInExactPreviewPath', () => {
        it('should return true if tile is in preview path with matching direction', () => {
            service.previewPathTiles = [{ row: 1, col: 0, direction: 'horizontal' }];
            expect(service.isInExactPreviewPath(1, 0, 'horizontal')).toBeTrue();
        });

        it('should return false if tile is not in preview path', () => {
            service.previewPathTiles = [{ row: 1, col: 0, direction: 'horizontal' }];
            expect(service.isInExactPreviewPath(2, 0)).toBeFalse();
        });
    });

    describe('#clearPreviewPath', () => {
        it('should clear previewPathTiles array', () => {
            service.previewPathTiles = [{ row: 1, col: 0, direction: 'horizontal' }];
            service.clearPreviewPath();
            expect(service.previewPathTiles.length).toBe(0);
        });
    });

    describe('#updatePlayerSpeed', () => {
        it('should set remainingSpeed to new value', () => {
            service.updatePlayerSpeed(5);
            expect(service.remainingSpeed).toBe(5);
        });
    });

    describe('#getAllAccessibleTilesRangeOne', () => {
        it('should return tiles within range 1 that are accessible', () => {
            const mockPlayerPosition = { row: 1, col: 1 };

            // Mock the tiles returned by getAllTilesInRange
            spyOn(service, 'getAllTilesInRange').and.returnValue([
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 1, col: 1 } } as Tiles,
                { fieldTile: GAME_TILES.WALL, avatar: null, position: { row: 1, col: 2 } } as Tiles,
                { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null, position: { row: 2, col: 1 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: 'playerAvatar', position: { row: 0, col: 1 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 1, col: 0 } } as Tiles,
            ]);

            const result = service.getAllAccessibleTilesRangeOne(mockPlayerPosition);

            expect(service.getAllTilesInRange).toHaveBeenCalledWith(mockPlayerPosition, 1);
            expect(result).toEqual([
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 1, col: 1 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 1, col: 0 } } as Tiles,
            ]);
        });

        it('should return an empty array if no tiles are accessible', () => {
            const mockPlayerPosition = { row: 1, col: 1 };

            // Mock the tiles returned by getAllTilesInRange with no accessible tiles
            spyOn(service, 'getAllTilesInRange').and.returnValue([
                { fieldTile: GAME_TILES.WALL, avatar: null, position: { row: 1, col: 2 } } as Tiles,
                { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null, position: { row: 2, col: 1 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: 'playerAvatar', position: { row: 0, col: 1 } } as Tiles,
            ]);

            const result = service.getAllAccessibleTilesRangeOne(mockPlayerPosition);

            expect(service.getAllTilesInRange).toHaveBeenCalledWith(mockPlayerPosition, 1);
            expect(result).toEqual([]);
        });
    });

    describe('#getAllAccessibleTilesRangeTwo', () => {
        it('should return tiles within range 2 that are accessible', () => {
            const mockPlayerPosition = { row: 2, col: 2 };

            // Mock the tiles returned by getAllTilesInRange
            spyOn(service, 'getAllTilesInRange').and.returnValue([
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 2, col: 2 } } as Tiles,
                { fieldTile: GAME_TILES.WALL, avatar: null, position: { row: 2, col: 3 } } as Tiles,
                { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null, position: { row: 3, col: 2 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: 'playerAvatar', position: { row: 1, col: 2 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 2, col: 1 } } as Tiles,
            ]);

            const result = service.getAllAccessibleTilesRangeTwo(mockPlayerPosition);

            expect(service.getAllTilesInRange).toHaveBeenCalledWith(mockPlayerPosition, 2);
            expect(result).toEqual([
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 2, col: 2 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 2, col: 1 } } as Tiles,
            ]);
        });

        it('should return an empty array if no tiles are accessible', () => {
            const mockPlayerPosition = { row: 2, col: 2 };

            // Mock the tiles returned by getAllTilesInRange with no accessible tiles
            spyOn(service, 'getAllTilesInRange').and.returnValue([
                { fieldTile: GAME_TILES.WALL, avatar: null, position: { row: 2, col: 3 } } as Tiles,
                { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null, position: { row: 3, col: 2 } } as Tiles,
                { fieldTile: GAME_TILES.BASE, avatar: 'playerAvatar', position: { row: 1, col: 2 } } as Tiles,
            ]);

            const result = service.getAllAccessibleTilesRangeTwo(mockPlayerPosition);

            expect(service.getAllTilesInRange).toHaveBeenCalledWith(mockPlayerPosition, 2);
            expect(result).toEqual([]);
        });
    });

    describe('#getAllTilesInRange', () => {
        let mockBoard: Tiles[][];

        beforeEach(() => {
            mockBoard = [
                [
                    { fieldTile: GAME_TILES.BASE, position: { row: 0, col: 0 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, position: { row: 0, col: 1 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, position: { row: 0, col: 2 } } as Tiles,
                ],
                [
                    { fieldTile: GAME_TILES.BASE, position: { row: 1, col: 0 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, position: { row: 1, col: 1 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, position: { row: 1, col: 2 } } as Tiles,
                ],
                [
                    { fieldTile: GAME_TILES.BASE, position: { row: 2, col: 0 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, position: { row: 2, col: 1 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, position: { row: 2, col: 2 } } as Tiles,
                ],
            ];

            service.board = mockBoard; // Set the mock board in the service
        });

        it('should return all tiles within the given range', () => {
            const playerPosition = { row: 1, col: 1 };
            const range = 1;

            const result = service.getAllTilesInRange(playerPosition, range);

            expect(result).toEqual([
                mockBoard[0][0],
                mockBoard[0][1],
                mockBoard[0][2],
                mockBoard[1][0],
                mockBoard[1][1],
                mockBoard[1][2],
                mockBoard[2][0],
                mockBoard[2][1],
                mockBoard[2][2],
            ]);
        });

        it('should exclude tiles that are out of bounds', () => {
            const playerPosition = { row: 0, col: 0 }; // Position at the top-left corner
            const range = 1;

            const result = service.getAllTilesInRange(playerPosition, range);

            expect(result).toEqual([mockBoard[0][0], mockBoard[0][1], mockBoard[1][0], mockBoard[1][1]]); // Tiles within bounds
        });

        it('should return only the tile at the player position when range is 0', () => {
            const playerPosition = { row: 1, col: 1 };
            const range = 0;

            const result = service.getAllTilesInRange(playerPosition, range);

            expect(result).toEqual([mockBoard[1][1]]);
        });
    });

    describe('#teleportToTile', () => {
        let mockPlayer: Player;
        let mockBoard: Tiles[][];

        beforeEach(() => {
            mockPlayer = {
                username: 'testPlayer',
                inventory: [null, null],
                character: {
                    body: 'playerAvatar',
                    position: { row: 2, col: 0 },
                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                    initialPosition: { row: 2, col: 0 },
                },
                isAdmin: false,
            } as Player;

            mockBoard = [
                [
                    { fieldTile: GAME_TILES.BASE, wall: false, door: false, avatar: null, position: { row: 0, col: 0 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, wall: false, door: false, avatar: null, position: { row: 0, col: 1 } } as Tiles,
                ],
                [
                    { fieldTile: GAME_TILES.BASE, wall: false, door: false, avatar: null, position: { row: 1, col: 0 } } as Tiles,
                    { fieldTile: GAME_TILES.WALL, wall: true, door: false, avatar: null, position: { row: 1, col: 1 } } as Tiles,
                ],
                [
                    { fieldTile: GAME_TILES.BASE, wall: false, door: false, avatar: 'playerAvatar', position: { row: 2, col: 0 } } as Tiles,
                    { fieldTile: GAME_TILES.BASE, wall: false, door: false, avatar: null, position: { row: 2, col: 1 } } as Tiles,
                ],
            ];

            service.board = mockBoard;

            // Mocking sharedDataService and socketService
            mockSharedDataService.getDebugModeStatus.and.returnValue(true);
            mockSharedDataService.getPlayer.and.returnValue(mockPlayer);
            mockSharedDataService.getAccessCode.and.returnValue('1234'); // Mocked access code value
            mockSocketService.emit.calls.reset();
        });

        it('should not teleport if debug mode is disabled', () => {
            mockSharedDataService.getDebugModeStatus.and.returnValue(false);
            service.teleportToTile(1, 0);

            expect(mockSocketService.emit).not.toHaveBeenCalled();
            expect(mockPlayer.character.position).toEqual({ row: 2, col: 0 });
        });

        it('should not teleport if tile is invalid', () => {
            spyOn(service, 'isValidTile').and.returnValue(false); // Force invalid tile
            service.teleportToTile(2, 7); // Invalid position outside the board

            expect(mockSocketService.emit).not.toHaveBeenCalled();
            expect(mockPlayer.character.position).toEqual({ row: 2, col: 0 });
        });

        it('should teleport to a valid and unoccupied tile', () => {
            // Manually call isValidTile to validate the tile before teleportation
            spyOn(service, 'isValidTile').and.returnValue(true);

            service.teleportToTile(0, 1);

            expect(mockBoard[2][0].avatar).toBeNull(); // Original position cleared
            expect(mockBoard[0][1].avatar).toBe('playerAvatar'); // New position updated
            expect(mockPlayer.character.position).toEqual({ row: 0, col: 1 });

            expect(mockSocketService.emit).toHaveBeenCalledWith('playerMove', {
                player: mockPlayer,
                position: { row: 0, col: 1 },
                room: '1234', // Mocked access code here
                positionBeforeTeleportation: { r: 2, c: 0 },
                isTeleportation: true,
            });
        });

        it('should not teleport to a tile occupied by another avatar', () => {
            mockBoard[0][1].avatar = 'otherAvatar'; // Tile is occupied
            spyOn(service, 'isValidTile').and.returnValue(true); // Force valid tile
            service.teleportToTile(0, 1);

            expect(mockBoard[2][0].avatar).toBe('playerAvatar'); // Original position unchanged
            expect(mockPlayer.character.position).toEqual({ row: 2, col: 0 });
            expect(mockSocketService.emit).not.toHaveBeenCalled();
        });

        it('should not teleport to a wall tile', () => {
            spyOn(service, 'isValidTile').and.returnValue(true); // Force valid tile
            service.teleportToTile(1, 1); // Wall tile

            expect(mockBoard[2][0].avatar).toBe('playerAvatar'); // Original position unchanged
            expect(mockPlayer.character.position).toEqual({ row: 2, col: 0 });
            expect(mockSocketService.emit).not.toHaveBeenCalled();
        });

        it('should handle board traversal and correctly update the player position', () => {
            spyOn(service, 'isValidTile').and.returnValue(true); // Force valid tile

            service.teleportToTile(1, 0);

            expect(mockBoard[2][0].avatar).toBeNull(); // Clear original position
            expect(mockBoard[1][0].avatar).toBe('playerAvatar'); // Update new position
            expect(mockPlayer.character.position).toEqual({ row: 1, col: 0 });

            expect(mockSocketService.emit).toHaveBeenCalledWith('playerMove', {
                player: mockPlayer,
                position: { row: 1, col: 0 },
                room: '1234', // Mocked access code here
                positionBeforeTeleportation: { r: 2, c: 0 },
                isTeleportation: true,
            });
        });
    });
});
