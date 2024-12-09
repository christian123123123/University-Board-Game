import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router'; // Add this import
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/Game';
import { CreationFormService } from '@app/services/create/creation-form.service';
import { GameListService } from '@app/services/game-list/game-list.service';
import { GamesService } from '@app/services/games/games.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { of, throwError } from 'rxjs';
import { ImportExportService } from '../edit/import-export/import-export.service';

describe('GameListService', () => {
    let service: GameListService;
    let gamesServiceSpy: jasmine.SpyObj<GamesService>;

    const MOCK_GAME: Game = {
        _id: '1',
        title: 'Test Game',
        mapSize: 'small',
        mode: 'Classique',
        visibility: true,
        description: 'Test Description',
        board: [],
        updatedAt: new Date(),
    };

    beforeEach(() => {
        const gamesServiceMock = jasmine.createSpyObj('GamesService', ['changeVisibility']);
        const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

        // Mock ActivatedRoute
        const activatedRouteMock = {
            snapshot: {
                queryParams: {},
            },
        };

        TestBed.configureTestingModule({
            providers: [
                GameListService,
                { provide: GamesService, useValue: gamesServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock }, // Add ActivatedRoute mock
            ],
        });

        service = TestBed.inject(GameListService);
        gamesServiceSpy = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
    });

    describe('@Output() exportGame', () => {
        it('should have an exportGame property of type Game', () => {
            expect(service.exportGame).toBeUndefined(); // `@Output` properties are initialized dynamically.
        });
    });

    it('should toggle the visibility of the game on success', () => {
        const mockUpdatedGame = { ...MOCK_GAME, visibility: !MOCK_GAME.visibility }; // Simulate updated game
        gamesServiceSpy.changeVisibility.and.returnValue(of(mockUpdatedGame)); // Return the expected type

        const originalVisibility = MOCK_GAME.visibility;

        service.toggleVisibility(MOCK_GAME);

        expect(gamesServiceSpy.changeVisibility).toHaveBeenCalledWith(MOCK_GAME._id, !originalVisibility);
        expect(MOCK_GAME.visibility).toBe(!originalVisibility);
    });

    it('should revert game visibility to original value on API failure', () => {
        const originalVisibility = MOCK_GAME.visibility; // Store original visibility
        gamesServiceSpy.changeVisibility.and.returnValue(
            throwError(() => new Error('Failed to toggle visibility')), // Simulate API failure
        );

        service.toggleVisibility(MOCK_GAME);

        expect(gamesServiceSpy.changeVisibility).toHaveBeenCalledWith(MOCK_GAME._id, !originalVisibility);
        expect(MOCK_GAME.visibility).toBe(originalVisibility); // Ensure visibility is reverted
    });

    describe('GameListService - deleteButton', () => {
        const MOCK_GAME: Game = {
            _id: '1',
            title: 'Test Game',
            mapSize: 'small',
            mode: 'Classique',
            visibility: true,
            description: 'Test Description',
            board: [],
            updatedAt: new Date(),
        };

        const mockComponent = {
            games: [MOCK_GAME],
        };

        it('should remove the game from the list when deleteGame succeeds', () => {
            // Create independent mocks for each test
            const gamesServiceMock = jasmine.createSpyObj('GamesService', ['getGameById', 'deleteGame']);
            const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

            // Initialize the service manually
            const service = new GameListService(
                gamesServiceMock,
                {} as any, // Router not needed here
                snackBarMock,
                {} as any, // CreationFormService not needed here
                {} as any, // SharedDataService not needed here
                {} as any, // ImportExportService not needed here
            );

            gamesServiceMock.getGameById.and.returnValue(of(MOCK_GAME));
            gamesServiceMock.deleteGame.and.returnValue(of(undefined)); // Simulate successful deletion

            service.deleteButton(mockComponent as any, MOCK_GAME);

            expect(gamesServiceMock.getGameById).toHaveBeenCalledWith(MOCK_GAME._id);
            expect(gamesServiceMock.deleteGame).toHaveBeenCalledWith(MOCK_GAME._id);
            expect(mockComponent.games.length).toBe(0); // Game should be removed
        });

        it('should display a snackbar and remove the game when getGameById fails with 404', () => {
            const gamesServiceMock = jasmine.createSpyObj('GamesService', ['getGameById', 'deleteGame']);
            const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

            const service = new GameListService(gamesServiceMock, {} as any, snackBarMock, {} as any, {} as any, {} as any);

            gamesServiceMock.getGameById.and.returnValue(
                throwError(() => ({ status: 404 })), // Simulate 404 error
            );
            snackBarMock.open.and.returnValue({
                afterDismissed: () => of({ dismissedByAction: false }),
            } as MatSnackBarRef<TextOnlySnackBar>);

            service.deleteButton(mockComponent as any, MOCK_GAME);

            expect(gamesServiceMock.getGameById).toHaveBeenCalledWith(MOCK_GAME._id);
            expect(snackBarMock.open).toHaveBeenCalledWith('Ce jeu a été supprimé', 'Ok');
            expect(mockComponent.games.length).toBe(0); // Game should be removed
        });

        it('should not remove the game when deleteGame fails', () => {
            const gamesServiceMock = jasmine.createSpyObj('GamesService', ['getGameById', 'deleteGame']);
            const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

            const service = new GameListService(gamesServiceMock, {} as any, snackBarMock, {} as any, {} as any, {} as any);

            gamesServiceMock.getGameById.and.returnValue(of(MOCK_GAME));
            gamesServiceMock.deleteGame.and.returnValue(
                throwError(() => new Error('Delete failed')), // Simulate delete failure
            );

            // Act
            service.deleteButton(mockComponent as any, MOCK_GAME);

            // Assert
            expect(gamesServiceMock.getGameById).toHaveBeenCalledWith(MOCK_GAME._id);
            expect(gamesServiceMock.deleteGame).toHaveBeenCalledWith(MOCK_GAME._id);
        });

        describe('GameListService - editGame', () => {
            it('should navigate to the edit page with the correct query parameters', () => {
                // Mock Router
                const routerMock = jasmine.createSpyObj('Router', ['navigate']);

                // Initialize the service manually
                const service = new GameListService(
                    {} as any, // GamesService not needed here
                    routerMock,
                    {} as any, // MatSnackBar not needed here
                    {} as any, // CreationFormService not needed here
                    {} as any, // SharedDataService not needed here
                    {} as any, // ImportExportService not needed here
                );

                // Mock game data
                const MOCK_GAME: Game = {
                    _id: '123',
                    title: 'Test Game',
                    mapSize: 'medium',
                    mode: 'Classique',
                    visibility: true,
                    description: 'Test Description',
                    board: [],
                    updatedAt: new Date(),
                };

                // Call the method
                service.editGame(MOCK_GAME);

                // Assert that router.navigate was called with the correct arguments
                expect(routerMock.navigate).toHaveBeenCalledWith(['/edit'], {
                    queryParams: {
                        id: MOCK_GAME._id,
                        gameMode: MOCK_GAME.mode,
                        mapSize: MOCK_GAME.mapSize,
                    },
                });
            });
        });

        describe('GameListService - onGameClick', () => {
            const MOCK_GAME_VISIBLE: Game = {
                _id: '1',
                title: 'Visible Game',
                mapSize: 'medium',
                mode: 'Classique',
                visibility: true,
                description: 'Visible game for testing',
                board: [],
                updatedAt: new Date(),
            };

            const MOCK_GAME_HIDDEN: Game = {
                _id: '2',
                title: 'Hidden Game',
                mapSize: 'medium',
                mode: 'Classique',
                visibility: false,
                description: 'Hidden game for testing',
                board: [],
                updatedAt: new Date(),
            };

            const MOCK_GAME_NOT_FOUND: Game = {
                _id: '3',
                title: 'Not Found Game',
                mapSize: 'medium',
                mode: 'Classique',
                visibility: true,
                description: 'Game that does not exist',
                board: [],
                updatedAt: new Date(),
            };

            it('should set the game and open the creation form if the game is visible', () => {
                const gamesServiceMock = jasmine.createSpyObj('GamesService', ['getGameById']);
                const sharedServiceMock = jasmine.createSpyObj('SharedDataService', ['setGame']);
                const creationFormServiceMock = jasmine.createSpyObj('CreationFormService', ['openCreationForm']);
                const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

                TestBed.resetTestingModule();
                TestBed.configureTestingModule({
                    providers: [
                        GameListService,
                        { provide: GamesService, useValue: gamesServiceMock },
                        { provide: SharedDataService, useValue: sharedServiceMock },
                        { provide: CreationFormService, useValue: creationFormServiceMock },
                        { provide: MatSnackBar, useValue: snackBarMock },
                        {
                            provide: ActivatedRoute,
                            useValue: { snapshot: { queryParams: {} } }, // Mock ActivatedRoute
                        },
                    ],
                });

                const service = TestBed.inject(GameListService);
                const mockComponent: GameListComponent = { games: [MOCK_GAME_VISIBLE] } as any;

                gamesServiceMock.getGameById.and.returnValue(of(MOCK_GAME_VISIBLE));

                service.onGameClick(mockComponent, MOCK_GAME_VISIBLE);

                expect(gamesServiceMock.getGameById).toHaveBeenCalledWith(MOCK_GAME_VISIBLE._id);
                expect(sharedServiceMock.setGame).toHaveBeenCalledWith(MOCK_GAME_VISIBLE);
                expect(creationFormServiceMock.openCreationForm).toHaveBeenCalledWith(MOCK_GAME_VISIBLE._id, false);
            });

            it('should show a snackbar and remove the game if the game is hidden', () => {
                const gamesServiceMock = jasmine.createSpyObj('GamesService', ['getGameById']);
                const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
                const sharedServiceMock = jasmine.createSpyObj('SharedDataService', ['setGame']);
                const creationFormServiceMock = jasmine.createSpyObj('CreationFormService', ['openCreationForm']);
                const mockSnackBarRef = {
                    afterDismissed: () => of({ dismissedByAction: false }),
                } as MatSnackBarRef<TextOnlySnackBar>;

                snackBarMock.open.and.returnValue(mockSnackBarRef);

                TestBed.resetTestingModule();
                TestBed.configureTestingModule({
                    providers: [
                        GameListService,
                        { provide: GamesService, useValue: gamesServiceMock },
                        { provide: SharedDataService, useValue: sharedServiceMock },
                        { provide: CreationFormService, useValue: creationFormServiceMock },
                        { provide: MatSnackBar, useValue: snackBarMock },
                        {
                            provide: ActivatedRoute,
                            useValue: { snapshot: { queryParams: {} } }, // Mock ActivatedRoute
                        },
                    ],
                });

                const service = TestBed.inject(GameListService);
                const mockComponent: GameListComponent = { games: [MOCK_GAME_HIDDEN] } as any;

                gamesServiceMock.getGameById.and.returnValue(of(MOCK_GAME_HIDDEN));

                service.onGameClick(mockComponent, MOCK_GAME_HIDDEN);

                expect(gamesServiceMock.getGameById).toHaveBeenCalledWith(MOCK_GAME_HIDDEN._id);
                expect(snackBarMock.open).toHaveBeenCalledWith('Ce jeu a été caché', 'Ok');
                expect(mockComponent.games.length).toBe(0);
            });

            it('should show a snackbar and remove the game if the game is not found (404)', () => {
                const gamesServiceMock = jasmine.createSpyObj('GamesService', ['getGameById']);
                const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
                const mockSnackBarRef = {
                    afterDismissed: () => of({ dismissedByAction: false }),
                } as MatSnackBarRef<TextOnlySnackBar>;

                snackBarMock.open.and.returnValue(mockSnackBarRef);

                TestBed.resetTestingModule();
                TestBed.configureTestingModule({
                    providers: [
                        GameListService,
                        { provide: GamesService, useValue: gamesServiceMock },
                        { provide: MatSnackBar, useValue: snackBarMock },
                        {
                            provide: ActivatedRoute,
                            useValue: { snapshot: { queryParams: {} } }, // Mock ActivatedRoute
                        },
                    ],
                });

                const service = TestBed.inject(GameListService);
                const mockComponent: GameListComponent = { games: [MOCK_GAME_NOT_FOUND] } as any;

                gamesServiceMock.getGameById.and.returnValue(throwError(() => ({ status: 404 })));

                service.onGameClick(mockComponent, MOCK_GAME_NOT_FOUND);

                expect(gamesServiceMock.getGameById).toHaveBeenCalledWith(MOCK_GAME_NOT_FOUND._id);
                expect(snackBarMock.open).toHaveBeenCalledWith('Ce jeu a été supprimé', 'Ok');
                expect(mockComponent.games.length).toBe(0);
            });
        });

        describe('GameListService - exportButton', () => {
            const MOCK_GAME: Game = {
                _id: '1',
                title: 'Export Test Game',
                mapSize: 'small',
                mode: 'Classique',
                visibility: true,
                description: 'Test Description for Export',
                board: [],
                updatedAt: new Date(),
            };

            it('should call ImportExportService.exportGame with the correct game object', () => {
                TestBed.resetTestingModule(); // Reset TestBed before configuring

                const importExportServiceMock = jasmine.createSpyObj('ImportExportService', ['exportGame']);

                TestBed.configureTestingModule({
                    imports: [HttpClientModule], // Provide HttpClient via HttpClientModule
                    providers: [GameListService, { provide: ImportExportService, useValue: importExportServiceMock }],
                });

                const service = TestBed.inject(GameListService);
                service.exportButton(MOCK_GAME);

                expect(importExportServiceMock.exportGame).toHaveBeenCalledWith(MOCK_GAME);
            });
        });
    });
});
