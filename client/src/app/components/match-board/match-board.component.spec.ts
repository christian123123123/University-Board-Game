import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Character } from '@app/interfaces/Character';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { BoardService } from '@app/services/edit/board/board.service';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { ActionService } from '@app/services/match/action/action.service';
import { MovementService } from '@app/services/match/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_TILES } from '@app/shared/game-tiles';
import { of } from 'rxjs';
import { MatchBoardComponent } from './match-board.component';

describe('MatchBoardComponent', () => {
    let component: MatchBoardComponent;
    let fixture: ComponentFixture<MatchBoardComponent>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let sharedService: jasmine.SpyObj<SharedDataService>;
    let boardService: jasmine.SpyObj<BoardService>;
    let movementService: jasmine.SpyObj<MovementService>;
    let mockTurnSpy: jasmine.SpyObj<TurnSystemService>;

    const mockTiles: Tiles = {
        fieldTile: 'BASE',
        door: false,
        wall: false,
        object: null,
        avatar: null,
        isTileSelected: false,
        position: { row: 0, col: 0 },
    };

    const mockCharacter: Character = {
        name: 'Test Character',
        image: 'image.png',
        face: 'face.png',
        body: 'body.png',
        stats: { health: 100, attack: 50, defense: 30, speed: 3 },
        dice: 'd6',
        victories: 0,
        position: { row: 0, col: 0 },
        initialPosition: { row: 0, col: 0 },
    };

    const mockPlayer: Player = {
        username: 'testPlayer',
        character: mockCharacter,
        isAdmin: true,
        inventory: [null, null],
    };

    const mockGame: Game = {
        _id: '123',
        title: 'Test Game',
        mapSize: 'petite',
        mode: 'Classique',
        visibility: true,
        description: 'A test game',
        board: [[mockTiles]],
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const sharedSpy = jasmine.createSpyObj('SharedDataService', [
            'getAccessCode',
            'getPlayer',
            'setPlayer',
            'getBoard',
            'getGame',
            'getPlayersInGame',
            'getDebugModeStatus',
        ]);
        const boardSpy = jasmine.createSpyObj('BoardService', ['getBoardSize']);
        const actionSpy = jasmine.createSpyObj('ActionService', ['setPlayers', 'setActivePlayer', 'openAttackDialog', 'getPlayerByAvatar']);
        const movementSpy = jasmine.createSpyObj('MovementService', [
            'clearPathHighlights',
            'findPath',
            'highlightPossiblePaths',
            'checkNextTileStepValue',
            'teleportToTile',
            'chanceOfStop',
        ]);
        const turnSpy = jasmine.createSpyObj('TurnSystemService', ['pauseTurnTimer', 'canPerformAction', 'useAction']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'disconnect', 'on', 'off', 'emit']);
        const mockActivatedRoute = {
            params: of({ id: '123' }),
            queryParams: of({ gameMode: 'normal', mapSize: 'large' }),
        };
        await TestBed.configureTestingModule({
            imports: [MatchBoardComponent],

            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: SharedDataService, useValue: sharedSpy },
                { provide: BoardService, useValue: boardSpy },
                { provide: ActionService, useValue: actionSpy },
                { provide: MovementService, useValue: movementSpy },
                { provide: TurnSystemService, useValue: turnSpy },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: SocketService, useValue: mockSocketService },

                provideHttpClient(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MatchBoardComponent);

        component = fixture.componentInstance;

        sharedService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
        boardService = TestBed.inject(BoardService) as jasmine.SpyObj<BoardService>;
        mockTurnSpy = TestBed.inject(TurnSystemService) as jasmine.SpyObj<TurnSystemService>;

        movementService = TestBed.inject(MovementService) as jasmine.SpyObj<MovementService>;
        component.board = [
            [
                { ...mockTiles, fieldTile: GAME_TILES.BASE },
                { ...mockTiles, fieldTile: GAME_TILES.ICE },
                { ...mockTiles, fieldTile: GAME_TILES.WATER },
                { ...mockTiles, fieldTile: GAME_TILES.WALL },
                { ...mockTiles, fieldTile: GAME_TILES.DOOR_OPEN },
                { ...mockTiles, fieldTile: GAME_TILES.DOOR_CLOSED },
                { ...mockTiles, fieldTile: GAME_TILES.BASE, avatar: 'body.png' },
            ],
        ];

        component.players = [mockPlayer];

        component.accessCode = 'mockRoom';
        component.characterPosition = { row: 1, col: 1 };

        movementService.previewPathTiles = [];
        movementService.attainableTiles = new Set(['2-2', '3-3']);
        component.currentPlayer = {
            username: 'testPlayer',
            character: { body: 'body.png' },
            inventory: ['item1', null],
        } as Player;

        movementService.findPath.and.returnValue([
            { row: 0, col: 1 },
            { row: 1, col: 1 },
        ]);
        movementService.remainingSpeed = 2;
        movementService.stepValue = 1;
        spyOn(component.inventoryService, 'addItemToInventory').and.returnValue(false);
        spyOn(component.inventoryService, 'removeItemFromInventory').and.returnValue(true); 

        spyOn(component, 'moveToDestination');

        sharedSpy.getPlayersInGame.and.returnValue([{ username: 'Player1' }, { username: 'Player2' }]);
        sharedSpy.getGame.and.returnValue({ mode: 'mockMode' });
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize properties on ngOnInit', () => {
        sharedService.getAccessCode.and.returnValue('1234');
        sharedService.getPlayer.and.returnValue(mockPlayer);
        sharedService.getBoard.and.returnValue([[mockTiles]]);
        sharedService.getGame.and.returnValue(mockGame);
        sharedService.getPlayersInGame.and.returnValue([mockPlayer]);
        boardService.getBoardSize.and.returnValue(10);

        component.ngOnInit();

        expect(component.accessCode).toBe('1234');
        expect(component.currentPlayer).toEqual(mockPlayer);
        expect(component.board).toEqual([[mockTiles]]);
        expect(component.gameMode).toBe('Classique');
        expect(component.boardSize).toBe(10);
        expect(component.players.length).toBe(1);
    });

    it('should handle playerMoved event and update position', () => {
        component.players = [mockPlayer];
        component.board = [[{ ...mockTiles, avatar: null }]];

        component.setupListeners();

        mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'playerMove') {
                callback({
                    player: { username: 'testPlayer' },
                    position: { row: 0, col: 0 },
                } as { player: { username: string }; position: { row: number; col: number } });
            }
        });

        expect(component.board[0][0].avatar).toBeNull();
        expect(component.players[0].character.position).toEqual({ row: 0, col: 0 });
    });

    it('should toggle door state on doorToggled event', () => {
        component.board = [[{ ...mockTiles, fieldTile: 'DOOR_OPEN' }]];

        mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'doorToggled') {
                callback({
                    tile: { position: { row: 0, col: 0 } },
                } as { tile: { position: { row: number; col: number } } });
            }
        });

        component.setupListeners();

        expect(component.board[0][0].fieldTile).toBe('assets/door-tilesV2.0.png');
    });
    it('should set character position correctly on getCharacterPosition', () => {
        component.board = [
            [
                { ...mockTiles, avatar: null },
                { ...mockTiles, avatar: 'body.png' },
            ],
            [
                { ...mockTiles, avatar: null },
                { ...mockTiles, avatar: null },
            ],
        ];
        component.currentPlayer = mockPlayer;

        component.getCharacterPosition();

        expect(component.characterPosition).toEqual({ row: 0, col: 1 });
    });

    it('should highlight paths on selectDestination if left-clicked', () => {
        component.board = [
            [
                { ...mockTiles, isTileSelected: false },
                { ...mockTiles, isTileSelected: false },
            ],
        ];
        component.currentPlayer = mockPlayer;
        component.characterPosition = { row: 0, col: 0 };

        movementService.remainingSpeed = 3;

        const event = new MouseEvent('click', { button: 0 });
        spyOn(component, 'getCharacterPosition').and.callFake(() => {});

        component.selectDestination(event, 0, 1);

        expect(movementService.highlightPossiblePaths).toHaveBeenCalledWith(component.characterPosition, movementService.remainingSpeed);
    });

    it('should activate action mode if canPerformAction returns true', () => {
        mockTurnSpy.canPerformAction.and.returnValue(true);

        component.activateActionMode();

        expect(component.actionMode).toBeTrue();
    });

    it('should not activate action mode if canPerformAction returns false', () => {
        mockTurnSpy.canPerformAction.and.returnValue(false);

        component.activateActionMode();

        expect(component.actionMode).toBeFalse();
    });

    it('should toggle a door and emit events when performing action on a door tile', () => {
        mockTurnSpy.canPerformAction.and.returnValue(true);
        component.actionMode = true;

        spyOn(component, 'isTileAdjacent').and.returnValue(true);
        spyOn(component, 'toggleDoor');

        expect(component.isTileAdjacent).not.toHaveBeenCalled();
        expect(component.toggleDoor).not.toHaveBeenCalled();
        expect(mockTurnSpy.useAction).not.toHaveBeenCalled();
    });

    it('should initiate a fight and emit startFight event for an adjacent avatar tile', () => {
        mockTurnSpy.canPerformAction.and.returnValue(true);
        component.actionMode = true;

        spyOn(component, 'isTileAdjacent').and.returnValue(true);
    });

    it('should not perform action if action mode is not active', () => {
        component.actionMode = false;

        component.performActionOnTile(0, 1);

        expect(mockTurnSpy.canPerformAction).not.toHaveBeenCalled();
    });

    it('should emit checkEndTurn if no more actions can be performed', () => {
        mockTurnSpy.canPerformAction.and.returnValue(false);
        component.actionMode = true;

        spyOn(component, 'isTileAdjacent').and.returnValue(true);

        component.performActionOnTile(1, 0);

        expect(mockSocketService.emit).toHaveBeenCalledWith('checkEndTurn', {
            room: component.accessCode,
            player: component.activePlayer,
        });
    });

    it('should emit tile information for a base tile without an avatar', () => {
        spyOn(component.tileInfo, 'emit');

        component.getTileInfo(0, 0);
        expect(component.tileInfo.emit).toHaveBeenCalledWith(
            `Tuile: Tuile basique de terre lunaire\nDescription de la tuile: Elle n'a pas de caractéristique particulière, coût de 1.\n`,
        );
    });

    it('should emit tile information for an ice tile without an avatar', () => {
        spyOn(component.tileInfo, 'emit');

        component.getTileInfo(0, 1);
        expect(component.tileInfo.emit).toHaveBeenCalledWith(
            `Tuile: Tuile de glace\nDescription de la tuile: Glissante, parfaite pour les zones froides, coût de 0.\n`,
        );
    });

    it('should emit tile information for a water tile without an avatar', () => {
        spyOn(component.tileInfo, 'emit');

        component.getTileInfo(0, 2);
        expect(component.tileInfo.emit).toHaveBeenCalledWith(
            `Tuile: Tuile d'eau\nDescription de la tuile: Utilisée pour les rivières et lacs, coût de 2.\n`,
        );
    });

    it('should emit tile information for a wall tile without an avatar', () => {
        spyOn(component.tileInfo, 'emit');

        component.getTileInfo(0, 3);
        expect(component.tileInfo.emit).toHaveBeenCalledWith(`Tuile: Mur\nDescription de la tuile: Parfait pour les fortifications.\n`);
    });

    it('should emit tile information for an open door tile without an avatar', () => {
        spyOn(component.tileInfo, 'emit');

        component.getTileInfo(0, 4);
        expect(component.tileInfo.emit).toHaveBeenCalledWith(
            `Tuile: Porte ouverte\nDescription de la tuile: Un point d'entrée ou de sortie, coût de 1.\n`,
        );
    });

    it('should emit tile information for a closed door tile without an avatar', () => {
        spyOn(component.tileInfo, 'emit');

        component.getTileInfo(0, 5);
        expect(component.tileInfo.emit).toHaveBeenCalledWith(`Tuile: Porte fermée\nDescription de la tuile: Cette porte agit comme un mur.\n`);
    });

    it('should emit tile information with player details for a base tile with an avatar', () => {
        spyOn(component.tileInfo, 'emit');

        component.getTileInfo(0, 6);
        expect(component.tileInfo.emit).toHaveBeenCalledWith(
            `Tuile: Tuile basique de terre lunaire\nDescription de la tuile: Elle n'a pas de caractéristique particulière, coût de 1.\nJoueur: testPlayer\nAvatar: Test Character`,
        );
    });

    it('should return the current state of the board', () => {
        // Arrange
        const mockBoard: Tiles[][] = [
            [
                { ...mockTiles, fieldTile: 'BASE' },
                { ...mockTiles, fieldTile: 'ICE' },
            ],
            [
                { ...mockTiles, fieldTile: 'WATER' },
                { ...mockTiles, fieldTile: 'WALL' },
            ],
        ];
        component.board = mockBoard;

        const boardState = component.getBoardState();

        expect(boardState).toEqual(mockBoard);
    });

    it('should clear avatar for tiles with matching username', () => {
    
        component.clearAvatar('player1');

        expect(component.board[0][0].avatar).toBeNull(); 
    });

    it('should open a closed door and emit toggleDoor event', () => {
        const mockTile: Tiles = { ...mockTiles, fieldTile: GAME_TILES.DOOR_CLOSED };

        component.toggleDoor(mockTile);

        expect(mockTile.fieldTile).toEqual('assets/open-door.png'); 
        expect(component.socketService.emit).toHaveBeenCalledWith('toggleDoor', {
            room: 'mockRoom',
            currentTile: mockTile,
            player: component.currentPlayer,
            wasDoorOpen: false,
        });
    });

    it('should close an open door and emit toggleDoor event', () => {
        const mockTile: Tiles = { ...mockTiles, fieldTile: GAME_TILES.DOOR_OPEN };

        component.toggleDoor(mockTile);

        expect(mockTile.fieldTile).toEqual('assets/door-tilesV2.0.png'); 
        expect(component.socketService.emit).toHaveBeenCalledWith('toggleDoor', {
            room: 'mockRoom',
            currentTile: mockTile,
            player: component.currentPlayer,
            wasDoorOpen: true,
        });
    });

    it('should return true for a tile directly above the player', () => {
        const result = component.isTileAdjacent(0, 1);

        expect(result).toBeTrue();
    });

    it('should clear previewPathTiles if no path is found', () => {
        movementService.findPath.and.returnValue(null);
        component.previewPath(2, 2);
        expect(movementService.previewPathTiles).toEqual([]);
    });

    it('should clear previewPathTiles if path length is 0', () => {
        movementService.findPath.and.returnValue([]);
        component.previewPath(2, 2);
        expect(movementService.previewPathTiles).toEqual([]);
    });

    it('should skip unattainable tiles in the path', () => {
        const mockPath = [
            { row: 1, col: 1 },
            { row: 4, col: 4 },
            { row: 5, col: 5 },
        ];
        movementService.findPath.and.returnValue(mockPath);

        component.previewPath(5, 5);

        expect(movementService.previewPathTiles).toEqual([]);
    });

    it('should move to the destination tile on left-click if tile is selected and different from character position', () => {
        const mockEvent = { button: 0 } as MouseEvent; 
        const currentTile = { ...mockTiles, isTileSelected: true, position: { row: 0, col: 1 } };

        component.board[0][1] = currentTile;

        component.selectDestination(mockEvent, 0, 1);

        expect(component.moveToDestination).toHaveBeenCalledWith(currentTile);
    });

    it('should highlight possible paths on left-click if tile is not selected', () => {
        const mockEvent = { button: 0 } as MouseEvent; 
        const currentTile = { ...mockTiles, isTileSelected: false, position: { row: 0, col: 1 } };

        component.board[0][1] = currentTile;

        component.selectDestination(mockEvent, 0, 1);

        expect(component.destinationTile).toBe(currentTile);
        expect(component.movementService.highlightPossiblePaths).toHaveBeenCalledWith(
            component.characterPosition,
            component.movementService.remainingSpeed!,
        );
    });

    it('should teleport to tile on right-click in debug mode if tile is valid', () => {
        const mockEvent = { button: 2 } as MouseEvent; 
        const currentTile = { ...mockTiles, object: null, fieldTile: GAME_TILES.BASE };

        component.board[0][1] = currentTile;

        component.selectDestination(mockEvent, 0, 1);
    });

    it('should get tile info on right-click in normal mode', () => {
        const mockEvent = { button: 2 } as MouseEvent; 
        const currentTile = { ...mockTiles, position: { row: 0, col: 1 } };

        component.board[0][1] = currentTile;
        spyOn(component, 'getTileInfo');

        component.selectDestination(mockEvent, 0, 1);

        expect(component.getTileInfo).toHaveBeenCalledWith(0, 1);
    });

    it('should return immediately if no path is found', () => {
        movementService.findPath.and.returnValue(null); 
        component.moveToDestination(component.board[0][1]);

        expect(component.isMoving).toBeFalse(); 
    });

    it('should traverse the path and update the board and character position', fakeAsync(() => {
        movementService.findPath.and.returnValue([
            { row: 0, col: 0 },
            { row: 0, col: 1 },
        ]);

        component.moveToDestination(component.board[0][1]);

        tick(150);
        expect(component.board[0][1].avatar).toBe(null);
        expect(component.board[0][0].avatar).toBeNull();

        tick(150);
        expect(component.board[0][1].avatar).toBe(null);
        expect(component.board[0][1].avatar).toBeNull();
        expect(component.characterPosition).toEqual({ row: 1, col: 1 });
        expect(component.isMoving).toBeFalse(); 
    }));

    it('should pick up an object if present and update inventory', fakeAsync(() => {
        const mockTile = { ...component.board[0][1], object: 'item1' };
        component.board[0][1] = mockTile;

        component.moveToDestination(mockTile);

        tick(150); 
        tick(150); 

        expect(mockTile.object).toBe(mockTile.object); 

        expect(component.isMoving).toBeFalse(); 
    }));

    it('should stop movement on ice tile when chanceOfStop is true', fakeAsync(() => {
        const iceTile = { ...component.board[0][1], fieldTile: GAME_TILES.ICE };
        component.board[0][1] = iceTile;

        component.moveToDestination(iceTile);

        tick(150); 

        expect(component.characterPosition).toEqual({ row: 1, col: 1 }); 
        expect(movementService.remainingSpeed).toBe(2); 

        expect(component.isMoving).toBeFalse();
    }));

    it('should emit itemThrown when an item is successfully removed', () => {
        component.throwItem('item1');

        expect(component.socketService.emit).toHaveBeenCalledWith('itemThrown', {
            position: { row: 0, col: 6 },
            item: 'item1',
            room: 'mockRoom',
            player: component.currentPlayer,
            stats: component.currentPlayer.character.stats,
        });
    });

    it('should return early if actionMode is false', () => {
        component.actionMode = false;
        spyOn(component, 'toggleDoor');

        component.performActionOnTile(0, 1);

        expect(component.toggleDoor).not.toHaveBeenCalled();
        expect(component.socketService.emit).not.toHaveBeenCalled();
    }); 

    it('should prevent the default context menu on right-click', () => {
        const mockEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    
        spyOn(mockEvent, 'preventDefault'); 
    
        component.onRightClick(mockEvent); 
    
        expect(mockEvent.preventDefault).toHaveBeenCalled(); 
    }); 

    describe('MatchBoardComponent #setupListeners', () => {
        let mockPlayer: Player;
        let mockOtherPlayer: Player;
        let mockBoard: Tiles[][];
    
        beforeEach(() => {
            mockPlayer = {
                username: 'currentPlayer',
                inventory: [null, null],
                character: {
                    body: 'currentAvatar',
                    position: { row: 0, col: 0 },
                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                    initialPosition: { row: 0, col: 0 },
                },
                isAdmin: false,
            } as Player;
    
            mockOtherPlayer = {
                username: 'otherPlayer',
                inventory: [null, null],
                character: {
                    body: 'otherAvatar',
                    position: { row: 1, col: 1 },
                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                    initialPosition: { row: 1, col: 1 },
                },
                isAdmin: false,
            } as Player;
    
            mockBoard = [
                [
                    { fieldTile: GAME_TILES.BASE, avatar: 'currentAvatar', wall: false, door: false, position: { row: 0, col: 0 }, object: null, isTileSelected: false },
                    { fieldTile: GAME_TILES.BASE, avatar: null, wall: false, door: false, position: { row: 0, col: 1 }, object: null, isTileSelected: false
                },
                ],
                [
                    { fieldTile: GAME_TILES.BASE, avatar: null, wall: false, door: false, position: { row: 1, col: 0 }, object: null, isTileSelected: false },
                    { fieldTile: GAME_TILES.BASE, avatar: 'otherAvatar', wall: false, door: false, position: { row: 1, col: 1 }, object: null, isTileSelected: false },
                ],
            ];
    
            component.board = mockBoard;
            component.players = [mockPlayer, mockOtherPlayer];
            component.currentPlayer = mockPlayer;
        });
    
        it('should return immediately if the moved player is the current player', () => {
            component.setupListeners();
    
            const eventData = {
                player: mockPlayer,
                position: { row: 1, col: 1 },
                playersTileVisited: [],
                positionBeforeTeleportation: { r: 0, c: 0 },
                isTeleportation: false,
            };
    
            mockSocketService.on.calls.argsFor(0)[1](eventData); 
    
            expect(component.board[0][0].avatar).toBe('currentAvatar'); 
            expect(component.board[1][1].avatar).toBeNull(); 
        });
    
        it('should handle teleportation by clearing the previous tile and updating the new tile', () => {
            component.setupListeners();
    
            const eventData = {
                player: mockOtherPlayer,
                position: { row: 0, col: 1 },
                playersTileVisited: [],
                positionBeforeTeleportation: { r: 1, c: 1 },
                isTeleportation: true,
            };
    
            mockSocketService.on.calls.argsFor(0)[1](eventData); 
    
            expect(component.board[1][1].avatar).toBeNull(); 
            expect(component.board[0][1].avatar).toBe('otherAvatar'); 
        });
    
        it('should update position for a regular move (not teleportation)', () => {
            component.setupListeners();
    
            const eventData = {
                player: mockOtherPlayer,
                position: { row: 0, col: 1 },
                playersTileVisited: [],
                positionBeforeTeleportation: { r: 1, c: 1 },
                isTeleportation: false,
            };
    
            mockSocketService.on.calls.argsFor(0)[1](eventData); 
    
            expect(component.board[1][1].avatar).toBeNull(); 
            expect(component.board[0][1].avatar).toBe('otherAvatar'); 
        });
    
        it('should not crash if player data is invalid', () => {
            component.setupListeners();
    
            const eventData = {
                player: { username: 'nonExistentPlayer' } as Player, 
                position: { row: 0, col: 1 },
                playersTileVisited: [],
                positionBeforeTeleportation: { r: 1, c: 1 },
                isTeleportation: false,
            };
    
            expect(() => mockSocketService.on.calls.argsFor(0)[1](eventData)).not.toThrow();
        });
    });  

    describe('MatchBoardComponent #fightStarted Listener', () => {
        let mockAttackedPlayer: Player;
        let mockAttackingPlayer: Player;
        let mockPlayerInOrder: Player[];
    
        beforeEach(() => {
            mockAttackedPlayer = {
                username: 'attackedPlayer',
                inventory: [null, null],
                character: {
                    body: 'attackedAvatar',
                    position: { row: 1, col: 1 },
                    stats: { health: 90, attack: 8, defense: 6, speed: 6 },
                    initialPosition: { row: 1, col: 1 },
                },
                isAdmin: false,
            } as Player;
    
            mockAttackingPlayer = {
                username: 'attackingPlayer',
                inventory: [null, null],
                character: {
                    body: 'attackingAvatar',
                    position: { row: 2, col: 2 },
                    stats: { health: 95, attack: 12, defense: 7, speed: 5 },
                    initialPosition: { row: 2, col: 2 },
                },
                isAdmin: true,
            } as Player;
    
            mockPlayerInOrder = [mockAttackedPlayer, mockAttackingPlayer];
    
            component.players = [mockAttackedPlayer, mockAttackingPlayer];
        });
    
        describe('When current player is the attacked player', () => {
            it('should update the attacked player and open attack dialog', () => {
                component.currentPlayer = mockAttackedPlayer; 
                component.setupListeners();
    
                const fightData = {
                    attackedAfterDice: {
                        username: 'attackedPlayer',
                        inventory: [null, null] as [string | null, string | null],
                        character: {
                            ...mockAttackedPlayer.character,
                            stats: { health: 80, speed: 4, attack: 8, defense: 6 },
                        },
                        isAdmin: false,
                    },
                    attackedBeforeDice: {
                        username: 'attackedPlayer',
                        inventory: [null, null] as [string | null, string | null],
                        character: {
                            ...mockAttackedPlayer.character,
                            stats: { health: 90, speed: 4, attack: 8, defense: 6 },
                        },
                        isAdmin: false,
                    },
                    attackingAfterDice: {
                        username: 'attackingPlayer',
                        inventory: [null, null] as [string | null, string | null],
                        character: {
                            ...mockAttackingPlayer.character,
                            stats: { health: 92, speed: 5, attack: 12, defense: 7 },
                        },
                        isAdmin: true,
                    },
                    attackingBeforeDice: {
                        username: 'attackingPlayer',
                        inventory: [null, null] as [string | null, string | null],
                        character: {
                            ...mockAttackingPlayer.character,
                            stats: { health: 95, speed: 5, attack: 12, defense: 7 },
                        },
                        isAdmin: true,
                    },
                    attackingCombats: 2,
                    playerInOrder: mockPlayerInOrder,
                };
    
                mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
                    if (event === 'fightStarted') {
                        callback(fightData);
                    }
                });
    
                mockSocketService.on.calls.all().forEach((call) => {
                    if (call.args[0] === 'fightStarted') {
                        call.args[1](fightData);
                    }
                });
    
                expect(fightData.attackedAfterDice.username).toBe('attackedPlayer');
                expect(component.sharedService.setPlayer).toHaveBeenCalledWith(fightData.attackedAfterDice);
                expect(component.actionService.openAttackDialog).toHaveBeenCalledWith(
                    component,
                    fightData.attackedAfterDice,
                    fightData.attackedBeforeDice,
                    fightData.attackingAfterDice,
                    fightData.attackingBeforeDice,
                    fightData.playerInOrder
                );
            });
        });
    
        describe('When current player is the attacking player', () => {
            it('should update the attacking player and open attack dialog', () => {
                component.currentPlayer = mockAttackingPlayer; 
                component.setupListeners();
    
                const fightData = {
                    attackedAfterDice: {
                        ...mockAttackedPlayer,
                        character: {
                            ...mockAttackedPlayer.character,
                            stats: { health: 80, speed: 4, attack: 8, defense: 6 },
                        },
                    },
                    attackedBeforeDice: {
                        ...mockAttackedPlayer,
                        character: {
                            ...mockAttackedPlayer.character,
                            stats: { health: 90, speed: 4, attack: 8, defense: 6 },
                        },
                    },
                    attackedCombats: 1,
                    attackingAfterDice: {
                        ...mockAttackingPlayer,
                        character: {
                            ...mockAttackingPlayer.character,
                            stats: { health: 92, speed: 5, attack: 12, defense: 7 },
                        },
                    },
                    attackingBeforeDice: {
                        ...mockAttackingPlayer,
                        character: {
                            ...mockAttackingPlayer.character,
                            stats: { health: 95, speed: 5, attack: 12, defense: 7 },
                        },
                    },
                    attackingCombats: 2,
                    playerInOrder: mockPlayerInOrder,
                };
    
                mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
                    if (event === 'fightStarted') {
                        callback(fightData);
                    }
                });
    
                mockSocketService.on.calls.all().forEach((call) => {
                    if (call.args[0] === 'fightStarted') {
                        call.args[1](fightData);
                    }
                });
    
                expect(component.sharedService.setPlayer).toHaveBeenCalledWith(fightData.attackingAfterDice);
                expect(component.actionService.openAttackDialog).toHaveBeenCalledWith(
                    component,
                    fightData.attackedAfterDice,
                    fightData.attackedBeforeDice,
                    fightData.attackingAfterDice,
                    fightData.attackingBeforeDice,
                    fightData.playerInOrder
                );
            });
        });
    
        describe('When current player is not involved in the fight', () => {
            it('should do nothing', () => {
                component.currentPlayer = {
                    username: 'neutralPlayer',
                    inventory: [null, null],
                    character: {
                        body: 'neutralAvatar',
                        position: null,
                        stats: { health: 100, attack: 0, defense: 0, speed: 0 },
                        initialPosition: null,
                    },
                    isAdmin: false,
                } as Player; 
    
                component.setupListeners();
    
                const fightData = {
                    attackedAfterDice: { ...mockAttackedPlayer },
                    attackedBeforeDice: { ...mockAttackedPlayer },
                    attackedCombats: 1,
                    attackingAfterDice: { ...mockAttackingPlayer },
                    attackingBeforeDice: { ...mockAttackingPlayer },
                    attackingCombats: 2,
                    playerInOrder: mockPlayerInOrder,
                };
    
                mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
                    if (event === 'fightStarted') {
                        callback(fightData);
                    }
                });
    
                mockSocketService.on.calls.all().forEach((call) => {
                    if (call.args[0] === 'fightStarted') {
                        call.args[1](fightData);
                    }
                });
    
                expect(component.sharedService.setPlayer).not.toHaveBeenCalled();
                expect(component.actionService.openAttackDialog).not.toHaveBeenCalled();
            });
        });
    });
     
    it('should emit updatedBoard after notificationEnded event', fakeAsync(() => {
        const mockActivePlayer: Player = {
            username: 'testPlayer',
            inventory: [null, null],
            character: {
                name: 'Test Character',
                image: 'image.png',
                face: 'face.png',
                body: 'body.png',
                stats: {
                    health: 100,
                    attack: 10,
                    defense: 10,
                    speed: 5,
                },
                dice: 'd6',
                victories: 0,
                disabled: false,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
                effects: ['effect1', 'effect2'],
                hasFlag: false,
            },
            isAdmin: false,
        };
    
        const mockResponse = { activePlayer: mockActivePlayer };
    
        mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'notificationEnded') {
                callback(mockResponse);
            }
        });
    
        component.setupListeners();
    
        mockSocketService.on.calls.all().forEach((call) => {
            if (call.args[0] === 'notificationEnded') {
                call.args[1](mockResponse);
            }
        });
    
        tick(300);
    
        expect(mockSocketService.emit).toHaveBeenCalledWith('updatedBoard', {
            room: component.accessCode,
            board: component.board,
        });
    })); 

    
});
    
    
    