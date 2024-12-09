import { ItemsGateway } from '@app/gateways/items/items.gateway';
import { Player } from '@app/model/schema/player.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
    let service: InventoryService;

    const mockPlayer = {
        username: 'test-player',
        inventory: ['', ''],
        character: {
            stats: {
                health: 3,
                attack: 2,
                speed: 2,
            },
        },
    };

    const mockItemsGateway = {
        server: {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InventoryService,
                {
                    provide: ItemsGateway,
                    useValue: mockItemsGateway,
                },
            ],
        }).compile();

        service = module.get<InventoryService>(InventoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('addItemToInventory', () => {
        it('should add an item to the first slot if empty', () => {
            const result = service.addItemToInventory('item1', mockPlayer as Player);
            expect(result).toBe(false);
            expect(mockPlayer.inventory).toEqual(mockPlayer.inventory);
        });

        it('should add an item to the second slot if the first is occupied', () => {
            mockPlayer.inventory[0] = 'item1';
            const result = service.addItemToInventory('item2', mockPlayer as Player);
            expect(result).toBe(false);
            expect(mockPlayer.inventory).toEqual(mockPlayer.inventory);
        });

        it('should not add an item if both slots are occupied', () => {
            mockPlayer.inventory = ['item1', 'item2'];
            const result = service.addItemToInventory('item3', mockPlayer as Player);
            expect(result).toBe(false);
            expect(mockPlayer.inventory).toEqual(['item1', 'item2']);
        });
    });

    describe('removeItemFromInventory', () => {
        it('should remove an item from the inventory', () => {
            mockPlayer.inventory = ['item1', 'item2'];
            const result = service.removeItemFromInventory('item1', mockPlayer as Player);
            expect(result).toBe(true);
        });

        it('should return false if the item is not in the inventory', () => {
            mockPlayer.inventory = ['item1', 'item2'];
            const result = service.removeItemFromInventory('item3', mockPlayer as Player);
            expect(result).toBe(false);
        });
    });

    describe('applyItemEffects', () => {
        it('should apply Power Fruit effects', () => {
            service.applyItemEffects('assets/object-Power-fruit-only.png', mockPlayer as Player);
            const NEW_ATTACK = 6;
            expect(mockPlayer.character.stats.attack).toBe(NEW_ATTACK);
        });

        it('should apply Shield effects', () => {
            service.applyItemEffects('assets/object-shield-only.png', mockPlayer as Player);
            const NEW_HEALTH = 7;
            expect(mockPlayer.character.stats.health).toBe(NEW_HEALTH);
        });

        it('should apply Space Sword effects', () => {
            service.applyItemEffects('assets/object-space-sword-only.png', mockPlayer as Player);
            const NEW_ATTACK = 8;
            const NEW_SPEED = 1;

            expect(mockPlayer.character.stats.attack).toBe(NEW_ATTACK);
            expect(mockPlayer.character.stats.speed).toBe(NEW_SPEED);
        });

        it('should apply Boots effects', () => {
            service.applyItemEffects('assets/object-boots-only.png', mockPlayer as Player);
            const NEW_SPEED = 3;
            const NEW_HEALTH = 6;

            expect(mockPlayer.character.stats.speed).toBe(NEW_SPEED);
            expect(mockPlayer.character.stats.health).toBe(NEW_HEALTH);
        });
    });

    describe('revertItemEffects', () => {
        it('should revert Power Fruit effects', () => {
            service.revertItemEffects('assets/object-Power-fruit-only.png', mockPlayer as Player);
            const NEW_ATTACK = 8;
            expect(mockPlayer.character.stats.attack).toBe(NEW_ATTACK);
        });

        it('should revert Shield effects', () => {
            service.revertItemEffects('assets/object-shield-only.png', mockPlayer as Player);
            const NEW_HEALTH = 2;
            expect(mockPlayer.character.stats.health).toBe(NEW_HEALTH);
        });

        it('should revert Space Sword effects', () => {
            service.revertItemEffects('assets/object-space-sword-only.png', mockPlayer as Player);
            const NEW_ATTACK = 6;
            const NEW_SPEED = 4;

            expect(mockPlayer.character.stats.attack).toBe(NEW_ATTACK);
            expect(mockPlayer.character.stats.speed).toBe(NEW_SPEED);
        });

        it('should revert Boots effects', () => {
            service.revertItemEffects('assets/object-boots-only.png', mockPlayer as Player);
            const NEW_HEALTH = 3;
            const NEW_SPEED = 2;
            expect(mockPlayer.character.stats.speed).toBe(NEW_SPEED);
            expect(mockPlayer.character.stats.health).toBe(NEW_HEALTH);
        });
    });

    describe('BehaviorSubject', () => {
        it('should update the inventorySource on adding an item', () => {
            service.addItemToInventory('item1', mockPlayer as Player);
            expect(service.inventorySource.getValue()).toEqual(service.inventorySource.getValue());
        });

        it('should not update the inventorySource if the inventory is full', () => {
            mockPlayer.inventory = ['item1', 'item2'];
            service.addItemToInventory('item3', mockPlayer as Player);
            expect(service.inventorySource.getValue()).toEqual([null, null]);
        });
    });
});
