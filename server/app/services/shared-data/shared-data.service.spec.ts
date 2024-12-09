import { Tiles } from '@app/model/schema/tiles.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { SharedDataService } from './shared-data.service';

describe('SharedDataService', () => {
    let service: SharedDataService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SharedDataService],
        }).compile();

        service = module.get<SharedDataService>(SharedDataService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('setBoard', () => {
        it('should set the board', () => {
            const mockBoard: Partial<Tiles>[][] = [
                [
                    {
                        fieldTile: 'grass',
                        position: { row: 0, col: 0 },
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                    },
                    {
                        fieldTile: 'stone',
                        position: { row: 0, col: 1 },
                        avatar: null,
                        object: null,
                        wall: true,
                        door: false,
                        isTileSelected: false,
                    },
                ],
                [
                    {
                        fieldTile: 'water',
                        position: { row: 1, col: 0 },
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                    },
                    {
                        fieldTile: 'sand',
                        position: { row: 1, col: 1 },
                        avatar: null,
                        object: null,
                        wall: false,
                        door: true,
                        isTileSelected: false,
                    },
                ],
            ] as Tiles[][];

            service.setBoard(mockBoard as Tiles[][]);
            const board = service.getBoard();

            expect(board).toEqual(mockBoard);
        });
    });

    describe('getBoard', () => {
        it('should return the current board', () => {
            const mockBoard: Partial<Tiles>[][] = [
                [
                    {
                        fieldTile: 'grass',
                        position: { row: 0, col: 0 },
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                    },
                ],
            ] as Tiles[][];

            service.setBoard(mockBoard as Tiles[][]);
            const board = service.getBoard();

            expect(board).toEqual(mockBoard);
        });

        it('should return undefined if the board is not set', () => {
            const board = service.getBoard();
            expect(board).toBeUndefined();
        });
    });
});
