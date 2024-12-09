import { Injectable } from '@angular/core';
import { BoardComponent } from '@app/components/board/board.component';
import { TilesService } from '@app/services/edit/tiles/tiles.service';

@Injectable({
    providedIn: 'root',
})
export class MouseEventService {
    constructor(readonly tilesService: TilesService) {}

    onMouseUp(component: BoardComponent): void {
        component.isMouseDownRight = false;
        component.isMouseDownLeft = false;
        component.lastToggledTile = null;
    }

    onMouseDown(event: MouseEvent, component: BoardComponent): void {
        if (component.disableMouseMove) {
            return;
        }
        const tileElement = event.target as HTMLElement;
        if (tileElement && tileElement.hasAttribute('data-row') && tileElement.hasAttribute('data-col')) {
            const rowIndex = Number(tileElement.getAttribute('data-row'));
            const colIndex = Number(tileElement.getAttribute('data-col'));
            if (!isNaN(rowIndex) && !isNaN(colIndex)) {
                if (event.button === 0) {
                    component.isMouseDownLeft = true;
                    component.selectTile(event, rowIndex, colIndex);
                } else if (event.button === 2) {
                    const currentTile = component.board[rowIndex][colIndex];
                    if (currentTile.object) {
                        const objectToRemove = currentTile.object;
                        component.objectRemoved.emit(objectToRemove);
                        currentTile.object = null;
                    } else {
                        component.isMouseDownRight = true;
                        component.tilesService.eraseTile(component.board, rowIndex, colIndex);
                    }
                }
            }
        }
    }

    onMouseMove(event: MouseEvent, component: BoardComponent): void {
        if (component.disableMouseMove) {
            return;
        }
        const tileElement = event.target as HTMLElement;
        if (tileElement && tileElement.hasAttribute('data-row') && tileElement.hasAttribute('data-col')) {
            const rowIndex = Number(tileElement.getAttribute('data-row'));
            const colIndex = Number(tileElement.getAttribute('data-col'));
            if (!isNaN(rowIndex) && !isNaN(colIndex)) {
                if (component.isMouseDownLeft) {
                    component.selectTile(event, rowIndex, colIndex);
                } else if (component.isMouseDownRight) {
                    this.tilesService.eraseTile(component.board, rowIndex, colIndex);
                }
            }
        }
    }
}
