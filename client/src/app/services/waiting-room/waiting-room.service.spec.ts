import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { BoardService } from '@app/services/edit/board/board.service';
import { GamesService } from '@app/services/games/games.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { WaitingRoomService } from './waiting-room.service';

describe('WaitingRoomService', () => {
    let service: WaitingRoomService;
    let socketService: jasmine.SpyObj<SocketService>;
    let router: jasmine.SpyObj<Router>;
    let sharedService: jasmine.SpyObj<SharedDataService>;
    let boardService: jasmine.SpyObj<BoardService>;

    beforeEach(() => {
        const socketSpy = jasmine.createSpyObj('SocketService', ['emit', 'disconnect']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        const gamesServiceSpy = jasmine.createSpyObj('GamesService', ['']);
        const sharedServiceSpy = jasmine.createSpyObj('SharedDataService', [
            'getGame',
            'getAccessCode',
            'setAccessCode',
            'setBoard',
            'setPlayersInGame',
            'resetSharedServices',
        ]);
        const boardServiceSpy = jasmine.createSpyObj('BoardService', ['placePlayersOnBoard']);

        TestBed.configureTestingModule({
            providers: [
                WaitingRoomService,
                { provide: SocketService, useValue: socketSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: GamesService, useValue: gamesServiceSpy },
                { provide: SharedDataService, useValue: sharedServiceSpy },
                { provide: BoardService, useValue: boardServiceSpy },
            ],
        });

        service = TestBed.inject(WaitingRoomService);
        socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        sharedService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
        boardService = TestBed.inject(BoardService) as jasmine.SpyObj<BoardService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('#kickPlayer', () => {
        it('should emit "kickPlayer" event with room and player info', () => {
            const mockComponent = { accessCode: '12345' } as WaitingRoomPageComponent;
            const mockPlayer: Player = { username: 'testUser', character: { stats: { speed: 1 } }, isVirtual: undefined } as Player;

            service.kickPlayer(mockComponent, mockPlayer);

            expect(socketService.emit).toHaveBeenCalledWith('kickPlayer', {
                room: mockComponent.accessCode,
                player: mockPlayer,
                isVirtual: undefined,
            });
        });
    });

    describe('#isLobbyFull', () => {
        it('should return true if room is full based on game size', () => {
            const mockComponent = {
                accessCode: '12345',
                gameSize: 'petite',
                roomUsers: { ['12345']: [{}, {}] },
            } as unknown as WaitingRoomPageComponent;

            const result = service.isLobbyFull(mockComponent);

            expect(result).toBeTrue();
        });

        it('should return false if room is not full', () => {
            const mockComponent = {
                accessCode: '12345',
                gameSize: 'moyenne',
                roomUsers: { ['12345']: [{}, {}] },
            } as unknown as WaitingRoomPageComponent;

            const result = service.isLobbyFull(mockComponent);

            expect(result).toBeFalse();
        });
    });

    describe('#toggleAccessibility', () => {
        it('should emit "toggleAccessibility" event with room info', () => {
            const mockComponent = { accessCode: '12345' } as WaitingRoomPageComponent;
            service.toggleAccessibility(mockComponent);

            expect(socketService.emit).toHaveBeenCalledWith('toggleAccessibility', { room: mockComponent.accessCode });
        });
    });

    describe('#onPlayMatch', () => {
        it('should emit "startGame" event with updated board and players', () => {
            const mockComponent = {
                accessCode: '12345',
                roomUsers: {
                    ['12345']: [{ character: { stats: { speed: 2 } } }, { character: { stats: { speed: 1 } } }],
                },
            } as unknown as WaitingRoomPageComponent;

            const mockTile: Tiles = {
                fieldTile: 'mockTile',
                door: false,
                wall: false,
                object: null,
                avatar: 'mockAvatar',
                isTileSelected: false,
                position: { row: 0, col: 0 },
            };

            const initialBoard: Tiles[][] = [[mockTile]];

            const mockGame: Game = {
                _id: 'gameId',
                title: 'Test Game',
                mapSize: 'medium',
                mode: 'single-player',
                board: initialBoard,
                visibility: false,
                description: 'mockDescription',
                updatedAt: new Date(),
            };
            sharedService.getGame.and.returnValue(mockGame);
            boardService.placePlayersOnBoard.and.returnValue([[]]);

            service.onPlayMatch(mockComponent);

            expect(sharedService.getGame).toHaveBeenCalled();
            expect(boardService.placePlayersOnBoard).toHaveBeenCalled();
            expect(socketService.emit).toHaveBeenCalledWith('startGame', {
                room: mockComponent.accessCode,
                board: jasmine.any(Array),
                randomizedPlayers: jasmine.any(Array),
            });
        });
    });

    describe('#onLeaveMatch', () => {
        it('should emit "adminLeft" and disconnect if the player is an admin', () => {
            const mockComponent = {
                accessCode: '12345',
                player: { isAdmin: true },
            } as unknown as WaitingRoomPageComponent;

            service.onLeaveMatch(mockComponent);

            expect(socketService.emit).toHaveBeenCalledWith('adminLeft', { room: mockComponent.accessCode });
            expect(socketService.disconnect).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/home']);
        });

        it('should simply disconnect and navigate if the player is not an admin', () => {
            const mockComponent = {
                accessCode: '12345',
                player: { isAdmin: false },
            } as unknown as WaitingRoomPageComponent;

            service.onLeaveMatch(mockComponent);

            expect(socketService.disconnect).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/home']);
        });
    });

    describe('#isLobbyReady', () => {
        it('should return true when game size is "petite" and players count is exactly 2', () => {
            const mockComponent = {
                accessCode: '12345',
                gameSize: 'petite',
                roomUsers: { ['12345']: [{}, {}] },
            } as unknown as WaitingRoomPageComponent;

            const result = service.isLobbyReady(mockComponent);

            expect(result).toBeTrue();
        });

        it('should return true when game size is "moyenne" and players count is within 2 and 4', () => {
            const mockComponent = {
                accessCode: '12345',
                gameSize: 'moyenne',
                roomUsers: { ['12345']: [{}, {}, {}] },
            } as unknown as WaitingRoomPageComponent;

            const result = service.isLobbyReady(mockComponent);

            expect(result).toBeTrue();
        });

        it('should return true when game size is "grande" and players count is within 2 and 6', () => {
            const mockComponent = {
                accessCode: '12345',
                gameSize: 'grande',
                roomUsers: { ['12345']: [{}, {}, {}, {}, {}] },
            } as unknown as WaitingRoomPageComponent;

            const result = service.isLobbyReady(mockComponent);

            expect(result).toBeTrue();
        });

        it('should return false when players count is below minimum for each game size', () => {
            const mockComponentPetite = {
                accessCode: '12345',
                gameSize: 'petite',
                roomUsers: { ['12345']: [{}] },
            } as unknown as WaitingRoomPageComponent;

            const mockComponentMoyenne = {
                accessCode: '12345',
                gameSize: 'moyenne',
                roomUsers: { ['12345']: [{}] },
            } as unknown as WaitingRoomPageComponent;

            const mockComponentGrande = {
                accessCode: '12345',
                gameSize: 'grande',
                roomUsers: { ['12345']: [{}] },
            } as unknown as WaitingRoomPageComponent;

            expect(service.isLobbyReady(mockComponentPetite)).toBeFalse();
            expect(service.isLobbyReady(mockComponentMoyenne)).toBeFalse();
            expect(service.isLobbyReady(mockComponentGrande)).toBeFalse();
        });

        it('should return false when players count exceeds maximum for each game size', () => {
            const mockComponentMoyenne = {
                accessCode: '12345',
                gameSize: 'moyenne',
                roomUsers: { ['12345']: [{}, {}, {}, {}, {}] },
            } as unknown as WaitingRoomPageComponent;

            const mockComponentGrande = {
                accessCode: '12345',
                gameSize: 'grande',
                roomUsers: { ['12345']: [{}, {}, {}, {}, {}, {}, {}] },
            } as unknown as WaitingRoomPageComponent;

            expect(service.isLobbyReady(mockComponentMoyenne)).toBeFalse();
            expect(service.isLobbyReady(mockComponentGrande)).toBeFalse();
        });
    });
});
