import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { Tiles } from '@app/interfaces/Tiles';
import { BoardService } from '@app/services/edit/board/board.service';
import { TilesService } from '@app/services/edit/tiles/tiles.service';
import { BoardComponent } from './board.component';
describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let mockDataTransfer: DataTransfer;
    let mockEvent: DragEvent;
    let boardServiceSpy: jasmine.SpyObj<BoardService>;
    let tilesServiceSpy: jasmine.SpyObj<TilesService>;

    const mockTile: Tiles = {
        fieldTile: '/assets/mock-tile.png',
        object: '',
        avatar: '',
        door: false,
        wall: false,
        isTileSelected: false,
        position: { row: 0, col: 0 },
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BoardComponent],
            providers: [provideHttpClient(withInterceptorsFromDi())],
        }).compileComponents();

        mockDataTransfer = {
            setData: jasmine.createSpy('setData'),
            getData: jasmine.createSpy('getData').and.returnValue('some-object-url'),
            clearData: jasmine.createSpy('clearData'),
            dropEffect: 'none',
            effectAllowed: 'all',
            files: [],
            items: [],
            types: [],
        } as unknown as DataTransfer;

        mockEvent = new DragEvent('drop');
        boardServiceSpy = jasmine.createSpyObj('BoardService', ['getBoardSize']);

        tilesServiceSpy = jasmine.createSpyObj('TilesService', ['leftClickSelect', 'rightClickSelect']);

        spyOnProperty(mockEvent, 'dataTransfer').and.returnValue(mockDataTransfer);
        spyOn(mockEvent, 'preventDefault');

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        component.mapSize = 'moyenne';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize a default board when no saved board is provided', () => {
        const BOARD_SIZE = 10;
        component.boardSize = BOARD_SIZE;
        component.initializeBoard();
        expect(component.board.length).toBe(BOARD_SIZE);
        expect(component.board[0].length).toBe(BOARD_SIZE);
    });

    it('should initialize board with savedBoard when savedBoard is defined', () => {
        const mockSavedBoard: Tiles[][] = [
            [
                {
                    fieldTile: '/assets/water-tiles.png',
                    avatar: '',
                    object: '',
                    door: false,
                    wall: false,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
                {
                    fieldTile: '/assets/wall-tiles.png',
                    avatar: '',
                    object: '',
                    door: false,
                    wall: true,
                    isTileSelected: false,
                    position: { row: 0, col: 1 },
                },
            ],
            [
                {
                    fieldTile: '/assets/ice-tiles.png',
                    avatar: '',
                    object: '',
                    door: false,
                    wall: false,
                    isTileSelected: false,
                    position: { row: 1, col: 0 },
                },
                {
                    fieldTile: '/assets/door-tilesV2.0.png',
                    avatar: '',
                    object: '',
                    door: true,
                    wall: false,
                    isTileSelected: false,
                    position: { row: 1, col: 1 },
                },
            ],
        ];
        component.savedBoard = mockSavedBoard;

        component.initializeBoard();

        expect(component.board).toEqual(mockSavedBoard);
    });

    it('should prevent default onRightClick', () => {
        const MOCK_EVENT = new MouseEvent('contextmenu');
        spyOn(MOCK_EVENT, 'preventDefault');
        spyOn(component, 'onRightClick').and.callThrough();
        component.onRightClick(MOCK_EVENT);
        expect(component.onRightClick).toHaveBeenCalledWith(MOCK_EVENT);
        expect(MOCK_EVENT.preventDefault).toHaveBeenCalled();
    });

    it('should call onMouseUp', () => {
        spyOn(component, 'onMouseUp').and.callThrough();
        component.onMouseUp();
        expect(component.onMouseUp).toHaveBeenCalled();
    });

    it('should call mouseEventService.onMouseDown when a mousedown event is triggered', () => {
        const event = new MouseEvent('mousedown');

        spyOn(component, 'onMouseDown').and.callThrough();
        component.onMouseDown(event);

        expect(component.onMouseDown).toHaveBeenCalledWith(event);
    });

    it('should call mouseEventService.onMouseMove when a mousemove even is triggered', () => {
        const event = new MouseEvent('mousemove');
        spyOn(component, 'onMouseMove').and.callThrough();
        component.onMouseMove(event);
        expect(component.onMouseMove).toHaveBeenCalledWith(event);
    });

    it('should return the current board state when getBoardState is called', () => {
        const mockBoard: Tiles[][] = [
            [
                {
                    fieldTile: '/assets/water-tiles.png',
                    object: '',
                    avatar: '',
                    door: false,
                    wall: false,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
                {
                    fieldTile: '/assets/wall-tiles.png',
                    object: '',
                    avatar: '',
                    door: false,
                    wall: true,
                    isTileSelected: false,
                    position: { row: 0, col: 1 },
                },
            ],
            [
                {
                    fieldTile: '/assets/ice-tiles.png',
                    avatar: '',
                    object: '',
                    door: false,
                    wall: false,
                    isTileSelected: false,
                    position: { row: 1, col: 0 },
                },
                {
                    fieldTile: '/assets/door-tilesV2.0.png',
                    avatar: '',
                    object: '',
                    door: true,
                    wall: false,
                    isTileSelected: false,
                    position: { row: 1, col: 1 },
                },
            ],
        ];

        component.board = mockBoard;

        const boardState = component.getBoardState();

        expect(boardState).toEqual(mockBoard);
    });

    it('should update boardSize and call initializeBoard when mapSize changes', () => {
        const newMapSize = 'large';
        const mockBoardSize = 15;
        boardServiceSpy.getBoardSize.and.returnValue(mockBoardSize);

        spyOn(component, 'initializeBoard');

        const changes: SimpleChanges = {
            mapSize: new SimpleChange(null, newMapSize, true),
        };
        component.ngOnChanges(changes);

        expect(component.boardSize).toBe(mockBoardSize);

        expect(component.initializeBoard).toHaveBeenCalled();
    });

    it('should not call any service method when event.buttons is neither 1 nor 2', () => {
        component.board = [[mockTile]];
        component.selectedTile = {
            fieldTile: '/assets/wall-tiles.png',
            object: '',
            avatar: '',
            door: false,
            wall: true,
            isTileSelected: false,
            position: { row: 0, col: 0 },
        };

        const mouseEvent = new MouseEvent('mousedown', { buttons: 1 });
        const mouseEvent2 = new MouseEvent('mousedown', { buttons: 2 });

        component.selectTile(mouseEvent, 0, 0);
        component.selectTile(mouseEvent2, 0, 0);

        expect(tilesServiceSpy.leftClickSelect).not.toHaveBeenCalled();
        expect(tilesServiceSpy.rightClickSelect).not.toHaveBeenCalled();
    });
});
