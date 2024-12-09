import { Injectable } from '@angular/core';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_OBJECTS } from '@app/shared/game-objects';

@Injectable({
    providedIn: 'root',
})
export class ObjectsService {
    itemsUsed: Set<string> = new Set<string>();

    getObjectDescription(currentTile: Tiles): string {
        for (const key in GAME_OBJECTS) {
            if (GAME_OBJECTS[key].object === currentTile.object) return GAME_OBJECTS[key].description;
        }
        return '';
    }

    getItemCount(mapSize: string): number {
        const ITEM_COUNT_SMALL = 2;
        const ITEM_COUNT_MEDIUM = 4;
        const ITEM_COUNT_LARGE = 6;
        switch (mapSize) {
            case 'petite':
                return ITEM_COUNT_SMALL;
            case 'moyenne':
                return ITEM_COUNT_MEDIUM;
            case 'grande':
                return ITEM_COUNT_LARGE;
            default:
                return 0;
        }
    }

    numberOfObjectInMap(gameBoard: Tiles[][], objectUrl: string): number {
        return gameBoard.reduce((count, row) => {
            return count + row.filter((col) => col.object === objectUrl).length;
        }, 0);
    }

    updateRandomItemCount(board: Tiles[][]): number {
        for (const row of board) {
            for (const tile of row) {
                if (tile.object && tile.object !== 'assets/object-universal-cube-only.png' && tile.object !== 'assets/object-flag-only.png') {
                    GAME_OBJECTS.randomItem.count--;
                }
            }
        }
        return GAME_OBJECTS.randomItem.count;
    }

    getInitialItemCount(gameBoard: Tiles[][], objectUrl: string, mapSize: string): number {
        if (objectUrl === GAME_OBJECTS.universalCube.object || objectUrl === GAME_OBJECTS.randomItem.object) {
            return this.getItemCount(mapSize) - this.numberOfObjectInMap(gameBoard, objectUrl);
        } else {
            if (GAME_OBJECTS.randomItem.count === 0) {
                return 0;
            }
            return 1 - this.numberOfObjectInMap(gameBoard, objectUrl);
        }
    }

    adjustObjectCountsBasedOnMapSize(mapSize: string): void {
        const itemCount = this.getItemCount(mapSize);
        GAME_OBJECTS.randomItem.count = itemCount;
        GAME_OBJECTS.universalCube.count = itemCount;
    }

    incrementItemCount(objectKey: string, component: ObjectsComponent): void {
        if (objectKey === 'universalCube') {
            if (GAME_OBJECTS.universalCube.count < this.getItemCount(component.mapSize)) {
                GAME_OBJECTS.universalCube.count++;
            }
        } else if (objectKey === 'flag') {
            if (GAME_OBJECTS.flag.count < 1) {
                GAME_OBJECTS.flag.count++;
            }
        } else if (objectKey === 'randomItem') {
            GAME_OBJECTS.randomItem.count++;

            if (GAME_OBJECTS.randomItem.count > 0) {
                for (const key in GAME_OBJECTS) {
                    if (key !== 'universalCube' && key !== 'randomItem' && key !== 'flag' && !this.itemsUsed.has(key)) {
                        GAME_OBJECTS[key].count = 1;
                    }
                }
            }
        } else {
            if (GAME_OBJECTS[objectKey].count === 0) {
                this.itemsUsed.delete(objectKey);
                for (const key in GAME_OBJECTS) {
                    if (key !== 'universalCube' && key !== 'randomItem' && key !== 'flag' && !this.itemsUsed.has(key)) {
                        GAME_OBJECTS[key].count = 1;
                    }
                }
            }

            GAME_OBJECTS.randomItem.count++;
        }
    }

    decrementItemCount(objectKey: string): void {
        if (objectKey === 'universalCube' && GAME_OBJECTS.universalCube.count > 0) {
            GAME_OBJECTS.universalCube.count--;
        } else if (objectKey === 'flag' && GAME_OBJECTS.flag.count > 0) {
            GAME_OBJECTS.flag.count--;
        } else if (objectKey === 'randomItem') {
            if (GAME_OBJECTS.randomItem.count > 0) {
                GAME_OBJECTS.randomItem.count--;
            }
            if (GAME_OBJECTS.randomItem.count === 0) {
                for (const key in GAME_OBJECTS) {
                    if (key !== 'universalCube' && key !== 'randomItem' && key !== 'flag') {
                        GAME_OBJECTS[key].count = 0;
                    }
                }
            }
        } else if (GAME_OBJECTS[objectKey].count > 0) {
            GAME_OBJECTS[objectKey].count--;
            this.itemsUsed.add(objectKey);
            if (GAME_OBJECTS.randomItem.count > 0) {
                GAME_OBJECTS.randomItem.count--;
            }
            if (GAME_OBJECTS.randomItem.count === 0) {
                for (const key in GAME_OBJECTS) {
                    if (key !== 'universalCube' && key !== 'randomItem' && key !== 'flag') {
                        GAME_OBJECTS[key].count = 0;
                    }
                }
            }
        }
    }

    onObjectRemoved(objectUrl: string, component: ObjectsComponent): void {
        const objectKey = Object.keys(GAME_OBJECTS).find((key) => GAME_OBJECTS[key].object === objectUrl);
        if (objectKey) {
            this.incrementItemCount(objectKey, component);
        }
    }

    onObjectDropped(objectUrl: string): void {
        const objectKey = Object.keys(GAME_OBJECTS).find((key) => GAME_OBJECTS[key].object === objectUrl);
        if (objectKey && GAME_OBJECTS[objectKey].count > 0) {
            this.decrementItemCount(objectKey);
        }
    }
}
