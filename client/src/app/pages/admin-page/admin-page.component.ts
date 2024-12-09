import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { GameModeComponent } from '@app/components/game-mode/game-mode.component';
import { HomeButtonComponent } from '@app/components/home-button/home-button.component';
import { ImportExportService } from '@app/services/edit/import-export/import-export.service';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [RouterLink, GameListComponent, HomeButtonComponent],
    encapsulation: ViewEncapsulation.None,
})
export class AdminPageComponent {
    constructor(
        public dialog: MatDialog,
        private importService: ImportExportService,
    ) {}

    handleClickCreateGame(): void {
        this.dialog.open(GameModeComponent);
    }
    handleImport(): void {
        this.importService.importGame();
    }
}
