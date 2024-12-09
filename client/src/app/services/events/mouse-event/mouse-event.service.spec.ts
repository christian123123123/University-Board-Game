import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BoardComponent } from '@app/components/board/board.component';
import { Tiles } from '@app/interfaces/Tiles';
import { TilesService } from '@app/services/edit/tiles/tiles.service';
import { MouseEventService } from './mouse-event.service';

describe('MouseEventService', () => {
    let service: MouseEventService;
    let mockComponent: BoardComponent;
    let mockTilesService: jasmine.SpyObj<TilesService>;
    let mockEvent: MouseEvent;

    beforeEach(() => {
        const tilesServiceSpy = jasmine.createSpyObj('TilesService', ['eraseTile']);

        TestBed.configureTestingModule({
            providers: [MouseEventService, { provide: TilesService, useValue: tilesServiceSpy }],
        });

        service = TestBed.inject(MouseEventService);
        mockTilesService = TestBed.inject(TilesService) as jasmine.SpyObj<TilesService>;

        mockComponent = {
            selectedTile: null,
            gameMode: 'normal',
            mapSize: 'medium',
            savedBoard: null,
            isMouseDownLeft: false,
            isMouseDownRight: false,
            lastToggledTile: null,
            disableMouseMove: false,
            originalRowIndex: null,
            originalColIndex: null,
            currentRoute: '',
            boardSize: 10,
            board: [
                [
                    { object: null, door: false, wall: false, fieldTile: '', isTileSelected: false, position: { row: 0, col: 0 } },
                    { object: null, door: false, wall: false, fieldTile: '', isTileSelected: false, position: { row: 0, col: 1 } },
                ],
                [
                    { object: null, door: false, wall: false, fieldTile: '', isTileSelected: false, position: { row: 1, col: 0 } },
                    { object: null, door: false, wall: false, fieldTile: '', isTileSelected: false, position: { row: 1, col: 1 } },
                ],
            ] as Tiles[][],
            selectTile: jasmine.createSpy('selectTile'),
            objectDropped: new EventEmitter<string>(),
            objectRemoved: new EventEmitter<string>(),
            boardService: jasmine.createSpyObj('BoardService', ['method1', 'method2']),
            tilesService: tilesServiceSpy,
            dragEventService: jasmine.createSpyObj('DragEventService', ['method1', 'method2']),
            mouseEventService: jasmine.createSpyObj('MouseEventService', ['method1', 'onMouseUp', 'onMouseMove']),
            objectsService: jasmine.createSpyObj('ObjectsService', ['method1', 'method2']),

            onRightClick: jasmine.createSpy('onRightClick'),
            onMouseUp: jasmine.createSpy('onMouseUp'),
            onMouseDown: jasmine.createSpy('onMouseDown'),
            onMouseMove: jasmine.createSpy('onMouseMove'),
            ngOnInit: jasmine.createSpy('ngOnInit'),
            ngOnChanges: jasmine.createSpy('ngOnChanges'),
            getBoardState: jasmine.createSpy('getBoardState').and.returnValue([]),
            initializeBoard: jasmine.createSpy('initializeBoard'),
        };
        spyOn(mockComponent.objectRemoved, 'emit');
        spyOn(mockComponent.objectDropped, 'emit');

        // Any is necessary because TypeScript's MouseEvent interface includes many readonly properties,
        // making it difficult to mock all the required properties for testing.

        /* eslint-disable @typescript-eslint/no-explicit-any */
        mockEvent = {
            target: {
                getAttribute: (name: string) => (name === 'data-row' ? '0' : '0'),
                hasAttribute: (name: string) => name === 'data-row' || name === 'data-col',
            },
            button: 0,
            preventDefault: jasmine.createSpy('preventDefault'),
        } as any;
        /* eslint-enable @typescript-eslint/no-explicit-any */
    });

    describe('onMouseUp', () => {
        it('should reset isMouseDownLeft, isMouseDownRight and lastToggledTile', () => {
            service.onMouseUp(mockComponent);
            expect(mockComponent.isMouseDownLeft).toBe(false);
            expect(mockComponent.isMouseDownRight).toBe(false);
            expect(mockComponent.lastToggledTile).toBeNull();
        });
    });

    describe('onMouseDown', () => {
        it('should return early if disableMouseMove is true', () => {
            mockComponent.disableMouseMove = true;
            service.onMouseDown(mockEvent, mockComponent);
            expect(mockComponent.selectTile).not.toHaveBeenCalled();
        });

        it('should select tile when left mouse button is pressed', () => {
            service.onMouseDown(mockEvent, mockComponent);
            expect(mockComponent.isMouseDownLeft).toBe(true);
            expect(mockComponent.selectTile).toHaveBeenCalledWith(mockEvent, 0, 0);
        });

        it('should emit objectRemoved and clear object if right mouse button is pressed and object exists', () => {
            mockComponent.board[0][0].object = 'mockObject';
            Object.defineProperty(mockEvent, 'button', { value: 2 });
            service.onMouseDown(mockEvent, mockComponent);
            expect(mockComponent.objectRemoved.emit).toHaveBeenCalledWith('mockObject');
            expect(mockComponent.board[0][0].object).toBeNull();
        });

        it('should set isMouseDownRight to true and call eraseTile if right mouse button is pressed and no object exists', () => {
            Object.defineProperty(mockEvent, 'button', { value: 2 });

            mockComponent.board[0][0].object = null;

            service.onMouseDown(mockEvent, mockComponent);

            expect(mockComponent.isMouseDownRight).toBe(true);

            expect(mockTilesService.eraseTile).toHaveBeenCalledWith(mockComponent.board, 0, 0);
        });

        it('should not select tile if data-row or data-col is missing', () => {
            (mockEvent.target as HTMLElement).hasAttribute = () => false;
            service.onMouseDown(mockEvent, mockComponent);
            expect(mockComponent.selectTile).not.toHaveBeenCalled();
        });
    });

    describe('onMouseMove', () => {
        it('should return early if disableMouseMove is true', () => {
            mockComponent.disableMouseMove = true;
            service.onMouseMove(mockEvent, mockComponent);
            expect(mockComponent.selectTile).not.toHaveBeenCalled();
        });

        it('should select tile when isMouseDownLeft is true', () => {
            mockComponent.isMouseDownLeft = true;
            service.onMouseMove(mockEvent, mockComponent);
            expect(mockComponent.selectTile).toHaveBeenCalledWith(mockEvent, 0, 0);
        });

        it('should call eraseTile when isMouseDownRight is true', () => {
            mockComponent.isMouseDownRight = true;
            service.onMouseMove(mockEvent, mockComponent);
            expect(mockTilesService.eraseTile).toHaveBeenCalledWith(mockComponent.board, 0, 0);
        });

        it('should not select tile if data-row or data-col is missing', () => {
            (mockEvent.target as HTMLElement).hasAttribute = () => false;
            service.onMouseMove(mockEvent, mockComponent);
            expect(mockComponent.selectTile).not.toHaveBeenCalled();
        });
    });
});
