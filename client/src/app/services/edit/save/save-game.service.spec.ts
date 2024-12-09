import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { GamesService } from '@app/services/games/games.service';
import { of } from 'rxjs';
import { SaveGameService } from './save-game.service';
import { ValidationService } from './validation/validation.service';

describe('SaveGameService', () => {
    let saveGameService: SaveGameService;
    let mockGamesService: jasmine.SpyObj<GamesService>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
    let validationGameService: jasmine.SpyObj<ValidationService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: Partial<ActivatedRoute>;

    const MOON_TILES = '/assets/moon-tiles.png';

    const MOCK_GAMES: Game[] = [
        { _id: '1', title: 'Game A', description: 'allo', mapSize: '', mode: '', visibility: true, board: [], updatedAt: new Date() },
        { _id: '2', title: 'Game B', description: '', mapSize: '', mode: '', visibility: true, board: [], updatedAt: new Date() },
        { _id: '3', title: 'Game C', description: '', mapSize: '', mode: '', visibility: true, board: [], updatedAt: new Date() },
        { _id: '', title: 'Game D', description: '', mapSize: '', mode: '', visibility: true, board: [], updatedAt: new Date() },
    ];

    const mockBoard: Tiles[][] = [
        [
            { fieldTile: MOON_TILES, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 0 } },
            { fieldTile: MOON_TILES, avatar: '', door: true, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 1 } },
        ],
        [
            { fieldTile: MOON_TILES, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 1, col: 0 } },
            { fieldTile: MOON_TILES, avatar: '', door: false, wall: true, object: null, isTileSelected: false, position: { row: 1, col: 1 } },
        ],
    ];

    const MINIMAL_MOCK_BOARD: Tiles[][] = [
        [{ fieldTile: MOON_TILES, avatar: '', door: false, wall: false, object: null, isTileSelected: false, position: { row: 0, col: 0 } }],
    ];
    function configureTestValidationService(): void {
        validationGameService.areStartingPointsSet.and.returnValue(true);
        validationGameService.isValidBoardPercentage.and.returnValue(true);
        validationGameService.areAllTerrainTilesAccessible.and.returnValue(true);
        validationGameService.isDoorNotSurrounded.and.returnValue(false);
        validationGameService.isFlagHere.and.returnValue(true);
    }

    beforeEach(() => {
        mockGamesService = jasmine.createSpyObj('GamesService', ['getGames', 'getGameById', 'updateGameDetails', 'createGame', 'changeVisibility']);
        mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        validationGameService = jasmine.createSpyObj('ValidationService', [
            'isTitleOrDescriptionMissing',
            'areStartingPointsSet',
            'isValidBoardPercentage',
            'areAllTerrainTilesAccessible',
            'isDoorNotSurrounded',
            'isFlagHere',
        ]);
        mockActivatedRoute = {}; // Mock for ActivatedRoute

        TestBed.configureTestingModule({
            providers: [
                SaveGameService,
                { provide: GamesService, useValue: mockGamesService },
                { provide: ValidationService, useValue: validationGameService },
                { provide: MatSnackBar, useValue: mockSnackBar },
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }, // Add the mock ActivatedRoute
            ],
        });

        saveGameService = TestBed.inject(SaveGameService);
        mockGamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
        mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
        validationGameService = TestBed.inject(ValidationService) as jasmine.SpyObj<ValidationService>;
    });

    describe('saveGame() general', () => {
        it('should show error message if title or description is missing', () => {
            const GAME_DATA = { ...MOCK_GAMES[0] };
            validationGameService.isTitleOrDescriptionMissing.and.returnValue(true);
            validationGameService.isValidBoardPercentage.and.returnValue(true);
            validationGameService.areAllTerrainTilesAccessible.and.returnValue(true);
            validationGameService.isDoorNotSurrounded.and.returnValue(false);
            validationGameService.areStartingPointsSet.and.returnValue(true);

            saveGameService.saveGame(null, GAME_DATA, mockBoard, 'classique');

            expect(mockSnackBar.open).toHaveBeenCalledWith('Vous devez donner un titre et une description à votre jeu', 'Ok', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                duration: 3000,
            });
        });

        it('should return true if duplicate title is found for another game', (done) => {
            mockGamesService.getGames.and.returnValue(of(MOCK_GAMES));

            saveGameService.checkForDuplicateTitleEditing('Game A', '2').subscribe((isDuplicate) => {
                expect(isDuplicate).toBeTrue();
                done();
            });
        });

        it('should return false if no duplicate title is found', (done) => {
            mockGamesService.getGames.and.returnValue(of(MOCK_GAMES));

            saveGameService.checkForDuplicateTitleEditing('Game C', '3').subscribe((isDuplicate) => {
                expect(isDuplicate).toBeFalse();
                done();
            });
        });

        it('should return false if the same game ID has the same title', (done) => {
            mockGamesService.getGames.and.returnValue(of(MOCK_GAMES));

            saveGameService.checkForDuplicateTitleEditing('Game A', '1').subscribe((isDuplicate) => {
                expect(isDuplicate).toBeFalse();
                done();
            });
        });

        it('should return true if duplicate title is found during game creation', (done) => {
            mockGamesService.getGames.and.returnValue(of(MOCK_GAMES));

            saveGameService.checkForDuplicateTitleCreating('Game A').subscribe((isDuplicate) => {
                expect(isDuplicate).toBeTrue();
                done();
            });
        });

        it('should return false if no duplicate title is found during game creation', (done) => {
            mockGamesService.getGames.and.returnValue(of(MOCK_GAMES));

            saveGameService.checkForDuplicateTitleCreating('Game G').subscribe((isDuplicate) => {
                expect(isDuplicate).toBeFalse();
                done();
            });
        });

        it('should show an error message if starting points are not set', () => {
            const GAME_DATA = { ...MOCK_GAMES[0] };
            validationGameService.isValidBoardPercentage.and.returnValue(true);
            validationGameService.areAllTerrainTilesAccessible.and.returnValue(true);
            validationGameService.isDoorNotSurrounded.and.returnValue(false);
            validationGameService.areStartingPointsSet.and.returnValue(false);

            saveGameService.saveGame('1', GAME_DATA, mockBoard, 'classique');

            expect(mockSnackBar.open).toHaveBeenCalledWith('Tous les points de départ doivent être placés.', 'Ok', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                duration: 3000,
            });
        });

        it('should show error if more than 50% of the board is not terrain tiles', () => {
            validationGameService.isValidBoardPercentage.and.returnValue(false);

            saveGameService.saveGame(MOCK_GAMES[0]._id, MOCK_GAMES[0], MINIMAL_MOCK_BOARD, 'classique');

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'Plus de 50% de la surface de la carte doit être occupée par des tuiles de terrain',
                'Ok',
                {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    duration: 3000,
                },
            );
        });
        it('should show error if not all terrain tiles are accessible', () => {
            validationGameService.areAllTerrainTilesAccessible.and.returnValue(false);
            validationGameService.isValidBoardPercentage.and.returnValue(true);
            validationGameService.isDoorNotSurrounded.and.returnValue(false);
            validationGameService.areStartingPointsSet.and.returnValue(false);

            saveGameService.saveGame(MOCK_GAMES[0]._id, MOCK_GAMES[0], MINIMAL_MOCK_BOARD, 'classique');

            expect(mockSnackBar.open).toHaveBeenCalledWith(
                'Toutes les tuiles de terrain doivent être accessibles sans être bloquées par des murs',
                'Ok',
                { horizontalPosition: 'center', verticalPosition: 'top', duration: 3000 },
            );
        });

        it('should show an error message if door tiles are not surrounded by walls correctly', () => {
            validationGameService.areStartingPointsSet.and.returnValue(true);
            validationGameService.isValidBoardPercentage.and.returnValue(true);
            validationGameService.areAllTerrainTilesAccessible.and.returnValue(true);
            validationGameService.isDoorNotSurrounded.and.returnValue(true);
            validationGameService.isFlagHere.and.returnValue(false);
            saveGameService.saveGame('1', MOCK_GAMES[0], MINIMAL_MOCK_BOARD, 'classique');

            expect(mockSnackBar.open).toHaveBeenCalledWith('Chaque tuile de porte doit se trouver entre deux tuiles de mur sur un même axe.', 'Ok', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                duration: 3000,
            });
        });
    });

    describe('saveGame() editing game', () => {
        it('should show an error if the game title is a duplicate during editing an existing game', () => {
            const MOCK_GAME = { ...MOCK_GAMES[0] };
            mockGamesService.getGameById.and.returnValue(of(MOCK_GAME));
            configureTestValidationService();
            spyOn(saveGameService, 'checkForDuplicateTitleEditing').and.returnValue(of(true));

            saveGameService.saveGame(MOCK_GAME._id, MOCK_GAME, [], 'classique');

            expect(mockSnackBar.open).toHaveBeenCalledWith('Ce titre est déjà utilisé par un autre jeu', 'Ok', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                duration: 3000,
            });
        });
        it('should update the game details and navigate to /admin on success', () => {
            const MOCK_GAME = { ...MOCK_GAMES[0] };
            const MOCK_BOARD = { ...mockBoard };

            mockGamesService.getGameById.and.returnValue(of(MOCK_GAME));
            configureTestValidationService();
            spyOn(saveGameService, 'checkForDuplicateTitleEditing').and.returnValue(of(false));
            mockGamesService.updateGameDetails.and.returnValue(of(MOCK_GAME));
            mockGamesService.changeVisibility.and.returnValue(of(MOCK_GAME));

            saveGameService.saveGame(MOCK_GAME._id, MOCK_GAME, MOCK_BOARD, 'classique');

            expect(mockGamesService.updateGameDetails).toHaveBeenCalledWith(MOCK_GAME._id, MOCK_GAME.title, MOCK_GAME.description, MOCK_BOARD);
            expect(mockGamesService.changeVisibility).toHaveBeenCalledWith(MOCK_GAME._id, MOCK_GAME.visibility);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
        });
    });
    describe('saveGame() creating game', () => {
        it('should show an error if the game title is a duplicate when creating a new game', () => {
            const MOCK_GAME = { ...MOCK_GAMES[3] };

            configureTestValidationService();
            spyOn(saveGameService, 'checkForDuplicateTitleCreating').and.returnValue(of(true));

            saveGameService.saveGame(null, MOCK_GAME, [], 'classique');

            expect(mockSnackBar.open).toHaveBeenCalledWith('Ce titre est déjà utilisé par un autre jeu', 'Ok', {
                horizontalPosition: 'center',
                verticalPosition: 'top',
                duration: 3000,
            });
        });

        it('should create the game and navigate to /admin on success', () => {
            const MOCK_GAME = { ...MOCK_GAMES[0] };
            const MOCK_BOARD = { ...mockBoard };

            configureTestValidationService();
            spyOn(saveGameService, 'checkForDuplicateTitleCreating').and.returnValue(of(false));
            mockGamesService.createGame.and.returnValue(of(MOCK_GAME));

            saveGameService.saveGame(null, MOCK_GAME, MOCK_BOARD, 'classique');

            expect(mockGamesService.createGame).toHaveBeenCalledWith(MOCK_GAME);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
        });
    });
});
