import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Character } from '@app/interfaces/Character';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';

import { GAME_OBJECTS } from '@app/shared/game-objects';
import { BoardService } from './board.service';
const MOCK_BOARD: Tiles[][] = [
    [
        {
            object: GAME_OBJECTS['universalCube'].object,
            avatar: '',
            door: false,
            wall: false,
            fieldTile: '',
            isTileSelected: false,
            position: { row: 0, col: 0 },
        },
        {
            object: GAME_OBJECTS['universalCube'].object,
            avatar: '',
            door: false,
            wall: false,
            fieldTile: '',
            isTileSelected: false,
            position: { row: 0, col: 1 },
        },
    ],
    [
        {
            object: GAME_OBJECTS['universalCube'].object,
            avatar: '',
            door: false,
            wall: false,
            fieldTile: '',
            isTileSelected: false,
            position: { row: 1, col: 0 },
        },
        { object: null, avatar: '', door: false, wall: false, fieldTile: '', isTileSelected: false, position: { row: 1, col: 1 } },
    ],
];
const MOCK_CHARACTER1: Character = {
    name: '',
    face: '',
    image: '',
    body: 'testBody1',
    dice: '',
    stats: { attack: 0, defense: 0, health: 0, speed: 0 },
    disabled: false,
    victories: 0,
    position: null,
    initialPosition: null,
};
const MOCK_CHARACTER2: Character = {
    name: '',
    face: '',
    image: '',
    body: 'testBody2',
    dice: '',
    stats: { attack: 0, defense: 0, health: 0, speed: 0 },
    disabled: false,
    victories: 0,
    position: null,
    initialPosition: null,
};
const MOCK_PLAYER: Player = { username: 'test1', isAdmin: true, inventory: [null, null], character: { ...MOCK_CHARACTER1 } };
const MOCK_PLAYER2: Player = { username: 'test2', isAdmin: false, inventory: [null, null], character: { ...MOCK_CHARACTER2 } };
const MOCK_PLAYERS: Player[] = [{ ...MOCK_PLAYER }, { ...MOCK_PLAYER2 }];
describe('BoardService', () => {
    let service: BoardService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(withInterceptorsFromDi())],
        });
        service = TestBed.inject(BoardService);
    });

    describe('setBoard()', () => {
        it('should set the board correctly', () => {
            service.setBoard(MOCK_BOARD);

            expect(service.board).toEqual(MOCK_BOARD);
        });
    });
    describe('getBoardSize()', () => {
        it('should return the correct board size for "petite"', () => {
            const SMALL = 10;
            expect(service.getBoardSize('petite')).toBe(SMALL);
        });

        it('should return the correct board size for "moyenne"', () => {
            const MEDIUM = 15;
            expect(service.getBoardSize('moyenne')).toBe(MEDIUM);
        });

        it('should return the correct board size for "grande"', () => {
            const LARGE = 20;
            expect(service.getBoardSize('grande')).toBe(LARGE);
        });

        it('should return the default board size for unknown mapSize', () => {
            const SMALL = 10;
            expect(service.getBoardSize('unknown')).toBe(SMALL);
        });
    });

    describe('placePlayersOnBoard', () => {
        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn<any>(service, 'shuffleArray').and.callFake((array: Player[]) => array);
        });

        it('should shuffle players before placing them on the board', () => {
            const MOCK_BOARD_TEST = [...MOCK_BOARD];
            const players: Player[] = MOCK_PLAYERS;
            const VALUES = 0.5;
            spyOn(Math, 'random').and.returnValues(VALUES, VALUES);

            service.placePlayersOnBoard(MOCK_BOARD_TEST, players);

            expect(players[0].character.position).not.toBeNull();
            expect(players[1].character.position).not.toBeNull();
        });

        it('should place players only on tiles with universalCube and update player positions', () => {
            const MOCK_BOARD_TEST = [...MOCK_BOARD];
            const PLAYERS_TEST: Player[] = MOCK_PLAYERS;

            service.placePlayersOnBoard(MOCK_BOARD_TEST, PLAYERS_TEST);
            const playerTiles = MOCK_BOARD_TEST.flat().filter((tile) => tile.avatar);
            playerTiles.forEach((tile, index) => {
                expect(tile.avatar).toBe(PLAYERS_TEST[index].character.body);
                expect(tile.object).toBe('assets/object-universal-cube-only.png');
            });
        });

        it('should clear the universalCube object from the tile after placing a player and should remove spawn points if not used', () => {
            const MOCK_BOARD_TEST = [...MOCK_BOARD];
            const PLAYERS_TEST: Player[] = [...MOCK_PLAYERS];

            service.placePlayersOnBoard(MOCK_BOARD_TEST, PLAYERS_TEST);

            expect(MOCK_BOARD_TEST[0][0].object).toBe('assets/object-universal-cube-only.png');
            expect(MOCK_BOARD_TEST[1][0].object).toBe('');
            expect(MOCK_BOARD_TEST[0][1].object).toBe('assets/object-universal-cube-only.png');
        });

        describe('shuffleArray', () => {
            beforeEach(() => {
                service = new BoardService();
            });

            it('should return an array with the same elements but in a different order', () => {
                const PLAYERS = [...MOCK_PLAYERS];
                const VALUES1 = 0.3;
                const VALUES2 = 0.7;
                const VALUES3 = 0.2;
                const VALUES4 = 0.8;

                spyOn(Math, 'random').and.returnValues(VALUES1, VALUES2, VALUES3, VALUES4);

                const result = service['shuffleArray'](PLAYERS);

                expect(result).toEqual(jasmine.arrayContaining(PLAYERS));
                expect(result.length).toBe(PLAYERS.length);

                const sameOrder = PLAYERS.every((player, index) => player === result[index]);
                expect(sameOrder).toBeFalse();
            });
        });
    });
});
