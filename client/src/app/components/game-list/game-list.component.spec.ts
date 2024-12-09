import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { GameListService } from '@app/services/game-list/game-list.service';
import { GamesService } from '@app/services/games/games.service';
import { of } from 'rxjs';
import { GameListComponent } from './game-list.component';

describe('GameListComponent', () => {
    let component: GameListComponent;
    let fixture: ComponentFixture<GameListComponent>;
    let gamesServiceSpy: jasmine.SpyObj<GamesService>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;

    const MOCK_TILES: Tiles[] = [
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
        {
            fieldTile: 'ice',
            avatar: '',
            door: false,
            wall: false,
            object: 'apple',
            isTileSelected: false,
            position: { row: 5, col: 9 },
        },
        {
            fieldTile: 'water',
            avatar: '',
            door: false,
            wall: false,
            object: 'banana',
            isTileSelected: false,
            position: { row: 1, col: 0 },
        },
    ];

    const MOCK_GAMES: Game[] = [
        {
            _id: '1',
            title: 'Jeu 1',
            mapSize: 'petite',
            mode: 'Classique',
            visibility: true,
            description: 'Description du jeu 1',
            board: [[MOCK_TILES[0], MOCK_TILES[1]]],
            updatedAt: new Date(),
        },
        {
            _id: '2',
            title: 'Jeu 2',
            mapSize: 'grande',
            mode: 'Capture the flag',
            visibility: false,
            description: 'Description du jeu 2',
            board: [[MOCK_TILES[0], MOCK_TILES[1]]],
            updatedAt: new Date(),
        },
    ];

    beforeEach(waitForAsync(() => {
        const GAMES_SERVICE_MOCK = jasmine.createSpyObj('GamesService', ['getGames', 'changeVisibility', 'deleteGame', 'getGameById']);
        const SNACK_BAR_MOCK = jasmine.createSpyObj('MatSnackBar', ['open']);
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['deleteButton', 'toggleVisibility']);

        TestBed.configureTestingModule({
            imports: [GameListComponent],
            providers: [
                { provide: ActivatedRoute, useValue: { url: of([{ path: 'admin' }]) } },
                { provide: GamesService, useValue: GAMES_SERVICE_MOCK },
                { provide: MatSnackBar, useValue: SNACK_BAR_MOCK },
                { provide: GameListService, useValue: gameListServiceSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        gamesServiceSpy = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
        fixture = TestBed.createComponent(GameListComponent);
        component = fixture.componentInstance;
        gamesServiceSpy.getGames.and.returnValue(of(MOCK_GAMES));
        fixture.detectChanges();
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with the correct route and load games', () => {
        expect(component.currentRoute).toBe('admin');
        expect(component.games.length).toBe(2);
        expect(gamesServiceSpy.getGames).toHaveBeenCalled();
    });

    it('should display all games in the /admin route', () => {
        component.currentRoute = 'admin';
        fixture.detectChanges();
        const DISPLAYED_GAMES = fixture.nativeElement.querySelectorAll('li');
        expect(DISPLAYED_GAMES.length).toBe(2);
    });

    it('should display all games in the /create route', () => {
        component.currentRoute = 'create';
        fixture.detectChanges();
        const DISPLAYED_GAMES = fixture.nativeElement.querySelectorAll('li');
        expect(DISPLAYED_GAMES.length).toBe(2);
    });

    it('should set the current route and load games on ngOnInit', () => {
        gamesServiceSpy.getGames.and.returnValue(of(MOCK_GAMES));

        component.ngOnInit();

        expect(component.currentRoute).toBe('admin');

        expect(gamesServiceSpy.getGames).toHaveBeenCalled();
        expect(component.games.length).toBe(2);
    });

    it('should set isBoardHovered to true when onBoardHover is called', () => {
        component.onBoardHover();
        expect(component.isBoardHovered).toBeTrue();
    });

    it('should set isBoardHovered to false when onBoardLeave is called', () => {
        component.onBoardLeave();
        expect(component.isBoardHovered).toBeFalse();
    });

    it('should call toggleVisibility when visibilityButton is clicked', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const MOCK_GAME = { ...MOCK_GAMES[0], visibility: true };
        fixture.detectChanges();

        const visibilityButton = compiled.querySelector('.visibility-button');
        visibilityButton?.dispatchEvent(new Event('click'));

        expect(gameListServiceSpy.toggleVisibility).toHaveBeenCalledWith(MOCK_GAME);
    });

    it('should call deleteGame when deleteButton is clicked', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const MOCK_GAME = MOCK_GAMES[0];
        fixture.detectChanges();

        const deleteButton = compiled.querySelector('.delete-game-button');
        deleteButton?.dispatchEvent(new Event('click'));

        expect(gameListServiceSpy.deleteButton).toHaveBeenCalledWith(component, MOCK_GAME);
    });
});
