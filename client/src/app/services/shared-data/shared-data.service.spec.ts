import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { SharedDataService } from './shared-data.service';

describe('SharedDataService', () => {
    let service: SharedDataService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SharedDataService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('setPlayer and getPlayer', () => {
        it('should set and get the player', () => {
            const mockPlayer: Player = {
                username: 'testPlayer',
                isAdmin: true,
                inventory: [null, null], // Add inventory
                character: {
                    name: 'testCharacter',
                    body: 'playerAvatar',
                    image: 'avatar.png',
                    face: 'face.png',
                    dice: 'attack',
                    victories: 0,
                    disabled: false,
                    position: { row: 0, col: 0 }, // Define position if necessary
                    initialPosition: { row: 0, col: 0 }, // Define initial position if necessary
                    stats: {
                        health: 100,
                        speed: 10,
                        attack: 15,
                        defense: 5,
                    },
                },
            };
            service.setPlayer(mockPlayer);

            expect(service.getPlayer()).toEqual(mockPlayer);
        });
    });

    describe('setAccessCode and getAccessCode', () => {
        it('should set and get the access code', () => {
            const accessCode = 'ABCD1234';
            service.setAccessCode(accessCode);

            expect(service.getAccessCode()).toBe(accessCode);
        });
    });

    describe('setMatchId and getMatchId', () => {
        it('should set and get the match ID', () => {
            const matchId = 'match-1234';
            service.setMatchId(matchId);

            expect(service.getMatchId()).toBe(matchId);
        });
    });

    describe('setGame and getGame', () => {
        it('should set and get the game', () => {
            const mockGame: Game = {
                _id: 'game1',
                title: 'Test Game',
                mapSize: 'large',
                mode: 'survival',
                visibility: true,
                description: '',
                board: [],
                updatedAt: new Date(),
            };
            service.setGame(mockGame);

            expect(service.getGame()).toEqual(mockGame);
        });
    });

    describe('setBoard and getBoard', () => {
        it('should set and get the game board', () => {
            const mockBoard: Tiles[][] = [
                [{ fieldTile: 'grass', door: false, wall: false, object: null, avatar: null, isTileSelected: false, position: { row: 0, col: 0 } }],
                [{ fieldTile: 'water', door: false, wall: true, object: null, avatar: null, isTileSelected: false, position: { row: 1, col: 1 } }],
            ];
            service.setBoard(mockBoard);

            expect(service.getBoard()).toEqual(mockBoard);
        });
    });

    describe('setPlayersInGame and getPlayersInGame', () => {
        it('should set and get the players in game', () => {
            const mockPlayers: Player[] = [
                {
                    username: 'player1',
                    isAdmin: true,
                    inventory: [null, null], // Proper inventory
                    character: {
                        name: 'character1',
                        body: 'avatar1',
                        image: 'image1.png',
                        face: 'face1.png',
                        dice: 'attack',
                        victories: 0,
                        disabled: false,
                        position: { row: 0, col: 0 },
                        initialPosition: { row: 0, col: 0 },
                        stats: { health: 100, speed: 10, attack: 15, defense: 5 },
                    },
                },
                {
                    username: 'player2',
                    isAdmin: false,
                    inventory: [null, null], // Proper inventory
                    character: {
                        name: 'character2',
                        body: 'avatar2',
                        image: 'image2.png',
                        face: 'face2.png',
                        dice: 'attack',
                        victories: 0,
                        disabled: false,
                        position: { row: 1, col: 0 },
                        initialPosition: { row: 1, col: 0 },
                        stats: { health: 100, speed: 10, attack: 15, defense: 5 },
                    },
                },
            ];
            service.setPlayersInGame(mockPlayers);

            expect(service.getPlayersInGame()).toEqual(mockPlayers);
        });
    });

    describe('setVictoryMap and getVictoryMap', () => {
        it('should set and get the player victory map', () => {
            // Initialize a mock victory map
            const mockVictoryMap = new Map<string, number>([
                ['player1', 2],
                ['player2', 3],
                ['player3', 5],
            ]);

            // Set the victory map using the setter
            service.setVictoryMap(mockVictoryMap);

            // Get the victory map and verify it matches the mockVictoryMap
            expect(service.getVictoryMap()).toEqual(mockVictoryMap);
        });
    });

    describe('setLossesMap and getLossesMap', () => {
        it('should set and get the player losses map', () => {
            // Initialize a mock losses map
            const mockLossesMap = new Map<string, number>([
                ['player1', 1],
                ['player2', 2],
                ['player3', 3],
            ]);

            // Set the losses map using the setter
            service.setLossesMap(mockLossesMap);

            // Get the losses map and verify it matches the mockLossesMap
            expect(service.getLossesMap()).toEqual(mockLossesMap);
        });
    });

    describe('setCombatMap and getCombatMap', () => {
        it('should set and get the player combat map', () => {
            // Initialize a mock combat map
            const mockCombatMap = new Map<string, number>([
                ['player1', 5], // player1 has fought 5 times
                ['player2', 10], // player2 has fought 10 times
                ['player3', 3], // player3 has fought 3 times
            ]);

            // Set the combat map using the setter
            service.setCombatMap(mockCombatMap);

            // Get the combat map and verify it matches the mockCombatMap
            expect(service.getCombatMap()).toEqual(mockCombatMap);
        });
    });

    describe('setEscapeMap and getEscapeMap', () => {
        it('should set and get the escape map', () => {
            const mockEscapeMap = new Map<string, number>([
                ['player1', 3],
                ['player2', 5],
            ]);

            service.setEscapeMap(mockEscapeMap);

            expect(service.getEscapeMap()).toEqual(mockEscapeMap);
        });
    });

    describe('setPointsTakenMap and getPointsTakenMap', () => {
        it('should set and get the points taken map', () => {
            const mockPointsTakenMap = new Map<string, number>([
                ['player1', 20],
                ['player2', 15],
            ]);

            service.setPointsTakenMap(mockPointsTakenMap);

            expect(service.getPointsTakenMap()).toEqual(mockPointsTakenMap);
        });
    });

    describe('setPointsLostMap and getPointsLostMap', () => {
        it('should set and get the points lost map', () => {
            const mockPointsLostMap = new Map<string, number>([
                ['player1', 10],
                ['player2', 5],
            ]);

            service.setPointsLostMap(mockPointsLostMap);

            expect(service.getPointsLostMap()).toEqual(mockPointsLostMap);
        });
    });

    describe('setObjectsCountMap and getObjectsCountMap', () => {
        it('should set and get the objects count map', () => {
            const mockObjectCountMap = new Map<string, number>([
                ['player1', 3],
                ['player2', 7],
            ]);

            service.setObjectsCountMap(mockObjectCountMap);

            expect(service.getObjectsCountMap()).toEqual(mockObjectCountMap);
        });
    });

    describe('setPlayersWithFlagMap and getPlayersWithFlagMap', () => {
        it('should set and get the players with flag map', () => {
            const mockPlayersWithFlag = new Set<string>(['player1', 'player3']);

            service.setPlayersWithFlagMap(mockPlayersWithFlag);

            expect(service.getPlayersWithFlagMap()).toEqual(mockPlayersWithFlag);
        });
    });

    describe('setTilesVisitedMap and getTilesVisitedMap', () => {
        it('should set and get the tiles visited map', () => {
            const mockTilesVisited = new Map<string, { row: number; col: number }[]>([
                [
                    'player1',
                    [
                        { row: 0, col: 0 },
                        { row: 1, col: 1 },
                    ],
                ],
                [
                    'player2',
                    [
                        { row: 2, col: 2 },
                        { row: 3, col: 3 },
                    ],
                ],
            ]);

            service.setTilesVisitedMap(mockTilesVisited);

            expect(service.getTilesVisitedMap()).toEqual(mockTilesVisited);
        });
    });

    describe('setIsCTF and getIsCTF', () => {
        it('should set and get the CTF mode', () => {
            service.setIsCTF(true);
            expect(service.getIsCTF()).toBeTrue();

            service.setIsCTF(false);
            expect(service.getIsCTF()).toBeFalse();
        });
    });

    describe('setTotalTurns and getTotalTurns', () => {
        it('should set and get the total turns', () => {
            const totalTurns = 5;
            service.setTotalTurns(totalTurns);
            expect(service.getTotalTurns()).toBe(totalTurns);

            const updatedTotalTurns = 10;
            service.setTotalTurns(updatedTotalTurns);
            expect(service.getTotalTurns()).toBe(updatedTotalTurns);
        });
    });

    describe('setGameDuration and getGameDuration', () => {
        it('should set and get the game duration', () => {
            const gameDuration = { minutes: 15, seconds: 30 };
            service.setGameDuration(gameDuration);
            expect(service.getGameDuration()).toEqual(gameDuration);

            const updatedGameDuration = { minutes: 20, seconds: 45 };
            service.setGameDuration(updatedGameDuration);
            expect(service.getGameDuration()).toEqual(updatedGameDuration);
        });
    });

    describe('setRemainingSpeed and getRemainingSpeed', () => {
        it('should set and get the remaining speed', () => {
            const remainingSpeed = 10;
            service.setRemainingSpeed(remainingSpeed);
            expect(service.getRemainingSpeed()).toBe(remainingSpeed);

            const updatedSpeed = 15;
            service.setRemainingSpeed(updatedSpeed);
            expect(service.getRemainingSpeed()).toBe(updatedSpeed);
        });
    });

    describe('setDoorsToggled and getDoorsToggled', () => {
        it('should set and get the doors toggled', () => {
            const doorsToggled = [
                { row: 1, col: 2 },
                { row: 3, col: 4 },
            ];
            service.setDoorsToggled(doorsToggled);
            expect(service.getDoorsToggled()).toEqual(doorsToggled);

            const updatedDoorsToggled = [{ row: 5, col: 6 }];
            service.setDoorsToggled(updatedDoorsToggled);
            expect(service.getDoorsToggled()).toEqual(updatedDoorsToggled);
        });
    });

    describe('setTotalTilesVisited and getTotalTilesVisited', () => {
        it('should set and get the total tiles visited', () => {
            const totalTilesVisited = [
                { row: 0, col: 0 },
                { row: 1, col: 1 },
            ];
            service.setTotalTilesVisited(totalTilesVisited);
            expect(service.getTotalTilesVisited()).toEqual(totalTilesVisited);

            const updatedTotalTilesVisited = [{ row: 2, col: 2 }];
            service.setTotalTilesVisited(updatedTotalTilesVisited);
            expect(service.getTotalTilesVisited()).toEqual(updatedTotalTilesVisited);
        });
    });

    describe('setActivePlayer and getActivePlayer', () => {
        it('should set and get the active player', () => {
            const activePlayer: Player = {
                username: 'testPlayer',
                isAdmin: true,
                inventory: [null, null],
                character: {
                    name: 'testCharacter',
                    body: 'playerAvatar',
                    image: 'avatar.png',
                    face: 'face.png',
                    dice: 'attack',
                    victories: 0,
                    disabled: false,
                    position: { row: 0, col: 0 },
                    initialPosition: { row: 0, col: 0 },
                    stats: {
                        health: 100,
                        speed: 10,
                        attack: 15,
                        defense: 5,
                    },
                },
            };

            service.setActivePlayer(activePlayer);
            expect(service.getActivePlayer()).toEqual(activePlayer);

            const updatedActivePlayer: Player = {
                username: 'updatedPlayer',
                isAdmin: false,
                inventory: [null, null], // Proper inventory
                character: {
                    name: 'updatedCharacter',
                    body: 'updatedAvatar',
                    image: 'updatedAvatar.png',
                    face: 'updatedFace.png',
                    dice: 'defense',
                    victories: 1,
                    disabled: true,
                    position: { row: 1, col: 1 },
                    initialPosition: { row: 1, col: 1 },
                    stats: {
                        health: 80,
                        speed: 5,
                        attack: 10,
                        defense: 20,
                    },
                },
            };

            service.setActivePlayer(updatedActivePlayer);
            expect(service.getActivePlayer()).toEqual(updatedActivePlayer);
        });
    });

    describe('clearActivePlayer', () => {
        it('should set active player to null', () => {
            // Set an active player first
            const activePlayer: Player = {
                username: 'testPlayer',
                isAdmin: true,
                inventory: [null, null],
                character: {
                    name: 'testCharacter',
                    body: 'playerAvatar',
                    image: 'avatar.png',
                    face: 'face.png',
                    dice: 'attack',
                    victories: 0,
                    disabled: false,
                    position: { row: 0, col: 0 },
                    initialPosition: { row: 0, col: 0 },
                    stats: {
                        health: 100,
                        speed: 10,
                        attack: 15,
                        defense: 5,
                    },
                },
            };

            service.setActivePlayer(activePlayer);
            expect(service.getActivePlayer()).toEqual(activePlayer); // Confirm the player is set

            // Call clearActivePlayer and verify
            service.clearActivePlayer();
            expect(service.getActivePlayer()).toBeNull();
        });
    });

    describe('setDebugModeStatus and getDebugModeStatus', () => {
        it('should set and get the debug mode status', () => {
            // Set debug mode status to true
            service.setDebugModeStatus(true);
            expect(service.getDebugModeStatus()).toBeTrue();

            // Set debug mode status to false
            service.setDebugModeStatus(false);
            expect(service.getDebugModeStatus()).toBeFalse();
        });
    });

    describe('resetSharedServices', () => {
        it('should reset all shared services to their initial state', () => {
            // Mock initial data to ensure values change before reset
            const mockPlayer = {
                username: 'testPlayer',
                character: {
                    name: 'testCharacter',
                    body: 'playerAvatar',
                    stats: { health: 100, speed: 10, attack: 15, defense: 5 },
                    victories: 1,
                    position: { row: 1, col: 1 },
                    initialPosition: { row: 0, col: 0 },
                    dice: '1d6',
                    disabled: false,
                    image: 'avatar.png',
                    face: 'face.png',
                },
                inventory: ['item1', null],
                isAdmin: true,
            };

            service.setPlayer(mockPlayer as Player);
            service.setAccessCode('ABCD1234');
            service.setMatchId('match-1234');
            service.setTotalTurns(5);
            service.setGame({
                _id: 'game1',
                title: 'Test Game',
                mapSize: 'large',
                mode: 'survival',
                visibility: true,
                description: '',
                board: [],
                updatedAt: new Date(),
            });
            service.setGameDuration({ minutes: 10, seconds: 30 });
            service.setBoard([[{ fieldTile: 'grass', door: false, wall: false, position: { row: 0, col: 0 } } as Tiles]]);
            service.setPlayersInGame([mockPlayer as Player]);
            service.setDebugModeStatus(true);

            // Call resetSharedServices
            service.resetSharedServices();

            // Verify the reset state
            expect(service.getVictoryMap()).toEqual(new Map<string, number>());
            expect(service.getLossesMap()).toEqual(new Map<string, number>());
            expect(service.getCombatMap()).toEqual(new Map<string, number>());
            expect(service.getEscapeMap()).toEqual(new Map<string, number>());
            expect(service.getPointsTakenMap()).toEqual(new Map<string, number>());
            expect(service.getPointsLostMap()).toEqual(new Map<string, number>());
            expect(service.getObjectsCountMap()).toEqual(new Map<string, number>());
            expect(service.getTilesVisitedMap()).toEqual(new Map<string, { row: number; col: number }[]>());
            expect(service.getPlayer()).toEqual({
                username: '',
                character: {
                    name: '',
                    image: '',
                    face: '',
                    body: '',
                    stats: {
                        health: 0,
                        speed: 0,
                        attack: 0,
                        defense: 0,
                    },
                    dice: '',
                    victories: 0,
                    disabled: false,
                    position: null,
                    initialPosition: null,
                },
                inventory: [null, null],
                isAdmin: false,
            });
            expect(service.getAccessCode()).toBe('');
            expect(service.getMatchId()).toBe('');
            expect(service.getGame()).toEqual({
                _id: '',
                title: '',
                mapSize: '',
                mode: '',
                visibility: false,
                description: '',
                board: [],
                updatedAt: new Date(),
            });
            expect(service.getTotalTurns()).toBe(0);
            expect(service.getGameDuration()).toEqual({ minutes: 0, seconds: 0 });
            expect(service.getBoard()).toEqual([]);
            expect(service.getPlayersInGame()).toEqual([]);
            expect(service.getDoorsToggled()).toEqual([]);
            expect(service.getTotalTilesVisited()).toEqual([]);
            expect(service.getDebugModeStatus()).toBeFalse();
            expect(service.getChatHistory()).toEqual([]);
            expect(service.getActivePlayer()).toBeNull();
        });
    });
});
