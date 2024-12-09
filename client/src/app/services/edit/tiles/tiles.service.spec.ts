import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BoardComponent } from '@app/components/board/board.component';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_TILES } from '@app/shared/game-tiles';
import { TilesService } from './tiles.service';

describe('tilesService', () => {
    let service: TilesService;
    let mockComponent: jasmine.SpyObj<BoardComponent>;
    const MOCK_TILE: Tiles = {
        fieldTile: GAME_TILES.WATER,
        avatar: '',
        door: false,
        wall: false,
        object: 'object1',
        isTileSelected: false,
        position: { row: 0, col: 0 },
    };
    const MOCK_DOOR: Tiles = {
        fieldTile: GAME_TILES.DOOR_CLOSED,
        avatar: '',
        door: true,
        wall: false,
        object: '',
        isTileSelected: false,
        position: { row: 0, col: 0 },
    };
    const MOCK_WALL: Tiles = {
        fieldTile: GAME_TILES.WALL,
        avatar: '',
        door: false,
        wall: true,
        object: '',
        isTileSelected: false,
        position: { row: 0, col: 0 },
    };
    beforeEach(() => {
        mockComponent = jasmine.createSpyObj('BoardComponent', [], {
            objectRemoved: new EventEmitter<string>(),
        });
        TestBed.configureTestingModule({ providers: [TilesService] });
        service = TestBed.inject(TilesService);
    });

    it('should set tile as a door and emit objectRemoved if there is an object,', () => {
        const FAKE_OBJECT = 'objectblalbla';
        const MOCK_SELECTED_TILE_FROM_TOOL: Tiles = { ...MOCK_DOOR };
        const MOCK_TILE_ON_BOARD = { ...MOCK_TILE, object: FAKE_OBJECT };
        const objectRemoved = MOCK_TILE_ON_BOARD.object;
        spyOn(mockComponent.objectRemoved, 'emit');

        service.placeTile(MOCK_SELECTED_TILE_FROM_TOOL, MOCK_TILE_ON_BOARD, mockComponent);
        expect(MOCK_TILE_ON_BOARD.fieldTile).toBe(GAME_TILES.DOOR_CLOSED);
        expect(MOCK_TILE_ON_BOARD.door).toBeTrue();
        expect(MOCK_TILE_ON_BOARD.wall).toBeFalse();
        expect(MOCK_TILE_ON_BOARD.object).toBeNull();
        expect(mockComponent.objectRemoved.emit).toHaveBeenCalledWith(objectRemoved);
    });

    it('should replace a door by a field tile if a field tile is selected', () => {
        const MOCK_TILE_ON_BOARD: Tiles = {
            fieldTile: GAME_TILES.DOOR_CLOSED,
            door: true,
            avatar: '',
            wall: false,
            object: null,
            isTileSelected: false,
            position: { row: 0, col: 0 },
        };
        const MOCK_SELECTED_TILE_FROM_TOOL = { ...MOCK_TILE };

        service.placeTile(MOCK_SELECTED_TILE_FROM_TOOL, MOCK_TILE_ON_BOARD, mockComponent);
        expect(MOCK_TILE_ON_BOARD.fieldTile).toBe(GAME_TILES.WATER);
        expect(MOCK_TILE_ON_BOARD.door).toBeFalse();
        expect(MOCK_TILE_ON_BOARD.wall).toBeFalse();
    });

    it('should place a closed door if the tile on board is not a door', () => {
        const MOCK_TILE_ON_BOARD = { ...MOCK_TILE };
        const MOCK_DOOR_FROM_TOOL = { ...MOCK_DOOR };

        service.leftClickSelect(MOCK_DOOR_FROM_TOOL, MOCK_TILE_ON_BOARD, mockComponent);
        expect(MOCK_TILE_ON_BOARD.fieldTile).toBe(GAME_TILES.DOOR_CLOSED);
        expect(MOCK_TILE_ON_BOARD.door).toBeTrue();
        expect(MOCK_TILE_ON_BOARD.wall).toBeFalse();
    });
    it('should open the door if the tile on board is a door', () => {
        const MOCK_TILE_ON_BOARD = { ...MOCK_DOOR };
        const MOCK_DOOR_FROM_TOOL = { ...MOCK_DOOR };
        service.leftClickSelect(MOCK_DOOR_FROM_TOOL, MOCK_TILE_ON_BOARD, mockComponent);
        expect(MOCK_TILE_ON_BOARD.fieldTile).toBe(GAME_TILES.DOOR_OPEN);
        expect(MOCK_TILE_ON_BOARD.door).toBeTrue();
        expect(MOCK_TILE_ON_BOARD.wall).toBeFalse();
    });
    it('should close the door if the tile on board is an opened door', () => {
        const MOCK_TILE_ON_BOARD = { ...MOCK_DOOR, fieldTile: GAME_TILES.DOOR_OPEN };
        const MOCK_DOOR_FROM_TOOL = { ...MOCK_DOOR };
        service.leftClickSelect(MOCK_DOOR_FROM_TOOL, MOCK_TILE_ON_BOARD, mockComponent);
        expect(MOCK_TILE_ON_BOARD.fieldTile).toBe(GAME_TILES.DOOR_CLOSED);
        expect(MOCK_TILE_ON_BOARD.door).toBeTrue();
        expect(MOCK_TILE_ON_BOARD.wall).toBeFalse();
    });

    it('should return lastToggledTile if boardTile is a door and matches lastToggledTile', () => {
        const mockTile = { ...MOCK_DOOR };
        const selectedTileFromTool = { ...MOCK_DOOR };

        mockComponent.lastToggledTile = mockTile;
        const result = service.leftClickSelect(selectedTileFromTool, mockTile, mockComponent);
        expect(result).toBe(mockComponent.lastToggledTile);
    });

    it('should place a wall tile if the board tile has an object', () => {
        const MOCK_WALL_FROM_TOOL = { ...MOCK_WALL };

        const MOCK_TILE_ON_BOARD = { ...MOCK_TILE };

        spyOn(service, 'placeTile');

        service.leftClickSelect(MOCK_WALL_FROM_TOOL, MOCK_TILE_ON_BOARD, mockComponent);

        expect(service.placeTile).toHaveBeenCalledWith(MOCK_WALL_FROM_TOOL, MOCK_TILE_ON_BOARD, mockComponent);
    });

    it('should remove the object and emit ObjectRemoved when the tile has an object on right click', () => {
        const FAKE_OBJECT = 'aldaldal';
        const MOCK_TILE_ON_BOARD = { ...MOCK_TILE, object: FAKE_OBJECT };
        spyOn(mockComponent.objectRemoved, 'emit');

        service.rightClickSelect(mockComponent.board, MOCK_TILE_ON_BOARD, mockComponent);
        expect(MOCK_TILE_ON_BOARD.object).toBeNull();
        expect(mockComponent.objectRemoved.emit).toHaveBeenCalledWith(FAKE_OBJECT);
    });

    it('should return if right click on base tile with no objects', () => {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        const MOCK_TILE_ON_BOARD = { ...MOCK_TILE, object: null };
        mockComponent.board = [
            [{ fieldTile: GAME_TILES.BASE, avatar: '', object: null, door: false, wall: false, isTileSelected: false, position: { row: 0, col: 0 } }],
        ];
        spyOn(service, 'eraseTile').and.callThrough();
        service.eraseTile(mockComponent.board, MOCK_TILE_ON_BOARD.position!.row, MOCK_TILE_ON_BOARD.position!.col);
        expect(service.eraseTile).toHaveBeenCalledWith(mockComponent.board, MOCK_TILE_ON_BOARD.position!.row, MOCK_TILE_ON_BOARD.position!.col);
        expect(mockComponent.board[MOCK_TILE_ON_BOARD.position!.row][MOCK_TILE_ON_BOARD.position!.col].fieldTile).toBe(GAME_TILES.BASE);
        /* eslint-enable @typescript-eslint/no-non-null-assertion */ // disabled for tests and look in the rightClickSelect() method for more explanations.
    });
});
