import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { SaveGameService } from '@app/services/edit/save/save-game.service';
import { GamesService } from '@app/services/games/games.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { of } from 'rxjs';
import { BoardComponent } from '../../components/board/board.component';
import { ObjectsComponent } from '../../components/objects/objects.component';
import { TilesComponent } from '../../components/tiles/tiles.component';
import { EditPageComponent } from './edit-page.component';

describe('EditPageComponent', () => {
    let component: EditPageComponent;
    let fixture: ComponentFixture<EditPageComponent>;
    let mockGamesService: jasmine.SpyObj<GamesService>;
    let mockSaveGameService: jasmine.SpyObj<SaveGameService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
    let mockActivatedRoute: Partial<ActivatedRoute>;
    let mockObjectsComponent: jasmine.SpyObj<ObjectsComponent>;

    beforeEach(async () => {
        mockGamesService = jasmine.createSpyObj('GamesService', ['getGames', 'getGameById', 'createGame', 'updateGameDetails', 'changeVisibility']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockObjectsComponent = jasmine.createSpyObj('ObjectsComponent', ['getItemCount']);
        const saveGameServiceSpy = jasmine.createSpyObj('SaveGameService', ['saveGame']);

        mockActivatedRoute = {
            queryParams: of({ id: '1', gameMode: 'normal', mapSize: 'large' }),
        };

        const mockGame: Game = {
            _id: '123',
            title: 'Test Game',
            description: 'Test Description',
            mapSize: 'large',
            mode: 'normal',
            visibility: true,
            board: [],
            updatedAt: new Date(),
        };

        mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

        mockGamesService.getGames.and.returnValue(of([]));
        mockGamesService.getGameById.and.returnValue(of(mockGame));
        mockGamesService.createGame.and.returnValue(of(mockGame));
        mockGamesService.updateGameDetails.and.returnValue(of(mockGame));
        mockGamesService.changeVisibility.and.returnValue(of(mockGame));
        mockObjectsComponent.mapSize = 'moyenne';

        await TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule, FormsModule, EditPageComponent, ObjectsComponent, BoardComponent, TilesComponent],
            providers: [
                [provideHttpClient(withInterceptorsFromDi())],
                { provide: MatSnackBar, useValue: mockSnackBar },
                { provide: GamesService, useValue: mockGamesService },
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: SaveGameService, useValue: saveGameServiceSpy },
            ],
        }).compileComponents();
        mockSaveGameService = TestBed.inject(SaveGameService) as jasmine.SpyObj<SaveGameService>;
        mockSaveGameService.saveGame.and.returnValue(await Promise.resolve());

        fixture = TestBed.createComponent(EditPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should reset the board and update object counts when lastSavedBoard and game exist', () => {
        const mockLastSavedBoard: Tiles[][] = [
            [{ fieldTile: 'tile1', avatar: '', object: 'object1', door: false, wall: false, isTileSelected: false, position: { row: 0, col: 0 } }],
            [{ fieldTile: 'tile2', avatar: '', object: 'object2', door: false, wall: false, isTileSelected: false, position: { row: 1, col: 0 } }],
        ];

        component.lastSavedBoard = mockLastSavedBoard;
        component.game = {
            _id: '1',
            title: 'Test Game',
            description: '',
            board: mockLastSavedBoard,
            mapSize: 'petite',
            mode: '',
            visibility: false,
            updatedAt: new Date(),
            accessCode: '',
        } as Game;

        spyOn(component, 'initialBoardCopy').and.callThrough();

        const objectsComponentSpy = jasmine.createSpyObj('ObjectsComponent', ['getInitialItemCount']);
        objectsComponentSpy.getInitialItemCount.and.callFake(() => 2);
        component.objectsComponent = objectsComponentSpy;

        const boardComponentSpy = jasmine.createSpyObj('BoardComponent', ['board']);
        component.boardComponent = boardComponentSpy;

        component.resetTiles();

        expect(component.initialBoardCopy).toHaveBeenCalledWith(mockLastSavedBoard);
        expect(component.boardComponent.board).toEqual(mockLastSavedBoard);
    });

    it('should set gameBoard and lastSavedBoard to empty arrays when game board is empty', () => {
        const mockGameWithEmptyBoard: Game = {
            _id: '123',
            title: 'Test Game',
            description: 'Test Description',
            mapSize: 'large',
            mode: 'normal',
            visibility: true,
            board: [],
            updatedAt: new Date(),
        };

        mockGamesService.getGameById.and.returnValue(of(mockGameWithEmptyBoard));

        component.ngOnInit();

        expect(component.gameBoard).toEqual([]);
        expect(component.lastSavedBoard).toEqual([]);
    });

    it('should select a tile', () => {
        const selectedTile: Tiles = {
            fieldTile: 'grass',
            avatar: '',
            door: false,
            wall: false,
            object: null,
            isTileSelected: false,
            position: { row: 0, col: 0 },
        };

        component.onTileSelected(selectedTile);

        expect(component.selectedTile).toEqual(selectedTile);
    });

    it('should call initializeBoard and set counts in the else block', () => {
        component.lastSavedBoard = [];
        component.game = null;

        spyOn(component.boardComponent, 'initializeBoard');
        spyOn(component.objectsService, 'getInitialItemCount').and.returnValue(0);

        component.resetTiles();

        expect(component.boardComponent.initializeBoard).toHaveBeenCalled();
        for (const key in GAME_OBJECTS) {
            if (Object.prototype.hasOwnProperty.call(GAME_OBJECTS, key)) {
                expect(component.objectsService.getInitialItemCount).toHaveBeenCalledWith(
                    component.boardComponent.board,
                    GAME_OBJECTS[key].object,
                    component.mapSize,
                );
            }
        }
    });

    it('should save game with correct data', async () => {
        component.game = {
            _id: '1',
            title: 'Test Game',
            description: '',
            board: [],
            mapSize: 'petite',
            mode: 'classique',
            visibility: false,
            updatedAt: new Date(),
            accessCode: '',
        } as Game;

        const GAMEDATA: Omit<Game, '_id' | 'updatedAt'> = {
            title: component.gameTitle,
            mapSize: component.mapSize,
            mode: component.gameMode,
            visibility: false,
            description: component.gameDescription,
            board: component.gameBoard,
        };

        spyOn(component, 'saveGame').and.callThrough();

        await component.saveGame();

        expect(component.saveGame).toHaveBeenCalled();
        expect(mockSaveGameService.saveGame).toHaveBeenCalledWith('1', GAMEDATA, [], 'normal');
    });

    it('should call saveGame with null as game ID when game is created', async () => {
        component.game = null;

        const mockBoardState = [
            [{ object: null, avatar: '', door: false, wall: false, fieldTile: '', isTileSelected: false, position: { row: 0, col: 0 } }],
        ];
        spyOn(component.boardComponent, 'getBoardState').and.returnValue(mockBoardState);

        await component.saveGame();

        expect(mockSaveGameService.saveGame).toHaveBeenCalledWith(
            null,
            jasmine.objectContaining({
                title: component.gameTitle,
                mapSize: component.mapSize,
                mode: component.gameMode,
                visibility: false,
                description: component.gameDescription,
                board: mockBoardState,
            }),
            mockBoardState,
            'normal',
        );
    });
});
