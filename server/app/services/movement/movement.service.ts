import { Tiles } from '@app/model/schema/tiles.schema';
import { GAME_TILES } from '@app/shared/game-tiles';
import { Injectable } from '@nestjs/common';
import { InventoryService } from '@app/services/inventory/inventory.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';

@Injectable()
/* eslint-disable @typescript-eslint/no-non-null-assertion */ // this helps us manage some case without writing unnecessary code.
export class MovementService {
    showPreviewPath = false;
    remainingSpeed: number | null = null;
    stepValue: number = 1;
    board: Tiles[][];
    attainableTiles = new Set<string>();
    previewPathTiles: { row: number; col: number; direction: 'horizontal' | 'vertical' }[] = [];
    constructor(
        private inventoryService: InventoryService,
        private sharedDataService: SharedDataService,
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
                    this.board = this.sharedDataService.getBoard();
                    const nextTile = this.board[newRow][newCol];
                    this.checkNextTileStepValue(nextTile);

                    if (!nextTile.wall && nextTile.fieldTile !== GAME_TILES.DOOR_CLOSED && !nextTile.avatar) {
                        let tileCost = 1;
                        if (nextTile.fieldTile === GAME_TILES.WATER) {
                            tileCost = 2;
                        } else if (nextTile.fieldTile === GAME_TILES.ICE) {
                            tileCost = 0;
                        } else if (nextTile.fieldTile === GAME_TILES.DOOR_OPEN) {
                            tileCost = 1;
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
        this.board = this.sharedDataService.getBoard();
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

    chanceOfStop(): boolean {
        const CHANCE = 0.1;
        const INVENTORY = this.inventoryService.inventorySource.getValue();
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
}
