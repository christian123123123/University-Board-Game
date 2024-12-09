import { Injectable } from '@angular/core';
import { BoardComponent } from '@app/components/board/board.component';
import { Tiles } from '@app/interfaces/Tiles';
import { GAME_OBJECTS } from '@app/shared/game-objects';

@Injectable({
    providedIn: 'root',
})
export class DragEventService {
    onDragStart(event: DragEvent, objectKey: string): void {
        if (GAME_OBJECTS[objectKey].count === 0) {
            event.preventDefault();
        } else {
            event.dataTransfer?.setData('text/plain', GAME_OBJECTS[objectKey].object);
        }
    }

    onDragStartFromTile(event: DragEvent, tile: Tiles, component: BoardComponent): void {
        if (tile.object && tile.position) {
            event.dataTransfer?.setData('text/plain', tile.object);
            component.originalRowIndex = tile.position.row;
            component.originalColIndex = tile.position.col;
        }
    }

    onDrop(event: DragEvent, rowIndex: number | null, colIndex: number | null, component: BoardComponent): void {
        event.preventDefault();

        const objectUrl = event.dataTransfer?.getData('text/plain');
        let isObject = false;
        for (const key in GAME_OBJECTS) {
            if (objectUrl === GAME_OBJECTS[key].object) {
                isObject = true;
                break;
            }
        }
        if (rowIndex === null || colIndex === null) {
            component.objectRemoved.emit(objectUrl);
            return;
        }

        const tileOnBoard = component.board[rowIndex][colIndex];

        if ((tileOnBoard.object !== '' && tileOnBoard.object !== null) || tileOnBoard.door || tileOnBoard.wall || !isObject) {
            return;
        }

        if (objectUrl) {
            if (component.originalRowIndex === null && component.originalColIndex === null) {
                tileOnBoard.object = objectUrl;
                component.objectDropped.emit(objectUrl);
            } else if (component.originalRowIndex !== null && component.originalColIndex !== null) {
                component.board[component.originalRowIndex][component.originalColIndex].object = null;
                tileOnBoard.object = objectUrl;
            }

            component.originalRowIndex = null;
            component.originalColIndex = null;
        }
    }

    onGlobalDrop(event: DragEvent, component: BoardComponent): void {
        event.preventDefault();
        const objectUrl = event.dataTransfer?.getData('text/plain');

        if (objectUrl && component.originalRowIndex !== null && component.originalColIndex !== null) {
            component.board[component.originalRowIndex][component.originalColIndex].object = null;
            component.objectRemoved.emit(objectUrl);
        }

        component.originalRowIndex = null;
        component.originalColIndex = null;
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }
}
