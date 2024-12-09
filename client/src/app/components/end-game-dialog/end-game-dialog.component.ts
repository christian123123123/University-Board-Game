import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-end-game-dialog',
    imports: [CommonModule],
    templateUrl: './end-game-dialog.component.html',
    styleUrls: ['./end-game-dialog.component.scss'],
    standalone: true,
})
export class EndGameDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA)
        public data: { title: string; message: string },
    ) {}
}
