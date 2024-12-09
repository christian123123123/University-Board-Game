import { TestBed } from '@angular/core/testing';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { ObjectsService } from './objects.service';

describe('ObjectsService', () => {
    let service: ObjectsService;
    let mockObjectsComponent: Partial<ObjectsComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ObjectsService);
        mockObjectsComponent = {
            mapSize: 'moyenne',
        };
    });

    describe('getObjectDescription', () => {
        it('should return the correct description for a given object', () => {
            const currentTile: Tiles = { object: GAME_OBJECTS.universalCube.object } as Tiles;
            expect(service.getObjectDescription(currentTile)).toBe(GAME_OBJECTS.universalCube.description);
        });

        it('should return an empty string if the object is not found', () => {
            const currentTile: Tiles = { object: 'nonExistentObject' } as Tiles;
            expect(service.getObjectDescription(currentTile)).toBe('');
        });
    });

    describe('getItemCount', () => {
        const SMALL_SIZE_COUNT = 2;
        const MEDIUM_SIZE_COUNT = 4;
        const LARGE_SIZE_COUNT = 6;
        it('should return 2 for small map sizes', () => {
            expect(service.getItemCount('petite')).toBe(SMALL_SIZE_COUNT);
        });

        it('should return 4 for medium map sizes', () => {
            expect(service.getItemCount('moyenne')).toBe(MEDIUM_SIZE_COUNT);
        });

        it('should return 6 for large map sizes', () => {
            expect(service.getItemCount('grande')).toBe(LARGE_SIZE_COUNT);
        });
    });

    describe('numberOfObjectInMap', () => {
        it('should count the occurrences of an object in the game board', () => {
            const UNIVERSAL_CUBE_COUNT = 2;
            const gameBoard: Tiles[][] = [
                [{ object: GAME_OBJECTS.universalCube.object } as Tiles],
                [{ object: null } as Tiles],
                [{ object: GAME_OBJECTS.universalCube.object } as Tiles],
            ];
            expect(service.numberOfObjectInMap(gameBoard, GAME_OBJECTS.universalCube.object)).toBe(UNIVERSAL_CUBE_COUNT);
        });

        it('should return 0 if the object is not found in the game board', () => {
            const gameBoard: Tiles[][] = [[{ object: null } as Tiles], [{ object: null } as Tiles]];
            expect(service.numberOfObjectInMap(gameBoard, GAME_OBJECTS.universalCube.object)).toBe(0);
        });
    });

    describe('getInitialItemCount', () => {
        it('should return the difference between max count and current count for special objects', () => {
            const gameBoard: Tiles[][] = [
                [{ object: GAME_OBJECTS.universalCube.object } as Tiles],
                [{ object: GAME_OBJECTS.universalCube.object } as Tiles],
            ];
            expect(service.getInitialItemCount(gameBoard, GAME_OBJECTS.universalCube.object, 'moyenne')).toBe(2);
        });

        it('should return 1 minus the number of occurrences for regular objects', () => {
            const gameBoard: Tiles[][] = [[{ object: 'otherObject' } as Tiles]];
            expect(service.getInitialItemCount(gameBoard, 'otherObject', 'moyenne')).toBe(0);
        });
    });

    describe('adjustObjectCountsBasedOnMapSize', () => {
        it('should adjust counts for randomItem and universalCube based on map size', () => {
            const MEDIUM_SIZE_COUNT = 4;
            service.adjustObjectCountsBasedOnMapSize('moyenne');
            expect(GAME_OBJECTS.randomItem.count).toBe(MEDIUM_SIZE_COUNT);
            expect(GAME_OBJECTS.universalCube.count).toBe(MEDIUM_SIZE_COUNT);
        });
    });

    describe('incrementItemCount', () => {
        it('should increment the count of universalCube if it is below the max for the map size', () => {
            GAME_OBJECTS.universalCube.count = 2;
            const EXPECTED_VALUE = 3;
            service.incrementItemCount('universalCube', mockObjectsComponent as ObjectsComponent);
            expect(GAME_OBJECTS.universalCube.count).toBe(EXPECTED_VALUE);
        });

        it('should not increment the count of universalCube if it has reached the max for the map size', () => {
            GAME_OBJECTS.universalCube.count = 4;
            const EXPECTED_VALUE = 4;
            service.incrementItemCount('universalCube', mockObjectsComponent as ObjectsComponent);
            expect(GAME_OBJECTS.universalCube.count).toBe(EXPECTED_VALUE);
        });

        it('should increment the count of randomItem if it is below the max for the map size', () => {
            GAME_OBJECTS.randomItem.count = 3;
            const EXPECTED_VALUE = 4;
            service.incrementItemCount('randomItem', mockObjectsComponent as ObjectsComponent);
            expect(GAME_OBJECTS.randomItem.count).toBe(EXPECTED_VALUE);
        });

        it('should increment the count of a regular object if it is below 1', () => {
            GAME_OBJECTS.otherObject = { count: 0, object: 'objectUrl', description: '' };
            const EXPECTED_VALUE = 1;
            service.incrementItemCount('otherObject', mockObjectsComponent as ObjectsComponent);
            expect(GAME_OBJECTS.otherObject.count).toBe(EXPECTED_VALUE);
        });
    });

    describe('decrementItemCount', () => {
        it('should decrement the count of universalCube if it is above 0', () => {
            GAME_OBJECTS.universalCube.count = 2;
            const EXPECTED_VALUE = 1;
            service.decrementItemCount('universalCube');
            expect(GAME_OBJECTS.universalCube.count).toBe(EXPECTED_VALUE);
        });

        it('should not decrement the count of universalCube if it is 0', () => {
            GAME_OBJECTS.universalCube.count = 0;
            const EXPECTED_VALUE = 0;
            service.decrementItemCount('universalCube');
            expect(GAME_OBJECTS.universalCube.count).toBe(EXPECTED_VALUE);
        });

        it('should decrement the count of randomItem if it is above 0', () => {
            GAME_OBJECTS.randomItem.count = 2;
            const EXPECTED_VALUE = 1;
            service.decrementItemCount('randomItem');
            expect(GAME_OBJECTS.randomItem.count).toBe(EXPECTED_VALUE);
        });
        it('should decrement the count of other items if it is above 0', () => {
            GAME_OBJECTS.powerFruit.count = 1;
            const EXPECTED_VALUE = 0;
            service.decrementItemCount('powerFruit');
            expect(GAME_OBJECTS.powerFruit.count).toBe(EXPECTED_VALUE);
        });
    });

    describe('onObjectRemoved', () => {
        it('should increment the count of the corresponding object when it is removed', () => {
            GAME_OBJECTS.universalCube.count = 2;
            const EXPECTED_VALUE = 3;
            service.onObjectRemoved(GAME_OBJECTS.universalCube.object, mockObjectsComponent as ObjectsComponent);
            expect(GAME_OBJECTS.universalCube.count).toBe(EXPECTED_VALUE);
        });
    });

    describe('onObjectDropped', () => {
        it('should decrement the count of the corresponding object when it is dropped', () => {
            GAME_OBJECTS.universalCube.count = 2;
            const EXPECTED_VALUE = 1;
            service.onObjectDropped(GAME_OBJECTS.universalCube.object);
            expect(GAME_OBJECTS.universalCube.count).toBe(EXPECTED_VALUE);
        });
    });
});
