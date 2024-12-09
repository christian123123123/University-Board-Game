import { TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
    let service: InventoryService;
    let mockPlayer: Player;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(InventoryService);

        mockPlayer = {
            character: {
                stats: {
                    attack: 5,
                    defense: 3,
                    speed: 3,
                    health: 2,
                },
            },
        } as Player;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('addItemToInventory', () => {
        it('should add an item to the first empty slot', () => {
            const result = service.addItemToInventory('item1', mockPlayer);
            expect(result).toBeTrue();
            service.inventory$.subscribe((inventory) => {
                expect(inventory[0]).toBe('item1');
                expect(inventory[1]).toBeNull();
            });
        });

        it('should add an item to the second empty slot', () => {
            service.addItemToInventory('item1', mockPlayer);
            const result = service.addItemToInventory('item2', mockPlayer);
            expect(result).toBeTrue();
            service.inventory$.subscribe((inventory) => {
                expect(inventory[1]).toBe('item2');
            });
        });

        it('should not add an item if the inventory is full', () => {
            service.addItemToInventory('item1', mockPlayer);
            service.addItemToInventory('item2', mockPlayer);
            const result = service.addItemToInventory('item3', mockPlayer);
            expect(result).toBeFalse();
        });
    });

    describe('removeItemFromInventory', () => {
        it('should remove an item from the inventory', () => {
            service.addItemToInventory('item1', mockPlayer);
            const result = service.removeItemFromInventory('item1', mockPlayer);
            expect(result).toBeTrue();
        });

        it('should return false if the item does not exist in the inventory', () => {
            // Ensure inventory is initialized
            mockPlayer.inventory = [null, null];

            const result = service.removeItemFromInventory('nonexistent-item', mockPlayer);
            expect(result).toBeFalse();
        });
    });

    describe('applyItemEffects', () => {
        it('should correctly apply effects of the Power Fruit', () => {
            service.applyItemEffects('assets/object-Power-fruit-only.png', mockPlayer);
            expect(mockPlayer.character.stats.attack).toBe(9);
        });

        it('should correctly apply effects of the Shield', () => {
            service.applyItemEffects('assets/object-shield-only.png', mockPlayer);
            expect(mockPlayer.character.stats.defense).toBe(7); // Expect defense to be 7
        });

        it('should correctly revert effects of the Space Sword', () => {
            service.applyItemEffects('assets/object-space-sword-only.png', mockPlayer);
            service.revertItemEffects('assets/object-space-sword-only.png', mockPlayer);
            expect(mockPlayer.character.stats.attack).toBe(5); // Expect attack to revert to 5
            expect(mockPlayer.character.stats.speed).toBe(3); // Expect speed to revert to 3
        });

        it('should correctly apply effects of the Boots', () => {
            service.applyItemEffects('assets/object-boots-only.png', mockPlayer);
            expect(mockPlayer.character.stats.speed).toBe(5);
            expect(mockPlayer.character.stats.health).toBe(1);
        });
        it('should do nothing for an unrecognized item (default case)', () => {
            const originalStats = { ...mockPlayer.character.stats };
            service.applyItemEffects('unknown-item', mockPlayer);
            expect(mockPlayer.character.stats).toEqual(originalStats);
        });

        it('should correctly set hasFlag to true when picking up the flag', () => {
            // Initially, hasFlag should be false
            expect(mockPlayer.character.hasFlag).toBeFalsy();

            // Apply the flag effect
            service.applyItemEffects('assets/object-flag-only.png', mockPlayer);

            // Now, hasFlag should be true
            expect(mockPlayer.character.hasFlag).toBeTrue();
        });
    });

    describe('revertItemEffects', () => {
        it('should correctly revert effects of the Power Fruit', () => {
            service.applyItemEffects('assets/object-Power-fruit-only.png', mockPlayer);
            service.revertItemEffects('assets/object-Power-fruit-only.png', mockPlayer);
            expect(mockPlayer.character.stats.attack).toBe(5);
        });

        it('should correctly revert effects of the Shield', () => {
            service.applyItemEffects('assets/object-shield-only.png', mockPlayer);
            service.revertItemEffects('assets/object-shield-only.png', mockPlayer);
            expect(mockPlayer.character.stats.health).toBe(2);
        });

        it('should correctly revert effects of the Boots', () => {
            service.applyItemEffects('assets/object-boots-only.png', mockPlayer);
            service.revertItemEffects('assets/object-boots-only.png', mockPlayer);
            expect(mockPlayer.character.stats.speed).toBe(3);
            expect(mockPlayer.character.stats.health).toBe(2);
        });

        it('should correctly set hasFlag to false when dropping the flag', () => {
            // Initially, the player has the flag
            service.applyItemEffects('assets/object-flag-only.png', mockPlayer);
            expect(mockPlayer.character.hasFlag).toBeTrue();

            // Revert the effect of picking up the flag (i.e., drop the flag)
            service.revertItemEffects('assets/object-flag-only.png', mockPlayer);

            // Now, hasFlag should be false
            expect(mockPlayer.character.hasFlag).toBeFalse();
        });

        it('should do nothing for an unrecognized item (default case)', () => {
            const originalStats = { ...mockPlayer.character.stats };
            service.revertItemEffects('unknown-item', mockPlayer);
            expect(mockPlayer.character.stats).toEqual(originalStats);
        });
    });

    describe('placeItemsOnNearestTiles', () => {
        it('should place items on the nearest available tiles', () => {
            const board: Tiles[][] = [
                [
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                ],
                [
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 1, col: 0 },
                    },
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 1, col: 1 },
                    },
                ],
            ];

            const inventory: [string | null, string | null] = ['item1', 'item2'];
            const position = { row: 0, col: 0 };

            spyOn(service['socketService'], 'emit').and.callFake(() => {}); // Mock socket emission

            service.placeItemsOnNearestTiles(inventory, position, board, 'room1');

            expect(board[0][1].object).toBe('item2');
            expect(board[1][0].object).toBe('item1');
            expect(inventory[0]).toBeNull();
            expect(inventory[1]).toBeNull();
        });

        it('should not place items if there are no valid tiles', () => {
            const board: Tiles[][] = [
                [
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: 'existingObject',
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: 'existingObject',
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                ],
            ];

            const inventory: [string | null, string | null] = ['item1', 'item2'];
            const position = { row: 0, col: 0 };

            spyOn(service['socketService'], 'emit').and.callFake(() => {}); // Mock socket emission

            service.placeItemsOnNearestTiles(inventory, position, board, 'room1');

            expect(board[0][0].object).toBe('existingObject');
            expect(board[0][1].object).toBe('existingObject');
            expect(inventory[0]).toBe(null);
            expect(inventory[1]).toBe(null);
        });
    });

    describe('findNearestAvailableTiles', () => {
        it('should find nearest tiles excluding player position', () => {
            const board: Tiles[][] = [
                [
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                ],
                [
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 1, col: 0 },
                    },
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 1, col: 1 },
                    },
                ],
            ];

            const position = { row: 0, col: 0 };

            const result = service['findNearestAvailableTiles'](position, board, 2);

            expect(result).toEqual([
                { row: 1, col: 0 },
                { row: 0, col: 1 },
            ]);
        });

        it('should exclude tiles with objects, walls, or doors', () => {
            const board: Tiles[][] = [
                [
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: 'existingObject',
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: true,
                        door: false,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                ],
                [
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: true,
                        isTileSelected: false,
                        position: { row: 1, col: 0 },
                    },
                    {
                        fieldTile: 'field',
                        avatar: null,
                        object: null,
                        wall: false,
                        door: false,
                        isTileSelected: false,
                        position: { row: 1, col: 1 },
                    },
                ],
            ];

            const position = { row: 0, col: 0 };

            const result = service['findNearestAvailableTiles'](position, board, 2);

            expect(result).toEqual([
                { row: 1, col: 1 },
                { row: 1, col: 1 },
            ]);
        });
    });

    describe('clearInventory', () => {
        it('should clear all items from the inventory', () => {
            service.inventorySource.next(['item1', 'item2']);

            service.clearInventory();

            service.inventory$.subscribe((inventory) => {
                expect(inventory).toEqual([null, null]);
            });
        });
    });

    describe('InventoryService - getItemNameFromPath', () => {
        it('should return the correct item name when item path is in the map', () => {
            const itemPath = 'assets/object-Power-fruit-only.png';
            const itemName = service.getItemNameFromPath(itemPath);
            expect(itemName).toBe('Fruit de pouvoir');
        });

        it('should return the correct item name when item path is in the map (Shield)', () => {
            const itemPath = 'assets/object-shield-only.png';
            const itemName = service.getItemNameFromPath(itemPath);
            expect(itemName).toBe('Bouclier');
        });

        it('should return "Unknown Item" when item path is not in the map', () => {
            const itemPath = 'assets/object-unknown-item.png';
            const itemName = service.getItemNameFromPath(itemPath);
            expect(itemName).toBe('Unknown Item');
        });
    });
});
