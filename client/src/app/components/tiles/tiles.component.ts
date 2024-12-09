import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Tiles } from '@app/interfaces/Tiles';

@Component({
    selector: 'app-tiles',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tiles.component.html',
    styleUrl: './tiles.component.scss',
})
export class TilesComponent {
    @Output() tileSelected = new EventEmitter<Tiles>();

    selectedTileUrl: Tiles | null = null;

    tiles: Tiles[] = [
        {
            fieldTile: 'assets/water-tiles.png',
            object: '',
            avatar: '',
            door: false,
            wall: false,
            isTileSelected: false,
            position: { row: 0, col: 0 },
        },
        { fieldTile: 'assets/wall-tiles.png', object: '', door: false, avatar: '', wall: true, isTileSelected: false, position: { row: 0, col: 0 } },
        { fieldTile: 'assets/ice-tiles.png', object: '', door: false, avatar: '', wall: false, isTileSelected: false, position: { row: 0, col: 0 } },
        {
            fieldTile: 'assets/door-tilesV2.0.png',
            object: '',
            avatar: '',
            door: true,
            wall: false,
            isTileSelected: false,
            position: { row: 0, col: 0 },
        },
    ];

    selectTile(tileUrl: Tiles): void {
        this.selectedTileUrl = tileUrl;
        this.tileSelected.emit(this.selectedTileUrl);
    }
}
