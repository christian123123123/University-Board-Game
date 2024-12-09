import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game-mode',
    imports: [CommonModule],
    templateUrl: './game-mode.component.html',
    styleUrls: ['./game-mode.component.scss'],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
})
export class GameModeComponent {
    selectedGameMode: string = '';
    selectedMapSize: string = '';
    constructor(
        private router: Router,
        private dialogRef: MatDialogRef<GameModeComponent>,
    ) {}

    selectGameMode(mode: string) {
        this.selectedGameMode = mode;
    }
    selectMapSize(size: string) {
        this.selectedMapSize = size;
    }

    onSubmit(): void {
        const selectedGameMode = this.selectedGameMode;
        const selectedMapSize = this.selectedMapSize;
        this.dialogRef.close();
        this.router.navigate(['/edit'], {
            queryParams: { gameMode: selectedGameMode, mapSize: selectedMapSize },
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
