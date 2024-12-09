import { Injectable } from '@angular/core';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_TILES } from '@app/shared/game-tiles';

@Injectable({
    providedIn: 'root',
})

/* eslint-disable @typescript-eslint/no-non-null-assertion */ // this helps us manage some case without writing unnecessary code.
export class MovementService {
    showPreviewPath = false;
    remainingSpeed: number | null = null;
    stepValue: number = 1;
    board: Tiles[][];
    attainableTiles = new Set<string>();
    previewPathTiles: { row: number; col: number; direction: 'horizontal' | 'vertical' }[] = [];

    constructor(
        private sharedDataService: SharedDataService,
        private socketService: SocketService,
    ) {}

    findPath(start: { row: number; col: number }, destination: { row: number; col: number }) {
        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 },
        ];

        const queue: { position: { row: number; col: number }; path: { row: number; col: number }[]; cost: number }[] = [
            { position: start, path: [start], cost: 0 },
        ];

        const minCost = new Map<string, number>();
        minCost.set(`${start.row}-${start.col}`, 0);

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            const { position, path, cost } = queue.shift()!;

            if (position.row === destination.row && position.col === destination.col) {
                return path;
            }
            for (const direction of directions) {
                const newRow = position.row + direction.row;
                const newCol = position.col + direction.col;

                if (this.isValidTile(newRow, newCol)) {
                    const nextTile = this.board[newRow][newCol];
                    this.checkIfDoorIsOpen(nextTile);
                    this.checkNextTileStepValue(nextTile);

                    if (!nextTile.wall && !nextTile.door && !nextTile.avatar) {
                        let tileCost = 1;
                        if (nextTile.fieldTile === GAME_TILES.WATER) {
                            tileCost = 2;
                        } else if (nextTile.fieldTile === GAME_TILES.ICE) {
                            tileCost = 0;
                        }

                        const newCost = cost + tileCost;
                        const tileKey = `${newRow}-${newCol}`;

                        if (!minCost.has(tileKey) || newCost < minCost.get(tileKey)!) {
                            minCost.set(tileKey, newCost);
                            queue.push({
                                position: { row: newRow, col: newCol },
                                path: [...path, { row: newRow, col: newCol }],
                                cost: newCost,
                            });
                        }
                    }
                }
            }
        }

        return null;
    }

    isValidTile(row: number, col: number): boolean {
        return row >= 0 && col >= 0 && row < this.board.length && col < this.board[0].length;
    }

    checkNextTileStepValue(tile: Tiles) {
        if (tile.fieldTile === GAME_TILES.WATER) {
            this.stepValue = 2;
        } else if (tile.fieldTile === GAME_TILES.BASE || tile.fieldTile === GAME_TILES.DOOR_OPEN) {
            this.stepValue = 1;
        } else if (tile.fieldTile === GAME_TILES.ICE) {
            this.stepValue = 0;
        }
    }

    getTileCost(tile: Tiles): number {
        if (tile.fieldTile === GAME_TILES.WATER) {
            return 2;
        } else if (tile.fieldTile === GAME_TILES.ICE) {
            return 0;
        }
        return 1;
    }

    chanceOfStop(player: Player): boolean {
        const CHANCE = this.sharedDataService.getDebugModeStatus() ? 0 : 0.1;
        const INVENTORY = player.inventory!;
        if (INVENTORY[0] === 'assets/object-space-skates-only.png' || INVENTORY[1] === 'assets/object-space-skates-only.png') {
            return false;
        }
        return Math.random() < CHANCE;
    }

    checkIfDoorIsOpen(tile: Tiles) {
        if (tile.fieldTile === GAME_TILES.DOOR_CLOSED) {
            tile.door = true;
        } else {
            tile.door = false;
        }
    }

    highlightPossiblePaths(start: { row: number; col: number }, maxSteps: number): void {
        this.clearPathHighlights();
        this.showPreviewPath = true;
        this.attainableTiles.clear();

        const queue: { position: { row: number; col: number }; steps: number }[] = [{ position: start, steps: 0 }];
        const visited = new Map<string, number>();
        visited.set(`${start.row}-${start.col}`, 0);

        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 },
        ];

        while (queue.length > 0) {
            queue.sort((a, b) => a.steps - b.steps);
            const { position, steps } = queue.shift()!;
            const tile = this.board[position.row][position.col];

            tile.isTileSelected = true;
            this.attainableTiles.add(`${position.row}-${position.col}`);

            if (steps >= maxSteps) {
                continue;
            }

            for (const direction of directions) {
                const newRow = position.row + direction.row;
                const newCol = position.col + direction.col;

                if (this.isValidTile(newRow, newCol)) {
                    const nextTile = this.board[newRow][newCol];
                    this.checkIfDoorIsOpen(nextTile);
                    this.checkNextTileStepValue(nextTile);

                    if (!nextTile.wall && !nextTile.door && !nextTile.avatar) {
                        const tileCost = this.getTileCost(nextTile);
                        const newSteps = steps + tileCost;
                        const tileKey = `${newRow}-${newCol}`;

                        if (newSteps <= maxSteps && (!visited.has(tileKey) || newSteps < visited.get(tileKey)!)) {
                            queue.push({ position: { row: newRow, col: newCol }, steps: newSteps });
                            visited.set(tileKey, newSteps);
                        }
                    }
                }
            }
        }
    }

    clearPathHighlights(): void {
        this.showPreviewPath = false;

        for (const row of this.board) {
            for (const tile of row) {
                tile.isTileSelected = false;
            }
        }
    }

    isInExactPreviewPath(row: number, col: number, direction?: 'horizontal' | 'vertical'): boolean {
        const tile = this.previewPathTiles.find((t) => t.row === row && t.col === col);
        return tile ? (direction ? tile.direction === direction : true) : false;
    }

    clearPreviewPath(): void {
        this.previewPathTiles = [];
    }

    updatePlayerSpeed(newSpeed: number): void {
        this.remainingSpeed = newSpeed;
    }

    getAllAccessibleTilesRangeOne(playerPosition: { row: number; col: number }): Tiles[] {
        const allTiles = this.getAllTilesInRange(playerPosition, 1);
        return allTiles.filter((tile) => {
            return !tile.avatar && tile.fieldTile !== GAME_TILES.WALL && tile.fieldTile !== GAME_TILES.DOOR_CLOSED;
        });
    }

    getAllAccessibleTilesRangeTwo(playerPosition: { row: number; col: number }): Tiles[] {
        const allTiles = this.getAllTilesInRange(playerPosition, 2);
        return allTiles.filter((tile) => {
            return !tile.avatar && tile.fieldTile !== GAME_TILES.WALL && tile.fieldTile !== GAME_TILES.DOOR_CLOSED;
        });
    }

    getAllTilesInRange(playerPosition: { row: number; col: number }, range: number): Tiles[] {
        const tilesInRange: Tiles[] = [];
        for (let r = playerPosition.row - range; r <= playerPosition.row + range; r++) {
            for (let c = playerPosition.col - range; c <= playerPosition.col + range; c++) {
                if (this.isWithinBounds(r, c)) {
                    tilesInRange.push(this.board[r][c]);
                }
            }
        }
        return tilesInRange;
    }

    isWithinBounds(row: number, col: number): boolean {
        return row >= 0 && col >= 0 && row < this.board.length && col < this.board[0].length;
    }

    teleportToTile(row: number, col: number): void {
        if (!this.sharedDataService.getDebugModeStatus()) {
            return;
        }

        if (this.isValidTile(row, col)) {
            const tile = this.board[row][col];

            // Ensure the tile is valid (e.g., not a wall or occupied by another avatar)
            if (!tile.wall && !tile.avatar) {
                // Clear the player's current position
                for (let r = 0; r < this.board.length; r++) {
                    for (let c = 0; c < this.board[r].length; c++) {
                        if (this.board[r][c].avatar === this.sharedDataService.getPlayer().character.body) {
                            this.board[r][c].avatar = null;
                            // Teleport the player to the new position
                            tile.avatar = this.sharedDataService.getPlayer().character.body;
                            this.sharedDataService.getPlayer().character.position = { row, col };
                            // Emit a socket event to notify other players (optional)
                            this.socketService.emit('playerMove', {
                                player: this.sharedDataService.getPlayer(),
                                position: { row, col },
                                room: this.sharedDataService.getAccessCode(),
                                positionBeforeTeleportation: { r, c },
                                isTeleportation: true,
                            });
                        }
                    }
                }
            } else {
            }
        } else {
        }
    }
}
