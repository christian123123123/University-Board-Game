import { Injectable } from '@angular/core';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { GAME_TILES } from '@app/shared/game-tiles';

@Injectable({
    providedIn: 'root',
})
export class BoardService {
    GAME_TILES = GAME_TILES;
    board: Tiles[][];
    defaultTile: Tiles = {
        fieldTile: this.GAME_TILES.BASE,
        object: '',
        door: false,
        wall: false,
        isTileSelected: false,
        position: { row: 0, col: 0 },
        avatar: '',
    };

    setBoard(newBoard: Tiles[][]): void {
        this.board = newBoard;
    }

    getBoardSize(mapSize: string): number {
        const SMALL = 10;
        const MEDIUM = 15;
        const LARGE = 20;
        switch (mapSize) {
            case 'petite':
                return SMALL;
            case 'moyenne':
                return MEDIUM;
            case 'grande':
                return LARGE;
            default:
                return SMALL;
        }
    }

    getNewBoard(boardSize: number): Tiles[][] {
        return Array.from({ length: boardSize }, (_, row) =>
            Array.from({ length: boardSize }, (__, col) => ({
                ...this.defaultTile,
                position: { row, col },
            })),
        );
    }

    getFlippedBoard(board: Tiles[][]): Tiles[][] {
        return board.slice().reverse();
    }

    placePlayersOnBoard(board: Tiles[][], players: Player[]): Tiles[][] {
        const shuffledPlayers = this.shuffleArray(players);
        let playerIndex = 0;
        for (const row of board) {
            for (const tile of row) {
                if (playerIndex < shuffledPlayers.length && tile.object === GAME_OBJECTS['universalCube'].object) {
                    players[playerIndex].character.position = tile.position;
                    tile.avatar = players[playerIndex].character.body;
                    players[playerIndex].character.initialPosition = tile.position;
                    playerIndex++;
                } else if (tile.object === GAME_OBJECTS['universalCube'].object) {
                    tile.object = '';
                }
            }
        }
        return board;
    }
    shuffleArray(array: Player[]): Player[] {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }
}
