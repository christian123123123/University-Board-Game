import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Game } from '@app/interfaces/Game';
import { GamesService } from '@app/services/games/games.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { of } from 'rxjs';
import { ObjectsComponent } from './objects.component';

describe('ObjectsComponent', () => {
    let component: ObjectsComponent;
    let fixture: ComponentFixture<ObjectsComponent>;
    let gamesService: jasmine.SpyObj<GamesService>;
    const MAP_SIZE = 'large';
    const GAME_MODE = 'normal';
    const MOCK_GAME: Game = {
        _id: '1',
        title: 'Test Game',
        mapSize: 'Medium',
        mode: 'Adventure',
        visibility: true,
        description: 'A test game description',
        board: [
            [
                {
                    fieldTile: 'tile1',
                    avatar: '',
                    door: false,
                    wall: false,
                    object: '/assets/universal-cube.png',
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ],
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const gamesServiceSpy = jasmine.createSpyObj('GamesService', ['getGameById']);

        await TestBed.configureTestingModule({
            declarations: [],
            imports: [ObjectsComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({
                            id: MOCK_GAME._id,
                            mapSize: MAP_SIZE,
                            gameMode: GAME_MODE,
                        }),
                    },
                },
                { provide: GamesService, useValue: gamesServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectsComponent);
        component = fixture.componentInstance;
        gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;

        gamesService.getGameById.and.returnValue(of(MOCK_GAME));
    });

    it('should fetch game details when gameId is present', () => {
        spyOn(component.objectsService, 'getInitialItemCount').and.callThrough();
        component.ngOnInit();

        expect(gamesService.getGameById).toHaveBeenCalledWith(MOCK_GAME._id);
        expect(component.objectsService.getInitialItemCount).toHaveBeenCalled();
    });

    it('should return false when objectKey does not exist in GAME_OBJECTS', () => {
        const objectKey = 'nonExistentObject';

        const result = component.isUsed(objectKey);

        expect(result).toBe(false);
    });
});

describe('ObjectsComponent with no gameId', () => {
    let component: ObjectsComponent;
    let fixture: ComponentFixture<ObjectsComponent>;
    let gamesService: jasmine.SpyObj<GamesService>;

    const MAP_SIZE = 'large';
    const GAME_MODE = 'normal';
    const MOCK_GAME: Game = {
        _id: '1',
        title: 'Test Game',
        mapSize: 'Medium',
        mode: 'Adventure',
        visibility: true,
        description: 'A test game description',
        board: [
            [
                {
                    fieldTile: 'tile1',
                    avatar: '',
                    door: false,
                    wall: false,
                    object: '/assets/universal-cube.png',
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ],
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const GAMES_SERVICES_SPY = jasmine.createSpyObj('GamesService', ['getGameById']);

        await TestBed.configureTestingModule({
            declarations: [],
            imports: [ObjectsComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({
                            mapSize: MAP_SIZE,
                            gameMode: GAME_MODE,
                        }),
                    },
                },
                { provide: GamesService, useValue: GAMES_SERVICES_SPY },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectsComponent);
        component = fixture.componentInstance;
        gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;

        gamesService.getGameById.and.returnValue(of(MOCK_GAME));
    });
    it('should set object counts when gameId is not present in queryParams', () => {
        const OBJECT_COUNT_UNIVERSAL_RANDOM = 23;
        const OBJECT_COUNT_NORMAL = 1;
        spyOn(component.objectsService, 'getItemCount').and.returnValue(OBJECT_COUNT_UNIVERSAL_RANDOM);

        component.ngOnInit();

        for (const key in GAME_OBJECTS) {
            if (key === 'universalCube' || key === 'randomItem') {
                expect(GAME_OBJECTS[key].count).toBe(OBJECT_COUNT_UNIVERSAL_RANDOM);
            } else {
                expect(GAME_OBJECTS[key].count).toBe(OBJECT_COUNT_NORMAL);
            }
        }

        expect(component.objectsService.getItemCount).toHaveBeenCalledWith('large');
    });
});
