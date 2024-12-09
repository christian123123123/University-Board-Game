import { Injectable } from '@angular/core';
import { BoardComponent } from '@app/components/board/board.component';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_TILES } from '@app/shared/game-tiles';

@Injectable({
    providedIn: 'root',
})
export class TilesService {
    placeTile(selectedTileFromTool: Tiles, tileOnBoard: Tiles, component: BoardComponent): void {
        if (selectedTileFromTool.fieldTile === GAME_TILES.DOOR_CLOSED) {
            tileOnBoard.door = true;
            tileOnBoard.wall = false;
            this.removeObjectOnTile(tileOnBoard, component);
        } else if (selectedTileFromTool.fieldTile === GAME_TILES.WALL) {
            tileOnBoard.wall = true;
            tileOnBoard.door = false;

            this.removeObjectOnTile(tileOnBoard, component);
        } else {
            tileOnBoard.door = false;
            tileOnBoard.wall = false;
        }
        tileOnBoard.fieldTile = selectedTileFromTool.fieldTile;
    }

    leftClickSelect(selectedTileFromTool: Tiles, boardTile: Tiles, board: BoardComponent): Tiles | null {
        if (selectedTileFromTool.door) {
            if (!boardTile.door) {
                this.placeTile(selectedTileFromTool, boardTile, board);
                return boardTile;
            }
            if (boardTile !== board.lastToggledTile) {
                this.toggleDoor(boardTile);
                return boardTile;
            } else {
                return board.lastToggledTile;
            }
        }
        if (selectedTileFromTool.wall && boardTile.object) {
            this.placeTile(selectedTileFromTool, boardTile, board);
        }
        if (boardTile.fieldTile !== selectedTileFromTool.fieldTile && !boardTile.object) {
            this.placeTile(selectedTileFromTool, boardTile, board);
        }

        return board.lastToggledTile;
    }

    rightClickSelect(board: Tiles[][], currentTile: Tiles, component: BoardComponent): void {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */ // Those const cannot be null in this case because when a right click occurs on a tile, there is always a coord for that tile.
        const objectToRemove = currentTile.object;
        const currentTileRow = currentTile.position!.row;
        const currentTileCol = currentTile.position!.col;
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
        if (objectToRemove) {
            currentTile.object = null;
            component.objectRemoved.emit(objectToRemove);
        } else {
            this.eraseTile(board, currentTileRow, currentTileCol);
        }
    }

    isDoorOpen(tile: Tiles): boolean {
        return tile.fieldTile === GAME_TILES.DOOR_OPEN;
    }

    toggleDoor(tile: Tiles): void {
        if (this.isDoorOpen(tile)) {
            tile.fieldTile = GAME_TILES.DOOR_CLOSED;
        } else {
            tile.fieldTile = GAME_TILES.DOOR_OPEN;
        }
    }

    eraseTile(board: Tiles[][], row: number, col: number): void {
        const tile = board[row][col];
        if (tile.fieldTile === GAME_TILES.BASE) {
            return;
        }
        tile.fieldTile = GAME_TILES.BASE;
        tile.wall = false;
        tile.door = false;
    }
    private removeObjectOnTile(tileBoard: Tiles, board: BoardComponent): void {
        if (tileBoard.object) {
            board.objectRemoved.emit(tileBoard.object);
            tileBoard.object = null;
        }
    }
}
