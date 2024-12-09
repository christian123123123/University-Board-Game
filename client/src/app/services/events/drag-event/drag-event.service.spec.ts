import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BoardComponent } from '@app/components/board/board.component';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { DragEventService } from './drag-event.service';

describe('DragEventService', () => {
    let service: DragEventService;
    let mockEvent: DragEvent;
    let mockBoardComponent: BoardComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DragEventService);

        // Any is necessary because TypeScript's DragEvent interface includes many readonly properties,
        // making it difficult to mock all the required properties for testing.
        /* eslint-disable @typescript-eslint/no-explicit-any */
        mockEvent = {
            preventDefault: jasmine.createSpy('preventDefault'),
            dataTransfer: {
                setData: jasmine.createSpy('setData'),
                getData: jasmine.createSpy().and.returnValue('mockObjectUrl'),
            } as any,
        } as any;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        mockBoardComponent = {
            currentRoute: '',
            selectedTile: null,
            gameMode: 'normal',
            mapSize: 'medium',
            savedBoard: null,
            objectDropped: new EventEmitter<string>(),
            objectRemoved: new EventEmitter<string>(),
            originalRowIndex: null,
            originalColIndex: null,
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
            isMouseDownRight: false,
            isMouseDownLeft: false,
            lastToggledTile: null,
            disableMouseMove: false,
            boardService: jasmine.createSpyObj('BoardService', ['method1', 'method2']),
            tilesService: jasmine.createSpyObj('TilesService', ['method1', 'method2']),
            dragEventService: jasmine.createSpyObj('DragEventService', ['method1', 'method2']),
            mouseEventService: jasmine.createSpyObj('MouseEventService', ['onMouseDown', 'onMouseUp', 'onMouseMove']),
            objectsService: jasmine.createSpyObj('ObjectsService', ['method1', 'method2']),

            onRightClick: jasmine.createSpy('onRightClick'),
            onMouseUp: jasmine.createSpy('onMouseUp'),
            onMouseDown: jasmine.createSpy('onMouseDown'),
            onMouseMove: jasmine.createSpy('onMouseMove'),
            ngOnInit: jasmine.createSpy('ngOnInit'),
            ngOnChanges: jasmine.createSpy('ngOnChanges'),
            getBoardState: jasmine.createSpy('getBoardState').and.returnValue([]),
            initializeBoard: jasmine.createSpy('initializeBoard'),
            selectTile: jasmine.createSpy('selectTile'),
        };

        spyOn(mockBoardComponent.objectRemoved as EventEmitter<string>, 'emit');
        spyOn(mockBoardComponent.objectDropped as EventEmitter<string>, 'emit');
    });

    describe('onDragStart', () => {
        it('should prevent default if the object count is zero', () => {
            GAME_OBJECTS['testObject'] = { object: 'mockObjectUrl', count: 0, description: '' };
            service.onDragStart(mockEvent, 'testObject');
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should set data if the object count is greater than zero', () => {
            GAME_OBJECTS['testObject'] = { object: 'mockObjectUrl', count: 1, description: '' };
            service.onDragStart(mockEvent, 'testObject');
            expect(mockEvent.dataTransfer?.setData).toHaveBeenCalledWith('text/plain', 'mockObjectUrl');
        });
    });

    describe('onDragStartFromTile', () => {
        it('should set data if tile has an object', () => {
            const tile: Tiles = {
                avatar: '',
                object: 'mockObjectUrl',
                position: { row: 0, col: 0 },
                door: false,
                wall: false,
                fieldTile: '',
                isTileSelected: false,
            };
            service.onDragStartFromTile(mockEvent, tile, mockBoardComponent);
            expect(mockEvent.dataTransfer?.setData).toHaveBeenCalledWith('text/plain', 'mockObjectUrl');
            expect(mockBoardComponent.originalRowIndex).toBe(0);
            expect(mockBoardComponent.originalColIndex).toBe(0);
        });

        it('should not set data if tile does not have an object', () => {
            const tile: Tiles = {
                avatar: '',
                object: null,
                position: { row: 0, col: 0 },
                door: false,
                wall: false,
                fieldTile: '',
                isTileSelected: false,
            };
            service.onDragStartFromTile(mockEvent, tile, mockBoardComponent);
            expect(mockEvent.dataTransfer?.setData).not.toHaveBeenCalled();
        });
    });

    describe('onDrop', () => {
        it('should move object from original tile if originalRowIndex and originalColIndex are not null', () => {
            const mockObjectUrl = 'mockObjectUrl';
            GAME_OBJECTS['testObject'] = { object: mockObjectUrl, count: 1, description: '' };

            mockBoardComponent.originalRowIndex = 0;
            mockBoardComponent.originalColIndex = 0;
            mockBoardComponent.board[0][0].object = mockObjectUrl;

            service.onDrop(mockEvent, 1, 1, mockBoardComponent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockBoardComponent.board[0][0].object).toBeNull();
            expect(mockBoardComponent.board[1][1].object).toBe(mockObjectUrl);
        });
        it('should prevent default and emit objectDropped if conditions are met', () => {
            GAME_OBJECTS['testObject'] = { object: 'mockObjectUrl', count: 1, description: '' };
            mockBoardComponent.board = [
                [
                    {
                        avatar: null,
                        object: null,
                        door: false,
                        wall: false,
                        fieldTile: '',
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];

            service.onDrop(mockEvent, 0, 0, mockBoardComponent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockBoardComponent.objectDropped.emit).toHaveBeenCalledWith('mockObjectUrl');
            expect(mockBoardComponent.board[0][0].object).toBe('mockObjectUrl');
        });

        it('should not emit if the tile already has an object', () => {
            GAME_OBJECTS['testObject'] = { object: 'mockObjectUrl', count: 1, description: '' };
            mockBoardComponent.board = [
                [
                    {
                        avatar: '',
                        object: 'existingObject',
                        door: false,
                        wall: false,
                        fieldTile: '',
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];

            service.onDrop(mockEvent, 0, 0, mockBoardComponent);

            expect(mockBoardComponent.objectDropped.emit).not.toHaveBeenCalled();
            expect(mockBoardComponent.board[0][0].object).toBe('existingObject');
        });

        it('should emit if object place in void (outside of board)', () => {
            GAME_OBJECTS['testObject'] = { object: 'mockObjectUrl', count: 1, description: '' };

            mockBoardComponent.board = [
                [
                    {
                        avatar: '',
                        object: 'existingObject',
                        door: false,
                        wall: false,
                        fieldTile: '',
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];
            service.onDrop(mockEvent, null, null, mockBoardComponent);
            expect(mockBoardComponent.objectRemoved.emit).toHaveBeenCalledWith('mockObjectUrl');
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });
    });

    describe('onGlobalDrop', () => {
        it('should prevent default and remove object if conditions are met', () => {
            mockBoardComponent.originalRowIndex = 0;
            mockBoardComponent.originalColIndex = 0;
            mockBoardComponent.board = [
                [
                    {
                        avatar: '',
                        object: 'mockObjectUrl',
                        door: false,
                        wall: false,
                        fieldTile: '',
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];

            service.onGlobalDrop(mockEvent, mockBoardComponent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockBoardComponent.board[0][0].object).toBeNull();
            expect(mockBoardComponent.objectRemoved.emit).toHaveBeenCalledWith('mockObjectUrl');
        });

        it('should not do anything if no object is being dragged', () => {
            jasmine.createSpyObj('dataTransfer', ['getData', 'setData']);
            service.onGlobalDrop(mockEvent, mockBoardComponent);
            expect(mockBoardComponent.objectRemoved.emit).not.toHaveBeenCalled();
        });
    });

    describe('onDragOver', () => {
        it('should prevent default', () => {
            service.onDragOver(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });
    });
});
