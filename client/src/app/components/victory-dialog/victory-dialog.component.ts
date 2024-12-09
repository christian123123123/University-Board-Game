import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-victory-dialog',
    imports: [CommonModule],
    templateUrl: './victory-dialog.component.html',
    styleUrls: ['./victory-dialog.component.scss'],
    standalone: true,
})
export class VictoryDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA)
        public data: { title: string; message: string },
    ) {}
}
