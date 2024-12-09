import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_TILES } from '@app/shared/game-tiles';
import { PostGamePageComponent } from './post-game-page.component';

describe('PostGamePageComponent', () => {
    let component: PostGamePageComponent;
    let fixture: ComponentFixture<PostGamePageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockSharedService: jasmine.SpyObj<SharedDataService>;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    const mockPlayers: Player[] = [
        {
            username: 'Player1',
            character: {
                name: 'Warrior',
                image: 'path/to/warrior/image.png',
                face: 'path/to/warrior/face.png',
                body: 'path/to/warrior/body.png',
                stats: { health: 100, attack: 20, defense: 15, speed: 10 }, // Assuming Stats has these fields
                dice: 'd20',
                victories: 5,
                position: { row: 0, col: 1 },
                initialPosition: { row: 0, col: 0 },
                effects: ['Boost', 'Shield'],
                hasFlag: true,
            },
            isAdmin: true,
            inventory: ['Sword', 'Shield'],
            profile: 'path/to/player1.png',
        },
        {
            username: 'Player2',
            character: {
                name: 'Mage',
                image: 'path/to/mage/image.png',
                face: 'path/to/mage/face.png',
                body: 'path/to/mage/body.png',
                stats: { health: 80, attack: 30, defense: 10, speed: 12 },
                dice: 'd10',
                victories: 3,
                position: { row: 1, col: 2 },
                initialPosition: { row: 1, col: 1 },
            },
            isAdmin: false,
            inventory: ['Staff', null],
        },
    ];

    const mockBoard: Tiles[][] = [
        [
            {
                fieldTile: 'EMPTY',
                door: false,
                wall: false,
                object: null,
                avatar: 'Player1',
                isTileSelected: false,
                position: { row: 0, col: 0 },
            },
            {
                fieldTile: GAME_TILES.DOOR_CLOSED,
                door: true,
                wall: false,
                object: null,
                avatar: null,
                isTileSelected: false,
                position: { row: 0, col: 1 },
            },
        ],
        [
            {
                fieldTile: 'WALL',
                door: false,
                wall: true,
                object: null,
                avatar: null,
                isTileSelected: false,
                position: { row: 1, col: 0 },
            },
            {
                fieldTile: GAME_TILES.DOOR_OPEN,
                door: true,
                wall: false,
                object: 'TreasureChest',
                avatar: 'Player2',
                isTileSelected: true,
                position: { row: 1, col: 1 },
            },
        ],
    ];

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'disconnect']);
        mockSharedService = jasmine.createSpyObj('SharedDataService', [
            'resetSharedServices',
            'getIsCTF',
            'getPlayersWithFlagMap',
            'getPlayersInGame',
            'getPlayer',
            'getVictoryMap',
            'getLossesMap',
            'getCombatMap',
            'getEscapeMap',
            'getPointsLostMap',
            'getPointsTakenMap',
            'getObjectsCountMap',
            'getTilesVisitedMap',
            'getTotalTurns',
            'getGameDuration',
            'getAccessCode',
            'getDoorsToggled',
            'getBoard',
            'getTotalTilesVisited',
        ]);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, PostGamePageComponent],
            declarations: [],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: SocketService, useValue: mockSocketService },
                { provide: SharedDataService, useValue: mockSharedService },
                { provide: MatDialog, useValue: mockDialog },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PostGamePageComponent);
        component = fixture.componentInstance;

        // Mock return values for shared service methods
        mockSharedService.getIsCTF.and.returnValue(false);
        mockSharedService.getPlayersWithFlagMap.and.returnValue(new Set());
        mockSharedService.getPlayersInGame.and.returnValue([]);
        mockSharedService.getPlayer.and.returnValue(mockPlayers[0]);
        mockSharedService.getVictoryMap.and.returnValue(
            new Map([
                ['Player1', 1],
                ['Player2', 2],
            ]),
        );
        mockSharedService.getLossesMap.and.returnValue(
            new Map([
                ['Player1', 2],
                ['Player2', 1],
            ]),
        );
        mockSharedService.getCombatMap.and.returnValue(
            new Map([
                ['Player1', 4],
                ['Player2', 4],
            ]),
        );
        mockSharedService.getEscapeMap.and.returnValue(
            new Map([
                ['Player1', 1],
                ['Player2', 0],
            ]),
        );
        mockSharedService.getPointsLostMap.and.returnValue(
            new Map([
                ['Player1', 12],
                ['Player2', 10],
            ]),
        );
        mockSharedService.getPointsTakenMap.and.returnValue(
            new Map([
                ['Player1', 10],
                ['Player2', 12],
            ]),
        );
        mockSharedService.getObjectsCountMap.and.returnValue(
            new Map([
                ['Player1', 1],
                ['Player2', 3],
            ]),
        );
        mockSharedService.getTilesVisitedMap.and.returnValue(new Map());
        mockSharedService.getTotalTurns.and.returnValue(0);
        mockSharedService.getGameDuration.and.returnValue({ minutes: 0, seconds: 0 });
        mockSharedService.getAccessCode.and.returnValue('');
        mockSharedService.getDoorsToggled.and.returnValue([]);
        mockSharedService.getBoard.and.returnValue([]);
        mockSharedService.getTotalTilesVisited.and.returnValue([]);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should initialize component and set values', () => {
            component.ngOnInit();
            fixture.detectChanges();
            expect(mockSocketService.connect).toHaveBeenCalled();
            expect(component.isCTFMode).toEqual(false);
            expect(component.players).toEqual([]);
            expect(component.player).toEqual(mockPlayers[0]);
            expect(component.playerVictories).toEqual(
                new Map([
                    ['Player1', 1],
                    ['Player2', 2],
                ]),
            );
            expect(component.playerLosses).toEqual(
                new Map([
                    ['Player1', 2],
                    ['Player2', 1],
                ]),
            );
            expect(component.playerCombats).toEqual(
                new Map([
                    ['Player1', 4],
                    ['Player2', 4],
                ]),
            );
            expect(component.playerEscape).toEqual(
                new Map([
                    ['Player1', 1],
                    ['Player2', 0],
                ]),
            );
            expect(component.playerHpLost).toEqual(
                new Map([
                    ['Player1', 12],
                    ['Player2', 10],
                ]),
            );
            expect(component.playerHpWon).toEqual(
                new Map([
                    ['Player1', 10],
                    ['Player2', 12],
                ]),
            );
        });

        it('should count doors correctly on the board', () => {
            component.board = mockBoard;
            component.ngOnInit();
            expect(component.doorsInBoard).toBe(0);
        });
    });

    describe('returnToHome', () => {
        it('should disconnect from socket and reset services', () => {
            component.returnToHome();
            expect(mockSocketService.disconnect).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
            expect(mockSharedService.resetSharedServices).toHaveBeenCalled();
        });
    });

    describe('sortTable', () => {
        it('should not modify sortedPlayers for invalid column name in sortTable method', () => {
            const players = [...mockPlayers];
            component.sortedPlayers = players;
            const invalidColumn = 'invalidColumnName';

            const initialPlayersState = [...component.sortedPlayers];

            component.sortTable(invalidColumn);

            expect(component.sortedPlayers).toEqual(initialPlayersState);
        });

        it('should toggle isAscending when sortTable is called twice for the same column', () => {
            expect(component.isAscending).toBe(true);

            const players = [...mockPlayers];
            component.sortedPlayers = players;

            component.sortTable('username');
            expect(component.isAscending).toBe(true);

            component.sortTable('username');
            expect(component.isAscending).toBe(false);
        });

        it('should set isAscending to true when sortTable is called for a new column', () => {
            const players = [...mockPlayers];
            component.sortedPlayers = players;

            component.sortTable('username');
            expect(component.isAscending).toBe(true);

            component.sortTable('username');
            expect(component.isAscending).toBe(false);
        });

        it('should sort players by username in ascending order', () => {
            const players = [...mockPlayers];
            component.sortedPlayers = players;
            component.sortTable('username');
            expect(component.sortedPlayers[0].username).toEqual('Player1');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by combats in ascending order', () => {
            const players = [...mockPlayers];
            component.sortedPlayers = players;
            component.playerCombats = new Map([
                ['Player1', 2],
                ['Player2', 4],
            ]);
            component.sortTable('combats');
            expect(component.sortedPlayers[0].username).toEqual('Player1');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by escapes in ascending order', () => {
            const players = [...mockPlayers];
            component.sortedPlayers = players;
            component.playerEscape = new Map([
                ['Player1', 1],
                ['Player2', 0],
            ]);
            component.sortTable('escapes');
            expect(component.sortedPlayers[0].username).toEqual('Player2');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by victories in ascending order', () => {
            const players = mockPlayers;
            component.sortedPlayers = players;
            component.playerVictories = new Map([
                ['Player1', 2],
                ['Player2', 1],
            ]);
            component.sortTable('victories');
            expect(component.sortedPlayers[0].username).toEqual('Player2');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by losses in ascending order', () => {
            const players = mockPlayers;
            component.sortedPlayers = players;
            component.playerLosses = new Map([
                ['Player1', 1],
                ['Player2', 2],
            ]);
            component.sortTable('losses');
            expect(component.sortedPlayers[0].username).toEqual('Player1');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by hpTaken in ascending order', () => {
            const players = mockPlayers;
            component.sortedPlayers = players;
            component.playerHpWon = new Map([
                ['Player1', 10],
                ['Player2', 12],
            ]);
            component.sortTable('hpTaken');
            expect(component.sortedPlayers[0].username).toEqual('Player1');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by hpLost in ascending order', () => {
            const players = mockPlayers;
            component.sortedPlayers = players;
            component.playerHpLost = new Map([
                ['Player1', 12],
                ['Player2', 10],
            ]);
            component.sortTable('hpLost');
            expect(component.sortedPlayers[0].username).toEqual('Player2');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by objects in ascending order', () => {
            const players = mockPlayers;
            component.sortedPlayers = players;
            component.playerObjectsCount = new Map([
                ['Player1', 1],
                ['Player2', 13],
            ]);
            component.sortTable('objects');
            expect(component.sortedPlayers[0].username).toEqual('Player1');
            expect(component.isAscending).toBeTrue();
        });

        it('should sort players by tilesVisited in ascending order', () => {
            const players = mockPlayers;
            component.sortedPlayers = players;
            component.playerTilesVisited = new Map([
                ['Player1', []],
                ['Player2', [{ row: 1, col: 2 }]],
            ]);
            component.sortTable('tilesVisited');
            expect(component.sortedPlayers[0].username).toEqual('Player1');
            expect(component.isAscending).toBeTrue();
        });
        it('should toggle sort direction if column is the same', () => {
            component.currentSortColumn = 'username';
            component.isAscending = true;
            component.sortTable('username');
            expect(component.isAscending).toBeFalse();
        });
    });

    describe('showChatSection', () => {
        it('should update activeChatSection', () => {
            component.showChatSection('history');
            expect(component.activeChatSection).toBe('history');
        });
    });
});
