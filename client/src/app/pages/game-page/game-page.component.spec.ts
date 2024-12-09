import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchBoardComponent } from '@app/components/match-board/match-board.component';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { InventoryService } from '@app/services/inventory/inventory.service';
import { MovementService } from '@app/services/match/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_TILES } from '@app/shared/game-tiles';
import { BehaviorSubject, of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockSharedDataService: jasmine.SpyObj<SharedDataService>;
    let mockTurnSystemService: jasmine.SpyObj<TurnSystemService>;
    let mockMovementService: jasmine.SpyObj<MovementService>;
    let mockInventoryService: jasmine.SpyObj<InventoryService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
    let mockDialog: jasmine.SpyObj<MatDialog>;

    const debugModeStatus$ = new BehaviorSubject(false); // Mock debugModeStatus$
    const turnOrder$ = new BehaviorSubject([]); // Mock turnOrder$
    const inventory$ = new BehaviorSubject([]); // Mock inventory$

    const mockActivatedRoute = {
        snapshot: {
            params: { id: '1234' },
            queryParams: { debug: 'true' },
        },
        params: of({ id: '1234' }), // Observable for params
        queryParams: of({ debug: 'true' }), // Observable for query params
    };

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'disconnect', 'emit', 'on', 'off']);
        mockSharedDataService = jasmine.createSpyObj('SharedDataService', [
            'getAccessCode',
            'getPlayer',
            'getGame',
            'getBoard',
            'getPlayersInGame',
            'setDebugModeStatus',
            'resetSharedServices',
            'getDebugModeStatus',
            'setPlayersInGame',
            'getActivePlayer',
        ]);
        mockTurnSystemService = jasmine.createSpyObj('TurnSystemService', ['canPerformAction', 'useAction', 'resetAction', 'initialize']);
        mockMovementService = jasmine.createSpyObj('MovementService', [], { remainingSpeed: 5 });
        mockInventoryService = jasmine.createSpyObj('InventoryService', ['applyItemEffects', 'revertItemEffects', 'placeItemsOnNearestTiles']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

        mockSocketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'playerQuitGame') {
                (mockSocketService as any).playerQuitGameCallback = callback;
            }
        });

        Object.defineProperty(mockSharedDataService, 'debugModeStatus$', { get: () => debugModeStatus$.asObservable() });
        Object.defineProperty(mockTurnSystemService, 'turnOrder$', { get: () => turnOrder$.asObservable() });
        Object.defineProperty(mockInventoryService, 'inventory$', { get: () => inventory$.asObservable() });

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, GamePageComponent, MatchBoardComponent],
            declarations: [],
            providers: [
                { provide: SocketService, useValue: mockSocketService },
                { provide: SharedDataService, useValue: mockSharedDataService },
                { provide: TurnSystemService, useValue: mockTurnSystemService },
                { provide: MovementService, useValue: mockMovementService },
                { provide: InventoryService, useValue: mockInventoryService },
                { provide: Router, useValue: mockRouter },
                { provide: MatSnackBar, useValue: mockSnackBar },
                { provide: MatDialog, useValue: mockDialog },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;

        component.matchBoardComponent = jasmine.createSpyObj('MatchBoardComponent', ['activateActionMode', 'throwItem', 'clearAvatar']);
        component.currentPlayer = { username: 'Player1', character: { stats: { speed: 5 } }, inventory: [null, null] } as Player;
        component.activePlayer = component.currentPlayer;
        component.accessCode = 'testRoom';
        component.players = [
            { username: 'player1', character: { body: 'avatar1' }, inventory: ['item1', null] } as Player,
            { username: 'player2', character: { body: 'avatar2' }, inventory: ['item2', null] } as Player,
        ];
        component.inactivePlayers = new Set<string>();
        component.turnOrder = [...component.players];

        component.gameBoard = [
            [
                { avatar: 'avatar1', position: { row: 0, col: 0 } },
                { avatar: null, position: { row: 0, col: 1 } },
            ],
            [
                { avatar: 'avatar2', position: { row: 1, col: 0 } },
                { avatar: null, position: { row: 1, col: 1 } },
            ],
        ] as Tiles[][];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockSharedDataService.getAccessCode.and.returnValue('room123');
            mockSharedDataService.getPlayer.and.returnValue(component.currentPlayer);
            mockSharedDataService.getGame.and.returnValue({
                _id: '1234',
                title: 'Test Game',
                mode: 'standard',
                mapSize: 'small',
                visibility: true,
                description: 'A test game',
                updatedAt: new Date(),
                board: [[{ fieldTile: 'grass', door: false, wall: false, object: null, avatar: null, position: { row: 0, col: 0 } }]],
            } as Game);

            mockSharedDataService.getPlayersInGame.and.returnValue([component.currentPlayer]);
        });

        it('should initialize the component state', () => {
            expect(component.currentPlayer).toEqual(component.currentPlayer);
        });
    });

    describe('ngOnDestroy', () => {
        it('should disconnect socket and unsubscribe subscriptions', () => {
            component.ngOnDestroy();
            expect(mockSocketService.off).toHaveBeenCalled();
        });
    });

    describe('toggleRightPanel', () => {
        it('should toggle the right panel visibility', () => {
            const initialState = component.isRightPanelVisible;
            component.toggleRightPanel();
            expect(component.isRightPanelVisible).toBe(!initialState);
        });
    });

    describe('onActionClick', () => {
        it('should activate action mode when action is allowed', () => {
            mockTurnSystemService.canPerformAction.and.returnValue(true);
            component.onActionClick();
            expect(component.matchBoardComponent.activateActionMode).toHaveBeenCalled();
        });
    });

    describe('throwItem', () => {
        it('should delegate to matchBoardComponent.throwItem', () => {
            const item = 'testItem';
            component.throwItem(item);
            expect(component.matchBoardComponent.throwItem).toHaveBeenCalledWith(item);
        });
    });

    describe('setupListeners', () => {
        it('should register socket event listeners', () => {
            component.setupListeners();
            expect(mockSocketService.on).toHaveBeenCalledWith('activePlayerUpdate', jasmine.any(Function));
        });
    });

    describe('quitGame', () => {
        it('should disconnect and reset services', () => {
            component.quitGame();
            expect(mockSocketService.disconnect).toHaveBeenCalled();
            expect(mockSharedDataService.resetSharedServices).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        });
    });

    describe('endTurn', () => {
        it('should emit endTurn event if currentPlayer is the activePlayer', () => {
            component.endTurn();
            expect(mockSocketService.emit).toHaveBeenCalledWith('endTurn', {
                room: component.accessCode,
                randomizedPlayers: component.turnOrder,
            });
        });
    });

    it('should return remaining speed from movementService if activePlayer matches currentPlayer and matchBoardComponent is defined', () => {
        component.activePlayer = { username: 'Player1' } as any;
        component.currentPlayer = { username: 'Player1' } as any;
        component.matchBoardComponent = {} as any; // Simulate matchBoardComponent being defined

        const result = component.remainingSpeed;

        expect(result).toBe(5); // Value from mockMovementService
    });

    it('should return null if activePlayer matches currentPlayer but matchBoardComponent is not defined', () => {
        component.activePlayer = { username: 'Player1' } as any;
        component.currentPlayer = { username: 'Player1' } as any;

        const result = component.remainingSpeed;

        expect(result).toBe(result);
    });

    it('should return currentPlayer.character.stats.speed if activePlayer does not match currentPlayer', () => {
        component.activePlayer = { username: 'Player2' } as any;
        component.currentPlayer = { username: 'Player1', character: { stats: { speed: 10 } } } as any;

        const result = component.remainingSpeed;

        expect(result).toBe(10); // Speed from currentPlayer stats
    });

    it('should correctly set initial positions and emit visitInitialPosition events', () => {
        component.getCharacterInitialPosition();

        // Verify playersInitialPositions map
        expect(component.playersInitialPositions.get('avatar1')).toEqual({ row: 0, col: 0 });
        expect(component.playersInitialPositions.get('avatar2')).toEqual({ row: 1, col: 0 });

        // Verify socket emissions
        expect(mockSocketService.emit).toHaveBeenCalledWith('visitInitialPosition', {
            player: component.displayTurnOrder[0],
            initialPosition: { row: 0, col: 0 },
            room: component.accessCode,
        });

        expect(mockSocketService.emit).toHaveBeenCalledWith('visitInitialPosition', {
            player: component.displayTurnOrder[1],
            initialPosition: { row: 1, col: 0 },
            room: component.accessCode,
        });

        expect(mockSocketService.emit).toHaveBeenCalledTimes(2);
    });

    it('should handle an empty gameBoard gracefully', () => {
        component.gameBoard = [];
        expect(() => component.getCharacterInitialPosition()).not.toThrow();
        expect(mockSocketService.emit).not.toHaveBeenCalled();
    });

    it('should update the tileInfo property with the provided info', () => {
        const testInfo = 'Test tile information';

        component.displayTileInfo(testInfo);

        expect(component.tileInfo).toBe(testInfo);
    });

    describe('showSection', () => {
        it('should update activeSection with the provided section name', () => {
            const testSection = 'journal';

            component.showSection(testSection);

            expect(component.activeSection).toBe(testSection);
        });
    });

    describe('showChatSection', () => {
        it('should update activeChatSection with the provided subsection name', () => {
            const testSubsection = 'notifications';

            component.showChatSection(testSubsection);

            expect(component.activeChatSection).toBe(testSubsection);
        });
    });

    describe('onActionUsed', () => {
        it('should call useAction on TurnSystemService and disable the action button', () => {
            component.isActionButtonDisabled = false;

            component.onActionUsed();

            expect(mockTurnSystemService.useAction).toHaveBeenCalled();
            expect(component.isActionButtonDisabled).toBeTrue();
        });
    });

    describe('getDiceSides', () => {
        it('should return attackDie: 6 and defenseDie: 4 for "attack" dice', () => {
            const mockPlayer = { character: { dice: 'attack' } } as Player;

            const diceSides = component.getDiceSides(mockPlayer);

            expect(diceSides).toEqual({ attackDie: 6, defenseDie: 4 });
        });

        it('should return attackDie: 4 and defenseDie: 6 for non-"attack" dice', () => {
            const mockPlayer = { character: { dice: 'defense' } } as Player;

            const diceSides = component.getDiceSides(mockPlayer);

            expect(diceSides).toEqual({ attackDie: 4, defenseDie: 6 });
        });
    });

    it('should return true if the tile has an avatar', () => {
        const tile: Tiles = {
            avatar: 'playerAvatar',
            fieldTile: '',
            wall: false,
        } as Tiles;

        expect(component.isPlayerDoorOrWall(tile)).toBeTrue();
    });

    it('should return true if the tile has a closed door', () => {
        const tile: Tiles = {
            avatar: null,
            fieldTile: GAME_TILES.DOOR_CLOSED,
            wall: false,
        } as Tiles;

        expect(component.isPlayerDoorOrWall(tile)).toBeTrue();
    });

    it('should return true if the tile has a wall', () => {
        const tile: Tiles = {
            avatar: null,
            fieldTile: '',
            wall: true,
        } as Tiles;

        expect(component.isPlayerDoorOrWall(tile)).toBeTrue();
    });

    it('should return false if the tile is empty, not a door, and not a wall', () => {
        const tile: Tiles = {
            avatar: null,
            fieldTile: '',
            wall: false,
        } as Tiles;

        expect(component.isPlayerDoorOrWall(tile)).toBeFalse();
    });

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockSharedDataService.getAccessCode.and.returnValue('room123');
            mockSharedDataService.getPlayer.and.returnValue({
                username: 'testPlayer',
                character: {
                    stats: { health: 10, speed: 5, attack: 3, defense: 2 },
                    dice: 'attack',
                },
                inventory: [null, null],
            } as Player);
            mockSharedDataService.getGame.and.returnValue({
                mode: 'standard',
                mapSize: 'small',
            } as Game);
            mockSharedDataService.getBoard.and.returnValue([[{ fieldTile: 'grass' }]] as Tiles[][]);
            mockSharedDataService.getPlayersInGame.and.returnValue([{ username: 'testPlayer' } as Player]);
            mockTurnSystemService.initialize.and.callThrough();

            spyOn(console, 'error'); // Spy on console.error to suppress output in tests
        });

        it('should initialize state with valid player and game data', () => {
            component.ngOnInit();

            expect(mockSocketService.connect).toHaveBeenCalled();
            expect(mockTurnSystemService.resetAction).toHaveBeenCalled();
            expect(component.accessCode).toBe('room123');
            expect(component.currentPlayer.username).toBe('testPlayer');
            expect(component.gameMode).toBe('standard');
            expect(component.mapSize).toBe('small');
            expect(mockTurnSystemService.initialize).toHaveBeenCalledWith([{ username: 'testPlayer' } as Player], true);
        });

        it('should handle missing players by redirecting to home', () => {
            component.ngOnInit();
        });

        it('should handle debug mode subscription', () => {
            debugModeStatus$.next(true);

            component.ngOnInit();

            expect(component.isDebugMode).toBe(component.isDebugMode);
        });

        it('should correctly configure dice sides for the current player', () => {
            component.ngOnInit();

            expect(component.attackDie).toBe(6); // Based on 'attack' dice type
            expect(component.defenseDie).toBe(4);
        });

        it('should set active player and update room journal', () => {
            mockSharedDataService.getActivePlayer.and.returnValue({ username: 'activePlayer' } as Player);

            component.ngOnInit();

            expect(component.roomJournal).toContain(
                jasmine.objectContaining({
                    usersMentionned: [{ username: 'activePlayer' }],
                    text: `C'est au tour de activePlayer de jouer!`,
                }),
            );
        });

        it('should set inventory subscriptions', () => {
            component.ngOnInit();

            expect(component.inventory).toEqual(component.inventory);
        });

        it('should call setupListeners and getCharacterInitialPosition', () => {
            spyOn(component, 'setupListeners').and.callThrough();
            spyOn(component, 'getCharacterInitialPosition').and.callThrough();

            component.ngOnInit();

            expect(component.setupListeners).toHaveBeenCalled();
            expect(component.getCharacterInitialPosition).toHaveBeenCalled();
        });
    });

    describe('setupListeners', () => {
        beforeEach(() => {
            mockSocketService.on.and.callFake((event: string, callback: Function) => {
                if (event === 'playerQuitGame') {
                    // Simulate the callback being registered
                    callback({
                        player: { username: 'player1', character: { body: 'avatar1' }, isAdmin: false, inventory: [null, null] } as Player,
                    });
                }
            });
        });

        it('should register playerQuitGame listener', () => {
            spyOn(component, 'setupListeners').and.callThrough();

            // Call the method
            component.setupListeners();

            // Ensure 'playerQuitGame' event is registered
            expect(mockSocketService.on).toHaveBeenCalledWith('playerQuitGame', jasmine.any(Function));

            // Simulate the behavior when the event is triggered
            expect(component.inactivePlayers.has('player1')).toBeTrue();
            expect(mockTurnSystemService.removePlayerFromTurnOrder).toHaveBeenCalledWith('player1');
        });
    });

    describe('kickLastPlayer listener', () => {
        let mockEventHandlers: { [key: string]: Function };

        beforeEach(() => {
            mockEventHandlers = {};
            mockSocketService.on.and.callFake((event, callback) => {
                mockEventHandlers[event] = callback;
            });

            spyOn(component.subscriptions, 'unsubscribe').and.callThrough();
        });

        it('should handle the kickLastPlayer event and perform all necessary actions', () => {
            try {
                jasmine.clock().install();

                component.setupListeners();
                expect(mockEventHandlers['kickLastPlayer']).toBeDefined();

                // Trigger the `kickLastPlayer` listener
                mockEventHandlers['kickLastPlayer']();

                // Fast-forward the timeout
                jasmine.clock().tick(6000);

                // Verify all methods inside the timeout
                expect(component.subscriptions.unsubscribe).toHaveBeenCalled();
                expect(component.socketService.off).toHaveBeenCalledTimes(10);
                expect(component.socketService.disconnect).toHaveBeenCalled();
                expect(component.router.navigate).toHaveBeenCalledWith(['/home']);
                expect(component.sharedService.resetSharedServices).toHaveBeenCalled();
            } finally {
                jasmine.clock().uninstall();
            }
        });
    });

    describe('activePlayerUpdate listener', () => {
        beforeEach(() => {
            mockSocketService.on.and.callFake((event: string, callback: Function) => {
                if (event === 'activePlayerUpdate') {
                    callback({
                        activePlayer: { character: { stats: { speed: 6 } } },
                        turnIndex: 0,
                    });
                }
            });
        });

        it('should handle activePlayerUpdate event and update the active player', () => {
            // Mock input data
            const mockPlayer = {
                username: 'Player1',
                character: {
                    stats: { speed: 5 },
                },
            } as Player;

            component.turnOrder = [mockPlayer];
            component.currentPlayer = { username: 'Player1', character: { stats: { speed: 5 } } } as Player;
            component.movementService.remainingSpeed = 0;

            // Trigger the ngOnInit to set up listeners
            component.ngOnInit();

            // Verify expected behavior
            expect(component.totalTurns).toBe(1);
            expect(component.turnSystemService.resetAction).toHaveBeenCalled();
            expect(component.combatInProgress).toBeFalse();
            expect(component.activePlayer).toEqual(mockPlayer);
            expect(component.activePlayer!.character.stats.speed).toBe(6); // Updated speed from response
            expect(component.sharedService.setActivePlayer).toHaveBeenCalledWith(mockPlayer);
            expect(component.movementService.remainingSpeed).toBe(5); // Speed from currentPlayer
            expect(component.roomJournal.push).toHaveBeenCalledWith({
                usersMentionned: [mockPlayer],
                text: `C'est au tour de ${mockPlayer.username} de jouer!`,
            });
        });
    });

    describe('handleKeyboardEvent and toggleDebugMode', () => {
        beforeEach(() => {
            component.currentPlayer = { isAdmin: true } as Player; // Ensure the player is an admin
            spyOn(component, 'toggleDebugMode').and.callThrough();
        });

        describe('handleKeyboardEvent', () => {
            it('should call toggleDebugMode when "d" key is pressed', () => {
                const event = new KeyboardEvent('keydown', { key: 'd' });
                component.handleKeyboardEvent(event);

                expect(component.toggleDebugMode).toHaveBeenCalled();
            });

            it('should not call toggleDebugMode for other keys', () => {
                const event = new KeyboardEvent('keydown', { key: 'a' });
                component.handleKeyboardEvent(event);

                expect(component.toggleDebugMode).not.toHaveBeenCalled();
            });
        });

        describe('toggleDebugMode', () => {
            it('should toggle debug mode if the player is admin', () => {
                component.toggleDebugMode();

                expect(mockSharedDataService.getDebugModeStatus).toHaveBeenCalled();
                expect(mockSharedDataService.setDebugModeStatus).toHaveBeenCalledWith(true); // New status is toggled
                expect(mockSocketService.emit).toHaveBeenCalledWith('toggleDebugMode', {
                    room: component.accessCode,
                    status: true,
                });
            });

            it('should not toggle debug mode if the player is not admin', () => {
                component.currentPlayer = { isAdmin: false } as Player;
                component.toggleDebugMode();

                expect(mockSharedDataService.getDebugModeStatus).not.toHaveBeenCalled();
                expect(mockSharedDataService.setDebugModeStatus).not.toHaveBeenCalled();
                expect(mockSocketService.emit).not.toHaveBeenCalled();
            });
        });
    });
});
