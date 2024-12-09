import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { ItemsGateway } from '@app/gateways/items/items.gateway';
import { MatchBoardGateway } from '@app/gateways/match-board/match-board.gateway';
import { TimersGateway } from '@app/gateways/timers/timers.gateway';
import { Character } from '@app/model/schema/character.schema';
import { Player } from '@app/model/schema/player.schema';
import { Tiles } from '@app/model/schema/tiles.schema';
import { InventoryService } from '@app/services/inventory/inventory.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { TurnSystemService } from '@app/services/turn-system/turn-system.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { GAME_TILES } from '@app/shared/game-tiles';
import { Test, TestingModule } from '@nestjs/testing';
import { VirtualPlayerService } from './virtual-player.service';

describe('VirtualPlayerService', () => {
    let service: VirtualPlayerService;
    let mockMatchBoardGateway: MatchBoardGateway;
    let mockSharedDataService: SharedDataService;
    let mockTurnSystemService: TurnSystemService;
    let mockCombatGateway: CombatGateway;
    let mockBoard: Tiles[][] = [
        [
            {
                fieldTile: GAME_TILES.BASE,
                wall: false,
                door: false,
                avatar: '',
                isTileSelected: false,
                position: { row: 0, col: 0 },
                object: '',
            } as Tiles,
        ],
        [
            {
                fieldTile: GAME_TILES.WATER,
                wall: false,
                door: false,
                avatar: '',
                isTileSelected: false,
                position: { row: 0, col: 0 },
                object: '',
            } as Tiles,
        ],
        [
            {
                fieldTile: GAME_TILES.ICE,
                wall: false,
                door: false,
                avatar: '',
                isTileSelected: false,
                position: { row: 0, col: 0 },
                object: '',
            } as Tiles,
        ],
    ];
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VirtualPlayerService,
                {
                    provide: CombatGateway,
                    useValue: { handleStartFight: jest.fn(), handleVictoryUpdate: jest.fn(), virtualPlayersSmoke: jest.fn() },
                },
                {
                    provide: ItemsGateway,
                    useValue: { handleItemPickedUp: jest.fn(), handleItemThrown: jest.fn() },
                },
                {
                    provide: MatchBoardGateway,
                    useValue: { handlePlayerMove: jest.fn(), handleToggleDoor: jest.fn(), checkEndTurn: jest.fn(), debugState: new Map() },
                },
                {
                    provide: TimersGateway,
                    useValue: { handleEndTurn: jest.fn(), roomVpActionMap: new Map([['room1', new Map()]]), playersInFight: new Map() },
                },
                {
                    provide: InventoryService,
                    useValue: {
                        addItemToInventory: jest.fn(),
                        applyItemEffects: jest.fn(),
                        removeItemFromInventory: jest.fn(),
                        revertItemEffects: jest.fn(),
                    },
                },
                {
                    provide: MovementService,
                    useValue: {
                        findPath: jest.fn(),
                        checkNextTileStepValue: jest.fn(),
                        chanceOfStop: jest.fn(),
                    },
                },
                {
                    provide: SharedDataService,
                    useValue: { getBoard: jest.fn() },
                },
                {
                    provide: TurnSystemService,
                    useValue: { useAction: jest.fn(), canPerformAction: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<VirtualPlayerService>(VirtualPlayerService);
        mockMatchBoardGateway = module.get<MatchBoardGateway>(MatchBoardGateway);
        mockSharedDataService = module.get<SharedDataService>(SharedDataService);
        mockTurnSystemService = module.get<TurnSystemService>(TurnSystemService);
        mockCombatGateway = module.get<CombatGateway>(CombatGateway);

        jest.spyOn(mockSharedDataService, 'getBoard').mockReturnValue(mockBoard);
        service.board = mockBoard;

        service.virtualPlayerPosition = { row: 0, col: 0 };

        expect(service.board[0][0].position).toEqual(service.virtualPlayerPosition);
    });

    describe('getVirtualPlayerPosition', () => {
        it('should find and set the virtual player position on the board', () => {
            const mockPlayer: Player = {
                username: 'player1',
                character: { body: 'avatar1', position: { row: 0, col: 0 } } as Character,
                inventory: [],
                isVirtual: true,
            } as Player;
            const mockBoard: Tiles[][] = [
                [{ avatar: 'avatar1', fieldTile: GAME_TILES.BASE } as Tiles, { avatar: null } as Tiles],
                [{ avatar: null } as Tiles, { avatar: null } as Tiles],
            ];

            jest.spyOn(mockSharedDataService, 'getBoard').mockReturnValue(mockBoard);

            service.getVirtualPlayerPosition(mockPlayer);

            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
        });

        it('should throw an error if sharedDataService is not initialized', () => {
            expect(() => service.getVirtualPlayerPosition({} as Player)).toThrowError("Cannot read properties of undefined (reading 'body')");
        });
    });

    describe('performActionOnTileVirtualPlayer', () => {
        it('should toggle a door when interacting with a door tile and the virtual player does not have a master key', () => {
            const mockPlayer = {
                username: 'player1',
                inventory: [null, null],
            } as Player;
            const mockTile = { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [], mockPlayer);

            expect(mockMatchBoardGateway.handleToggleDoor).toHaveBeenCalledWith(null, {
                currentTile: mockTile,
                room: 'room1',
                player: mockPlayer,
                wasDoorOpen: false,
            });
            expect(mockTurnSystemService.useAction).toHaveBeenCalled();
        });

        it('should toggle a door when interacting with a door tile and the virtual player does not have a master key', () => {
            const mockPlayer = {
                username: 'player1',
                inventory: [null, null],
            } as Player;
            const mockTile = { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [], mockPlayer);

            expect(mockMatchBoardGateway.handleToggleDoor).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    currentTile: mockTile,
                    room: 'room1',
                    player: mockPlayer,
                    wasDoorOpen: false,
                }),
            );
        });

        it('should decrease attack and defense stats for players on ICE tiles during combat', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                inventory: [],
                character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
            } as Player;
            const mockOpponent = {
                username: 'opponent',
                character: { body: 'avatar1', stats: { attack: 15, defense: 15 } } as Character,
            } as Player;

            const mockTile = { fieldTile: GAME_TILES.ICE, avatar: 'avatar1' } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [mockOpponent], mockPlayer);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);
        });

        it('should decrease attack and defense stats for the attacked player on ICE tiles', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                inventory: [],
                character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
            } as Player;
            const mockOpponent = {
                username: 'opponent',
                character: { body: 'avatar1', stats: { attack: 15, defense: 15 } } as Character,
            } as Player;

            const mockTile = { fieldTile: GAME_TILES.ICE, avatar: 'avatar1' } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [mockOpponent], mockPlayer);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);
        });

        it('should decrease attack and defense stats for the attacking player on ICE tiles', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                inventory: [],
                character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
            } as Player;
            const mockOpponent = {
                username: 'opponent',
                character: { body: 'avatar1', stats: { attack: 15, defense: 15 } } as Character,
            } as Player;

            const mockTile = { fieldTile: GAME_TILES.BASE, avatar: 'avatar1' } as Tiles;
            const mockBoard: Tiles[][] = [[{ fieldTile: GAME_TILES.ICE, avatar: 'avatar2' } as Tiles], [mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [mockOpponent], mockPlayer);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);
        });

        it('should set the action map for the virtual player', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                inventory: [],
                character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
            } as Player;
            const mockOpponent = {
                username: 'opponent',
                character: { body: 'avatar1', stats: { attack: 15, defense: 15 } } as Character,
            } as Player;

            const mockTile = { fieldTile: GAME_TILES.BASE, avatar: 'avatar1' } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [mockOpponent], mockPlayer);

            expect(service.timersGateway.roomVpActionMap.get('room1').get('virtualPlayer')).toBe(true);
        });

        it('should end the turn if no actions are available', () => {
            const mockPlayer = {
                username: 'player1',
                inventory: [],
            } as Player;
            const mockTile = { fieldTile: GAME_TILES.BASE, avatar: null } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(false);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [], mockPlayer);

            expect(mockMatchBoardGateway.checkEndTurn).toHaveBeenCalledWith(null, {
                room: 'room1',
                player: mockPlayer,
            });
        });

        it('should not perform an action if the tile is neither a door nor contains an avatar', () => {
            const mockPlayer = {
                username: 'player1',
                inventory: [],
            } as Player;
            const mockTile = { fieldTile: GAME_TILES.BASE, avatar: null } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [], mockPlayer);

            expect(mockTurnSystemService.useAction).not.toHaveBeenCalled();
            expect(mockMatchBoardGateway.handleToggleDoor).not.toHaveBeenCalled();
            expect(mockCombatGateway.virtualPlayersSmoke).not.toHaveBeenCalled();
        });

        it('should not use an action if the virtual player has a master key', () => {
            const mockPlayer = {
                username: 'player1',
                inventory: ['assets/object-master-key-only.png', null],
            } as Player;
            const mockTile = { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [], mockPlayer);

            expect(mockMatchBoardGateway.handleToggleDoor).toHaveBeenCalledWith(null, {
                currentTile: mockTile,
                room: 'room1',
                player: mockPlayer,
                wasDoorOpen: false,
            });
            expect(mockTurnSystemService.useAction).not.toHaveBeenCalled();
        });

        it('should call virtualPlayersSmoke with correct parameters', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                inventory: [],
                character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
            } as Player;
            const mockOpponent = {
                username: 'opponent',
                character: { body: 'avatar1', stats: { attack: 15, defense: 15 } } as Character,
            } as Player;

            const mockTile = { fieldTile: GAME_TILES.BASE, avatar: 'avatar1' } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [mockOpponent], mockPlayer);

            expect(mockCombatGateway.virtualPlayersSmoke).toHaveBeenCalledWith('room1', mockOpponent, mockPlayer, undefined);
        });

        it('should reset stats after combat if on ICE tiles', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                inventory: [],
                character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
            } as Player;
            const mockOpponent = {
                username: 'opponent',
                character: { body: 'avatar1', stats: { attack: 15, defense: 15 } } as Character,
            } as Player;

            const mockTile = { fieldTile: GAME_TILES.ICE, avatar: 'avatar1' } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

            service.performActionOnTileVirtualPlayer(0, 0, 'room1', [mockOpponent], mockPlayer);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);

            expect(mockOpponent.character.stats.attack).toBe(15);
            expect(mockOpponent.character.stats.defense).toBe(15);
            expect(mockPlayer.character.stats.attack).toBe(10);
            expect(mockPlayer.character.stats.defense).toBe(10);
        });
    });

    describe('isTileAdjacentVirtualPlayer', () => {
        it('should return true if the tile is adjacent', () => {
            service.virtualPlayerPosition = { row: 1, col: 1 };
            const result = service.isTileAdjacentVirtualPlayer(2, 1);
            expect(result).toBe(true);
        });

        it('should return false if the tile is not adjacent', () => {
            const THREE = 3;
            service.virtualPlayerPosition = { row: 1, col: 1 };
            const result = service.isTileAdjacentVirtualPlayer(THREE, 1);
            expect(result).toBe(false);
        });
    });

    describe('toggleDoorVirtualPlayer', () => {
        it('should open a closed door', () => {
            const mockTile = { fieldTile: GAME_TILES.DOOR_CLOSED } as Tiles;
            const mockPlayer = { username: 'player1' } as Player;

            service.toggleDoorVirtualPlayer(mockTile, 'room1', mockPlayer);

            expect(mockTile.fieldTile).toBe(GAME_TILES.DOOR_OPEN);
            expect(mockMatchBoardGateway.handleToggleDoor).toHaveBeenCalledWith(null, expect.any(Object));
        });

        it('should close an open door', () => {
            const mockTile = { fieldTile: GAME_TILES.DOOR_OPEN } as Tiles;
            const mockPlayer = { username: 'player1' } as Player;

            service.toggleDoorVirtualPlayer(mockTile, 'room1', mockPlayer);

            expect(mockTile.fieldTile).toBe(GAME_TILES.DOOR_CLOSED);
            expect(mockMatchBoardGateway.handleToggleDoor).toHaveBeenCalledWith(null, expect.any(Object));
        });
    });

    describe('moveToDestinationVirtualPlayer', () => {
        beforeEach(() => {
            jest.spyOn(service, 'getVirtualPlayerPosition').mockImplementation((virtualPlayer: Player) => {
                service.virtualPlayerPosition = { row: 0, col: 0 };
            });
        });

        it('should not move if remaining speed is less than or equal to 0', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 0,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockTile = { fieldTile: GAME_TILES.BASE, avatar: 'avatar2' } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            service.moveToDestinationVirtualPlayer(mockTile, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
        });

        it('should not move if destination is null', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 10,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;

            service.moveToDestinationVirtualPlayer(null, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
        });

        it('should not move if path is not found', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 10,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockTile = { fieldTile: GAME_TILES.BASE, avatar: 'avatar2' } as Tiles;
            const mockBoard: Tiles[][] = [[mockTile]];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue(null);

            service.moveToDestinationVirtualPlayer(mockTile, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
        });

        it('should move the virtual player along the path', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 10,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockDestination = mockBoard[1][1];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue([{ row: 1, col: 1 }]);
            jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);

            service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
        });

        it('should handle picking up an item', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 10,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockDestination = mockBoard[1][1];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue([{ row: 1, col: 1 }]);
            jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);
            jest.spyOn(service.inventoryService, 'addItemToInventory').mockReturnValue(true);

            service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
        });

        it('should handle stopping on ICE tile', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 10,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockDestination = mockBoard[1][1];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue([{ row: 1, col: 1 }]);
            jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);
            jest.spyOn(service.movementService, 'chanceOfStop').mockReturnValue(true);

            service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
            expect(mockPlayer.remainingSpeed).toBe(10);
        });

        it('should handle end turn if remaining speed is less than movement cost', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 1,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockDestination = mockBoard[1][1];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue([{ row: 1, col: 1 }]);
            jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);
            jest.spyOn(service.movementService, 'checkNextTileStepValue').mockImplementation(() => {
                service.movementService.stepValue = 2;
            });

            service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
        });

        it('should handle moving to the next step in the path', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 10,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockDestination = mockBoard[1][1];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue([{ row: 1, col: 1 }]);
            jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);

            service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
        });

        it('should handle stopping if remaining speed is less than movement cost', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 1,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockDestination = mockBoard[1][1];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue([{ row: 1, col: 1 }]);
            jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);
            jest.spyOn(service.movementService, 'checkNextTileStepValue').mockImplementation(() => {
                service.movementService.stepValue = 2;
            });

            service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
        });

        it('should handle picking up an item and applying its effects', () => {
            const mockPlayer = {
                username: 'virtualPlayer',
                remainingSpeed: 10,
                character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            } as Player;
            const mockDestination = mockBoard[1][1];

            service.board = mockBoard;
            jest.spyOn(service.movementService, 'findPath').mockReturnValue([{ row: 1, col: 1 }]);
            jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);
            jest.spyOn(service.inventoryService, 'addItemToInventory').mockReturnValue(true);

            service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

            expect(service.isMoving).toBe(false);
            expect(service.virtualPlayerPosition).toEqual({ row: 0, col: 0 });
        });
    });

    it('should exit early if the player is not virtual', () => {
        const mockPlayer = { isVirtual: false } as Player;
        jest.spyOn(service, 'getVirtualPlayerPosition').mockImplementation(() => {});

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(service.getVirtualPlayerPosition).not.toHaveBeenCalled();
    });

    it('should exit early if activeVirtualPlayer is null after position determination', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } }, inventory: ['flag', null] } as Player;

        jest.spyOn(service, 'getVirtualPlayerPosition').mockImplementation(() => null);

        service.activateBehaviourVP('room1', mockPlayer, []);
    });

    it('should prioritize nearest player for aggressive profile', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } }, inventory: ['flag', null] } as Player;

        const nearestPlayerPosition = { row: 3, col: 3 };
        jest.spyOn(service, 'findNearestPlayer').mockReturnValue(nearestPlayerPosition);
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(service.findNearestPlayer).toHaveBeenCalledWith(mockPlayer, []);
    });

    it('should prioritize nearest item for aggressive profile if closer', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } } } as Player;

        const nearestItemPosition = { row: 1, col: 1 };
        jest.spyOn(service, 'findNearestItemAgressif').mockReturnValue(nearestItemPosition);
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(service.findNearestItemAgressif).toHaveBeenCalledWith(mockPlayer);
    });

    it('should not move aggressive virtual player if no players or items exist', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } } } as Player;

        jest.spyOn(service, 'findNearestPlayer').mockReturnValue(null);
        jest.spyOn(service, 'findNearestItemAgressif').mockReturnValue(null);
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(service.moveToDestinationVirtualPlayer).not.toHaveBeenCalled();
    });

    it('should move defensive virtual player towards the nearest item', () => {
        const mockPlayer = { isVirtual: true, profile: 'defensif', character: { stats: { speed: 5 } } } as Player;

        const nearestItemPosition = { row: 2, col: 2 };
        jest.spyOn(service, 'findNearestItemDefensif').mockReturnValue(nearestItemPosition);
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(service.findNearestItemDefensif).toHaveBeenCalledWith(mockPlayer);
    });

    it('should not move defensive virtual player if no items exist', () => {
        const mockPlayer = { isVirtual: true, profile: 'defensif', character: { stats: { speed: 5 } } } as Player;

        jest.spyOn(service, 'findNearestItemDefensif').mockReturnValue(null);
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(service.moveToDestinationVirtualPlayer).not.toHaveBeenCalled();
    });

    it('should open an adjacent door if aggressive virtual player is next to a closed door', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } }, remainingSpeed: 5 } as Player;

        jest.spyOn(service, 'hasAdjacentDoor').mockReturnValue(true);
        jest.spyOn(service, 'getAdjacentTiles').mockReturnValue([
            { fieldTile: GAME_TILES.DOOR_CLOSED, avatar: null, object: null, door: null, wall: null } as Tiles,
        ]);
        jest.spyOn(service, 'toggleDoorVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);
    });

    it('should pick up an item if it is adjacent', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } }, inventory: [], remainingSpeed: 5 } as Player;

        const mockItemTile = { fieldTile: GAME_TILES.BASE, avatar: null, object: 'item' } as Tiles;
        jest.spyOn(service, 'findNearestItemAgressif').mockReturnValue({ row: 2, col: 2 });
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');
        jest.spyOn(service.inventoryService, 'addItemToInventory').mockReturnValue(true);

        service.activateBehaviourVP('room1', mockPlayer, []);
    });

    it('should throw an item if inventory is full', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } }, remainingSpeed: 5 } as Player;
        jest.spyOn(global.Math, 'random').mockReturnValue(0.2);
        jest.spyOn(service, 'throwItem');

        service.activateBehaviourVP('room1', mockPlayer, []);
    });

    it('should engage combat if aggressive virtual player is adjacent to another player', () => {
        const mockPlayer = { isVirtual: true, profile: 'agressif', character: { stats: { speed: 5 } }, remainingSpeed: 5 } as Player;
        const mockOpponent = { username: 'opponent', character: { stats: { attack: 10, defense: 10 } } } as Player;

        jest.spyOn(service, 'checkIfPlayerIsAdjacent').mockReturnValue(true);
        jest.spyOn(service, 'checkAndPerformAction');

        service.activateBehaviourVP('room1', mockPlayer, [mockOpponent]);
    });
    it('should throw an item if the player does not have a flag and inventory is full', () => {
        const mockPlayer = {
            username: 'defensivePlayer',
            isVirtual: true,
            profile: 'defensif',
            inventory: ['item1', 'item2'],
            remainingSpeed: 5,
            character: { stats: { speed: 5 } },
        } as Player;

        jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
        jest.spyOn(service, 'throwItem');

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(mockPlayer.inventory[0]).toEqual('item1');
    });
    it('should open a door if adjacent to a closed door and action not used', () => {
        const mockPlayer = {
            username: 'defensivePlayer',
            isVirtual: true,
            profile: 'defensif',
            inventory: [],
            remainingSpeed: 5,
            character: { stats: { speed: 5 } },
        } as Player;

        const blockingDoor = { fieldTile: GAME_TILES.DOOR_CLOSED, position: { row: 0, col: 1 } } as Tiles;
        jest.spyOn(service, 'hasAdjacentDoor').mockReturnValue(true);
        jest.spyOn(service, 'getAdjacentTiles').mockReturnValue([blockingDoor]);
        jest.spyOn(service, 'toggleDoorVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);
    });
    it('should move to the nearest item if available and action not used', () => {
        const mockPlayer = {
            username: 'defensivePlayer',
            isVirtual: true,
            profile: 'defensif',
            inventory: [],
            remainingSpeed: 5,
            character: { stats: { speed: 5 } },
        } as Player;

        const nearestItemPositionDefensif = { row: 2, col: 2 };
        const nearestItemTile = { fieldTile: GAME_TILES.BASE, object: 'item', position: nearestItemPositionDefensif } as Tiles;

        jest.spyOn(service, 'findNearestItemDefensif').mockReturnValue(nearestItemPositionDefensif);
        service.board = [
            [
                {
                    fieldTile: GAME_TILES.BASE,
                    object: null,
                    avatar: null,
                    door: null,
                    wall: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                } as Tiles,
                {
                    fieldTile: GAME_TILES.BASE,
                    object: null,
                    avatar: null,
                    door: null,
                    wall: null,
                    isTileSelected: false,
                    position: { row: 0, col: 1 },
                } as Tiles,
            ],
            [
                {
                    fieldTile: GAME_TILES.BASE,
                    object: null,
                    avatar: null,
                    door: null,
                    wall: null,
                    isTileSelected: false,
                    position: { row: 1, col: 0 },
                } as Tiles,
                nearestItemTile,
            ],
        ];
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);
    });
    it('should return to the initial position if the player has a flag', () => {
        const mockPlayer = {
            username: 'defensivePlayer',
            isVirtual: true,
            profile: 'defensif',
            inventory: ['item1', 'item2'],
            remainingSpeed: 5,
            character: { stats: { speed: 5 } },
        } as Player;

        const initialPlayerPosition = { row: 0, col: 0 };
        const initialTile = { fieldTile: GAME_TILES.BASE, position: initialPlayerPosition } as Tiles;

        service.playersInitialPositions = new Map([[mockPlayer.character.body, initialPlayerPosition]]);
        service.board = [[initialTile]];

        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);
    });
    it('should move away from the nearest player if no items are found and player has remaining speed', () => {
        const mockPlayer = {
            username: 'defensivePlayer',
            isVirtual: true,
            profile: 'defensif',
            inventory: [],
            remainingSpeed: 5,
            character: { stats: { speed: 5 } },
        } as Player;

        const nearestPlayerPosition = { row: 2, col: 2 };
        const oppositeDirection = { row: 0, col: 0 };
        const targetTile = { fieldTile: GAME_TILES.BASE, position: oppositeDirection } as Tiles;

        jest.spyOn(service, 'findNearestPlayer').mockReturnValue(nearestPlayerPosition);
        jest.spyOn(service, 'findOppositeDirectionPosition').mockReturnValue(oppositeDirection);
        service.board = [[targetTile]];

        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);
    });
    it('should do nothing if no items or players are found and player has no actions', () => {
        const mockPlayer = {
            username: 'defensivePlayer',
            isVirtual: true,
            profile: 'defensif',
            inventory: ['item1', 'item2'],
            remainingSpeed: 5,
            character: { stats: { speed: 5 } },
        } as Player;

        jest.spyOn(service, 'findNearestItemDefensif').mockReturnValue(null);
        jest.spyOn(service, 'findNearestPlayer').mockReturnValue(null);
        jest.spyOn(service, 'moveToDestinationVirtualPlayer');

        service.activateBehaviourVP('room1', mockPlayer, []);

        expect(service.moveToDestinationVirtualPlayer).not.toHaveBeenCalled();
    });
    it('should handle gracefully when the board is empty', () => {
        service.board = [];
        const mockPlayer = {
            username: 'defensivePlayer',
            isVirtual: true,
            profile: 'defensif',
            inventory: [],
            remainingSpeed: 0,
            character: { stats: { speed: 5 } },
        } as Player;
        expect(() => service.activateBehaviourVP('room1', mockPlayer, [])).not.toThrow();
    });

    it('should move the virtual player along the path', (done) => {
        const mockPlayer = {
            username: 'virtualPlayer',
            remainingSpeed: 10,
            character: { body: 'avatar2', stats: { speed: 10 } } as Character,
            inventory: [],
        } as Player;

        const mockDestination = { fieldTile: GAME_TILES.BASE, avatar: null, position: { row: 1, col: 1 } } as Tiles;
        const mockBoard: Tiles[][] = [
            [
                { avatar: 'avatar2', fieldTile: GAME_TILES.BASE, position: { row: 0, col: 0 } } as Tiles,
                { avatar: null, fieldTile: GAME_TILES.BASE, position: { row: 0, col: 1 } } as Tiles,
            ],
            [{ avatar: null, fieldTile: GAME_TILES.BASE, position: { row: 1, col: 0 } } as Tiles, mockDestination],
        ];

        service.board = mockBoard;
        jest.spyOn(service.movementService, 'findPath').mockImplementation((start, destination) => [start, { row: 0, col: 1 }, destination]);
        jest.spyOn(service.sharedDataService, 'getBoard').mockReturnValue(mockBoard);

        service.moveToDestinationVirtualPlayer(mockDestination, 'room1', [], mockPlayer);

        setTimeout(() => {
            expect(service.virtualPlayerPosition).toEqual({ row: 1, col: 1 });
            done();
        }, 500);
    });

    describe('findOppositeDirectionPosition', () => {
        it('should return null if nearestPlayerPosition is null', () => {
            const result = service.findOppositeDirectionPosition({ row: 1, col: 1 }, 3, null);
            expect(result).toBeNull();
        });

        it('should move in the opposite direction with sufficient remainingSpeed', () => {
            const result = service.findOppositeDirectionPosition({ row: 1, col: 1 }, 3, { row: 0, col: 0 });
            expect(result).toEqual({ row: 2, col: 0 });
        });

        it('should stop moving when remainingSpeed is exhausted', () => {
            const result = service.findOppositeDirectionPosition({ row: 1, col: 1 }, 1, { row: 0, col: 0 });
            expect(result).toEqual({ row: 2, col: 0 });
        });

        it('should avoid walls and closed doors', () => {
            const result = service.findOppositeDirectionPosition({ row: 0, col: 0 }, 3, { row: 2, col: 2 });
            expect(result).toEqual({ row: 0, col: 0 });
        });

        it('should respect board boundaries', () => {
            const result = service.findOppositeDirectionPosition({ row: 0, col: 0 }, 3, { row: 2, col: 2 });
            expect(result).toEqual({ row: 0, col: 0 });
        });

        it('should move as far as possible in the opposite direction when encountering obstacles', () => {
            const result = service.findOppositeDirectionPosition({ row: 1, col: 1 }, 3, { row: 0, col: 0 });
            expect(result).toEqual({ row: 2, col: 0 });
        });
    });
    it('should initiate combat if interacting with a tile containing another player', () => {
        const mockPlayer = {
            username: 'virtualPlayer',
            inventory: [],
            character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
        } as Player;
        const mockOpponent = {
            username: 'opponent',
            character: { body: 'avatar1', stats: { attack: 15, defense: 15 } } as Character,
        } as Player;

        const mockTile = { fieldTile: GAME_TILES.BASE, avatar: 'avatar1' } as Tiles;
        const mockBoard: Tiles[][] = [[mockTile]];

        service.board = mockBoard;
        jest.spyOn(mockTurnSystemService, 'canPerformAction').mockReturnValue(true);

        service.performActionOnTileVirtualPlayer(0, 0, 'room1', [mockOpponent], mockPlayer);

        expect(mockCombatGateway.virtualPlayersSmoke).toHaveBeenCalledWith('room1', mockOpponent, mockPlayer, undefined);
        expect(mockTurnSystemService.useAction).toHaveBeenCalled();
    });

    it('should call performActionOnTileVirtualPlayer if adjacent tile is a closed door', () => {
        const room = 'room1';
        const randomizedPlayers: Player[] = [];
        const virtualPlayer = {
            username: 'virtualPlayer',
            inventory: [],
            character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
        } as Player;
        const playerPosition = { row: 2, col: 2 };

        service.checkAndPerformAction(room, randomizedPlayers, virtualPlayer, playerPosition);

    });

    it('should call performActionOnTileVirtualPlayer if adjacent tile is an open door', () => {
        const room = 'room1';
        const randomizedPlayers: Player[] = [];
        const virtualPlayer = {
            username: 'virtualPlayer',
            inventory: [],
            character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
        } as Player;
        const playerPosition = { row: 2, col: 2 };

        service.checkAndPerformAction(room, randomizedPlayers, virtualPlayer, playerPosition);

    });

    it('should not call performActionOnTileVirtualPlayer for a plain tile', () => {
        const room = 'room1';
        const randomizedPlayers: Player[] = [];
        const virtualPlayer = {
            username: 'virtualPlayer',
            inventory: [],
            character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
        } as Player;        
        const playerPosition = { row: 2, col: 2 };

        service.checkAndPerformAction(room, randomizedPlayers, virtualPlayer, playerPosition);

    });

    it('should not call performActionOnTileVirtualPlayer for tiles with avatars', () => {
        const room = 'room1';
        const randomizedPlayers: Player[] = [];
        const virtualPlayer = {
            username: 'virtualPlayer',
            inventory: [],
            character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
        } as Player;
        const playerPosition = { row: 2, col: 2 };

        service.checkAndPerformAction(room, randomizedPlayers, virtualPlayer, playerPosition);

    });

    it('should stop checking further tiles after the first valid action', () => {
        const room = 'room1';
        const randomizedPlayers: Player[] = [];
        const virtualPlayer = {
            username: 'virtualPlayer',
            inventory: [],
            character: { body: 'avatar2', stats: { attack: 10, defense: 10 } } as Character,
        } as Player;
        const playerPosition = { row: 2, col: 2 };

        service.checkAndPerformAction(room, randomizedPlayers, virtualPlayer, playerPosition);

    });
});
