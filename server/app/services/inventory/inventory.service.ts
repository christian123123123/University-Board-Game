import { ItemsGateway } from '@app/gateways/items/items.gateway';
import { Player } from '@app/model/schema/player.schema';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { BehaviorSubject } from 'rxjs';
import { Server } from 'socket.io';
import { STAT_OF_FOUR } from '@app/services/inventory/inventory.service.constants';
@Injectable()
export class InventoryService {
    @WebSocketServer() server: Server;
    inventorySource = new BehaviorSubject<[string | null, string | null]>([null, null]);
    inventory$ = this.inventorySource.asObservable();
    hasDecided: boolean = false;

    constructor(@Inject(forwardRef(() => ItemsGateway)) private readonly itemsGateway: ItemsGateway) {}

    addItemToInventory(item: string, player: Player): boolean {
        if (!player.inventory) {
            player.inventory = ['', ''];
        }

        const inventory = player.inventory;

        if (inventory[0] === null) {
            inventory[0] = item;
            this.inventorySource.next([inventory[0] ?? null, inventory[1] ?? null]);
            player.inventory = [...inventory];
            return true;
        } else if (inventory[1] === null) {
            inventory[1] = item;
            this.inventorySource.next([inventory[0] ?? null, inventory[1] ?? null]);
            player.inventory = [...inventory];
            return true;
        }

        return false;
    }

    removeItemFromInventory(item: string, player: Player): boolean {
        const inventory = player.inventory;
        const index = inventory.indexOf(item);
        if (index !== -1) {
            return true;
        }
        return false;
    }

    applyItemEffects(item: string, player: Player): void {
        switch (item) {
            case 'assets/object-Power-fruit-only.png':
                if (player.character.stats.health < STAT_OF_FOUR) {
                    player.character.stats.attack += STAT_OF_FOUR;
                }
                break;

            case 'assets/object-shield-only.png':
                if (player.character.stats.speed < STAT_OF_FOUR) {
                    player.character.stats.health += STAT_OF_FOUR;
                }
                break;

            case 'assets/object-space-sword-only.png':
                player.character.stats.attack += 2;
                player.character.stats.speed -= 1;
                break;

            case 'assets/object-boots-only.png':
                player.character.stats.speed += 2;
                player.character.stats.health -= 1;

                break;

            default:
                break;
        }
    }

    revertItemEffects(item: string, player: Player): void {
        switch (item) {
            case 'assets/object-Power-fruit-only.png':
                if (player.character.stats.health < STAT_OF_FOUR) {
                    player.character.stats.attack -= STAT_OF_FOUR;
                }
                break;

            case 'assets/object-shield-only.png':
                if (player.character.stats.speed < STAT_OF_FOUR) {
                    player.character.stats.health -= STAT_OF_FOUR;
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

            default:
                break;
        }
    }
}
