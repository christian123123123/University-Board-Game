import { Injectable } from '@angular/core';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from '../socket/socket.service';

@Injectable({
    providedIn: 'root',
})
export class InventoryService {
    public inventorySource = new BehaviorSubject<[string | null, string | null]>([null, null]);
    inventory$ = this.inventorySource.asObservable();

    constructor(readonly socketService: SocketService) {}

    private itemNameMap: { [key: string]: string } = {
        'assets/object-Power-fruit-only.png': 'Fruit de pouvoir',
        'assets/object-shield-only.png': 'Bouclier',
        'assets/object-space-sword-only.png': 'Épée espace',
        'assets/object-boots-only.png': 'Souliers de vitesse',
        'assets/object-flag-only.png': 'Drapeau',
        'assets/object-master-key-only.png': 'Clef',
        'assets/object-space-skates-only.png': 'Patins',
    };

    getItemNameFromPath(itemPath: string): string {
        return this.itemNameMap[itemPath] || 'Unknown Item';
    }

    addItemToInventory(item: string, player: Player): boolean {
        if (!player.inventory) {
            player.inventory = [null, null];
        }

        const inventory = player.inventory;

        if (inventory[0] === null || inventory[0] === '') {
            inventory[0] = item;
            this.inventorySource.next(inventory);
            player.inventory = [...inventory];
            return true;
        } else if (inventory[1] === null || inventory[1] === '') {
            inventory[1] = item;
            this.inventorySource.next(inventory);
            player.inventory = [...inventory];

            return true;
        }
        return false;
    }

    removeItemFromInventory(item: string, player: Player): boolean {
        const inventory = player.inventory!;
        const index = inventory.indexOf(item);
        if (index !== -1) {
            return true;
        }
        return false;
    }

    applyItemEffects(item: string, player: Player): void {
        player.character.effects = player.character.effects || [];
        switch (item) {
            case 'assets/object-Power-fruit-only.png':
                player.character.stats.attack += 4;
                player.character.effects!.push('Power-fruit');
                break;
            case 'assets/object-shield-only.png':
                player.character.stats.defense += 4;
                player.character.effects!.push('Shield');
                break;
            case 'assets/object-space-sword-only.png':
                player.character.stats.attack += 2;
                player.character.stats.speed -= 1;
                break;
            case 'assets/object-boots-only.png':
                player.character.stats.speed += 2;
                player.character.stats.health -= 1;
                break;

            case 'assets/object-flag-only.png':
                player.character.hasFlag = true;
                break;
            default:
                break;
        }
    }

    revertItemEffects(item: string, player: Player): void {
        switch (item) {
            case 'assets/object-Power-fruit-only.png':
                if (player.character.effects!.includes('Power-fruit')) {
                    player.character.stats.attack -= 4;
                    player.character.effects = player.character.effects!.filter((e) => e !== 'Power-fruit');
                }
                break;
            case 'assets/object-shield-only.png':
                if (player.character.effects!.includes('Shield')) {
                    player.character.stats.defense -= 4;
                    player.character.effects = player.character.effects!.filter((e) => e !== 'Shield');
                }
                break;
            case 'assets/object-space-sword-only.png':
                player.character.stats.attack -= 2;
                player.character.stats.speed += 1;

                break;
            case 'assets/object-boots-only.png':
                player.character.stats.speed -= 2;
                player.character.stats.health += 1;

                break;

            case 'assets/object-flag-only.png':
                player.character.hasFlag = false;
                break;
            default:
                break;
        }
    }

    placeItemsOnNearestTiles(
        inventory: [string | null, string | null],
        playerPosition: { row: number; col: number },
        board: Tiles[][],
        room: string,
    ): void {
        const itemsToPlace = inventory.filter((item) => item !== null) as string[];
        const availableTiles = this.findNearestAvailableTiles(playerPosition, board, itemsToPlace.length);

        if (!playerPosition || !board) {
            return;
        }

        itemsToPlace.forEach((item, index) => {
            if (availableTiles[index]) {
                const { row, col } = availableTiles[index];
                board[row][col].object = item;
                this.socketService.emit('itemDropped', {
                    item,
                    position: { row, col },
                    room,
                });
            }
        });

        inventory[0] = null;
        inventory[1] = null;
    }

    private findNearestAvailableTiles(position: { row: number; col: number }, board: Tiles[][], maxTiles: number): { row: number; col: number }[] {
        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 },
        ];
        const visited = new Set<string>();
        const queue = [position];
        const result: { row: number; col: number }[] = [];

        while (queue.length > 0 && result.length < maxTiles) {
            const current = queue.shift()!;
            const { row, col } = current;

            visited.add(`${row},${col}`);

            const tile = board[row]?.[col];

            if (
                tile &&
                tile.fieldTile &&
                !tile.avatar &&
                !tile.object &&
                !tile.wall &&
                !tile.door &&
                (row !== position.row || col !== position.col)
            ) {
                result.push({ row, col });
                if (result.length >= maxTiles) break;
            }

            directions.forEach((dir) => {
                const newRow = row + dir.row;
                const newCol = col + dir.col;
                if (board[newRow]?.[newCol] && !visited.has(`${newRow},${newCol}`)) {
                    queue.push({ row: newRow, col: newCol });
                }
            });
        }

        return result;
    }

    clearInventory(): void {
        this.inventorySource.next([null, null]);
    }
}
