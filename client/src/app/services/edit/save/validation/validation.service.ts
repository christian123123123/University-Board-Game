import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_OBJECTS } from '@app/shared/game-objects';

@Injectable({
    providedIn: 'root',
})
export class ValidationService {
    isTitleOrDescriptionMissing(game: Omit<Game, '_id' | 'updatedAt'>): boolean {
        if (!game.title || !game.description) {
            return true;
        } else {
            return false;
        }
    }

    areStartingPointsSet(board: Tiles[][], mapSize: string): boolean {
        let requiredStartingPoints: number;

        switch (mapSize) {
            case 'petite':
                requiredStartingPoints = 2;
                break;
            case 'moyenne':
                requiredStartingPoints = 4;
                break;
            case 'grande':
                requiredStartingPoints = 6;
                break;
            default:
                requiredStartingPoints = 2;
        }

        let universalCubeCount = 0;

        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const tile = board[row][col];

                if (tile.object === GAME_OBJECTS.universalCube.object) {
                    universalCubeCount++;
                }
            }
        }

        return universalCubeCount === requiredStartingPoints;
    }
    isFlagHere(board: Tiles[][]): boolean {
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const tile = board[row][col];
                if (tile.object === GAME_OBJECTS['flag'].object) {
                    return true;
                }
            }
        }
        return false;
    }

    isValidBoardPercentage(currentBoard: Tiles[][]): boolean {
        const FIELD_TILE_COVERAGE_RATE = 0.5;
        const terrainTiles = ['assets/water-tiles.png', 'assets/ice-tiles.png', 'assets/moon-tiles.png'];
        const totalTiles = currentBoard.length ** 2;
        const totalFieldTileCount = currentBoard.reduce((count, row) => {
            return count + row.filter((col) => terrainTiles.includes(col.fieldTile)).length;
        }, 0);
        return totalFieldTileCount / totalTiles > FIELD_TILE_COVERAGE_RATE;
    }

    areAllTerrainTilesAccessible(currentBoard: Tiles[][]): boolean {
        const terrainTiles = [
            'assets/water-tiles.png',
            'assets/ice-tiles.png',
            'assets/moon-tiles.png',
            'assets/door-tilesV2.0.png',
            'assets/open-door.png',
        ];
        const rows = currentBoard.length;
        const cols = currentBoard[0].length;

        const visited = this.initializeVisitedArray(rows, cols);
        const [startRow, startCol] = this.findFirstTerrainTile(currentBoard, terrainTiles);
        if (startRow === -1 || startCol === -1) return false;

        this.breadthFirstSearch(currentBoard, terrainTiles, visited, startRow, startCol);

        return this.checkAllTerrainTilesVisited(currentBoard, terrainTiles, visited);
    }
    isDoorNotSurrounded(currentBoard: Tiles[][]): boolean {
        const results: boolean[] = [];

        currentBoard.forEach((row) => {
            row.forEach((col) => {
                if (col.door && col.position) {
                    const currentRow = col.position.row;
                    const currentCol = col.position.col;

                    const leftTile = this.getAdjacentTile(currentBoard, currentRow, currentCol - 1);
                    const rightTile = this.getAdjacentTile(currentBoard, currentRow, currentCol + 1);
                    const upperTile = this.getAdjacentTile(currentBoard, currentRow - 1, currentCol);
                    const downTile = this.getAdjacentTile(currentBoard, currentRow + 1, currentCol);

                    const isSurrounded = this.isDoorSurrounded(leftTile, rightTile, upperTile, downTile);
                    results.push(isSurrounded);
                }
            });
        });

        return results.includes(true);
    }
    private findFirstTerrainTile(currentBoard: Tiles[][], terrainTiles: string[]): [number, number] {
        for (let r = 0; r < currentBoard.length; r++) {
            for (let c = 0; c < currentBoard[0].length; c++) {
                if (terrainTiles.includes(currentBoard[r][c].fieldTile)) {
                    return [r, c];
                }
            }
        }
        return [-1, -1];
    }

    private initializeVisitedArray(rows: number, cols: number): boolean[][] {
        return Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(false));
    }

    private breadthFirstSearch(currentBoard: Tiles[][], terrainTiles: string[], visited: boolean[][], startRow: number, startCol: number): void {
        const queue = [[startRow, startCol]];
        visited[startRow][startCol] = true;

        const directions = [
            [-1, 0], // Up
            [1, 0], // Down
            [0, -1], // Left
            [0, 1], // Right
        ];

        while (queue.length > 0) {
            const [currentRow, currentCol] = queue.shift() as [number, number]; // always going to return an array of two number -> avoids non-null assertion
            for (const [dRow, dCol] of directions) {
                const newRow = currentRow + dRow;
                const newCol = currentCol + dCol;

                if (
                    newRow >= 0 &&
                    newRow < currentBoard.length &&
                    newCol >= 0 &&
                    newCol < currentBoard[0].length &&
                    !visited[newRow][newCol] &&
                    terrainTiles.includes(currentBoard[newRow][newCol].fieldTile)
                ) {
                    visited[newRow][newCol] = true;
                    queue.push([newRow, newCol]);
                }
            }
        }
    }

    private checkAllTerrainTilesVisited(currentBoard: Tiles[][], terrainTiles: string[], visited: boolean[][]): boolean {
        for (let r = 0; r < currentBoard.length; r++) {
            for (let c = 0; c < currentBoard[0].length; c++) {
                if (terrainTiles.includes(currentBoard[r][c].fieldTile) && !visited[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    private getAdjacentTile(currentBoard: Tiles[][], row: number, col: number): Tiles | null {
        return row >= 0 && row < currentBoard.length && col >= 0 && col < currentBoard[0].length ? currentBoard[row][col] : null;
    }

    private isDoorSurrounded(leftTile: Tiles | null, rightTile: Tiles | null, upperTile: Tiles | null, downTile: Tiles | null): boolean {
        const upperAdjacentWall = !upperTile || upperTile.wall;
        const rightAdjacentWall = !rightTile || rightTile.wall;
        const leftAdjacentWall = !leftTile || leftTile.wall;
        const downAdjacentWall = !downTile || downTile.wall;

        if (leftAdjacentWall && rightAdjacentWall && !upperAdjacentWall && !downAdjacentWall) {
            return false;
        } else if (!leftAdjacentWall && !rightAdjacentWall && upperAdjacentWall && downAdjacentWall) {
            return false;
        } else {
            return true;
        }
    }
}
