import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { environment } from 'src/environments/environment';
import { GamesService } from './games.service';

describe('GamesService', () => {
    let service: GamesService;
    let httpMock: HttpTestingController;
    const apiUrl = environment.serverUrl + '/games';
    const mockTiles: Tiles[] = [
        {
            fieldTile: 'door',
            avatar: '',
            door: true,
            wall: false,
            object: 'apple',
            isTileSelected: false,
            position: { row: 2, col: 3 },
        },
        {
            fieldTile: 'wall',
            avatar: '',
            door: false,
            wall: true,
            object: 'banana',
            isTileSelected: false,
            position: { row: 4, col: 3 },
        },
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
        });
        service = TestBed.inject(GamesService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    it('should create a new game', () => {
        const mockGame: Game = {
            _id: '1',
            title: 'Jeu 1',
            mapSize: 'petite',
            mode: 'Classique',
            visibility: true,
            description: 'Description du jeu 1',
            board: [[mockTiles[0], mockTiles[1]]],
            updatedAt: new Date(),
        };

        const gameToCreate = {
            title: 'Jeu 1',
            mapSize: 'moyenne',
            mode: 'Classique',
            visibility: true,
            description: 'Description du jeu 1',
            board: [[mockTiles[0], mockTiles[1]]],
            updatedAt: new Date(),
            accessCode: '',
        };

        service.createGame(gameToCreate).subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${apiUrl}/create`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(gameToCreate);
        req.flush(mockGame);
    });

    it('should fetch all games', () => {
        const mockGames: Game[] = [
            {
                _id: '1',
                title: 'Jeu 1',
                mapSize: 'petite',
                mode: 'Classique',
                visibility: true,
                description: 'Description du jeu 1',
                board: [[mockTiles[0], mockTiles[1]]],
                updatedAt: new Date(),
            },
            {
                _id: '2',
                title: 'Jeu 2',
                mapSize: 'grande',
                mode: 'Capture the flag',
                visibility: false,
                description: 'Description du jeu 2',
                board: [[mockTiles[0], mockTiles[1]]],
                updatedAt: new Date(),
            },
        ];

        service.getGames().subscribe((games) => {
            expect(games.length).toBe(2);
            expect(games).toEqual(mockGames);
        });

        const req = httpMock.expectOne(`${apiUrl}/getGames`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGames);
    });

    it('should fetch a game by ID', () => {
        const mockGame: Game = {
            _id: '1',
            title: 'Jeu 1',
            mapSize: 'petite',
            mode: 'Classique',
            visibility: true,
            description: 'Description du jeu 1',
            board: [[mockTiles[0], mockTiles[1]]],
            updatedAt: new Date(),
        };

        service.getGameById('1').subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${apiUrl}/1`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGame);
    });

    it('should update game details', () => {
        const updatedGame: Game = {
            _id: '1',
            title: 'Updated Title',
            description: 'Updated description',
            mapSize: 'petite',
            mode: 'Classique',
            updatedAt: new Date(),
            board: [[mockTiles[0]]],
            visibility: true,
        };

        service.updateGameDetails('1', 'Updated Title', 'Updated description', [[mockTiles[0]]]).subscribe((game) => {
            expect(game).toEqual(updatedGame);
        });

        const req = httpMock.expectOne(`${apiUrl}/1/update`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ title: 'Updated Title', description: 'Updated description', board: [[mockTiles[0]]] });
        req.flush(updatedGame);
    });

    it('should change game visibility', () => {
        const mockGame: Game = {
            _id: '1',
            title: 'Jeu 1',
            mapSize: 'petite',
            mode: 'Classique',
            visibility: true,
            description: 'Description du jeu 1',
            board: [[mockTiles[0], mockTiles[1]]],
            updatedAt: new Date(),
        };

        service.changeVisibility('1', false).subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${apiUrl}/1/update`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ visibility: false });
        req.flush(mockGame);
    });

    it('should delete a game', () => {
        service.deleteGame('1').subscribe((response) => {
            expect(response).toBeNull();
        });

        const req = httpMock.expectOne(`${apiUrl}/1`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    it('should fetch a game by access code', () => {
        const accessCode = 'ABC123';
        const mockGame: Game = {
            _id: '1',
            title: 'Jeu 1',
            mapSize: 'petite',
            mode: 'Classique',
            visibility: true,
            description: 'Description du jeu 1',
            board: [[mockTiles[0], mockTiles[1]]],
            updatedAt: new Date(),
        };

        service.joinGameByAccessCode(accessCode).subscribe((game) => {
            expect(game).toEqual(mockGame);
        });

        const req = httpMock.expectOne(`${apiUrl}/join/${accessCode}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockGame);
    });

    it('should change the game board', () => {
        const gameId = '1';
        const mockBoard: Tiles[][] = [
            [mockTiles[0], mockTiles[1]],
            [mockTiles[1], mockTiles[0]],
        ];
        const updatedGame: Game = {
            _id: gameId,
            title: 'Jeu 1',
            mapSize: 'petite',
            mode: 'Classique',
            visibility: true,
            description: 'Description du jeu 1',
            board: mockBoard,
            updatedAt: new Date(),
        };

        service.changeBoard(gameId, mockBoard).subscribe((game) => {
            expect(game).toEqual(updatedGame);
        });

        const req = httpMock.expectOne(`${apiUrl}/${gameId}/update`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ board: mockBoard });
        req.flush(updatedGame);
    });
});
