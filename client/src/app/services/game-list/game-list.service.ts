import { Injectable, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/Game';
import { CreationFormService } from '@app/services/create/creation-form.service';
import { ImportExportService } from '@app/services/edit/import-export/import-export.service';
import { GamesService } from '@app/services/games/games.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';

@Injectable({
    providedIn: 'root',
})
export class GameListService {
    constructor(
        readonly gamesService: GamesService,
        readonly router: Router,
        readonly snackBar: MatSnackBar,
        readonly creationFormService: CreationFormService,
        readonly sharedService: SharedDataService,
        readonly ImportExportService: ImportExportService,
    ) {}
    @Output() exportGame: Game;
    toggleVisibility(game: Game): void {
        const originalVisibility = game.visibility;

        this.gamesService.changeVisibility(game._id, !game.visibility).subscribe(
            () => {
                game.visibility = !originalVisibility;
            },
            () => {
                game.visibility = originalVisibility;
            },
        );
    }

    deleteButton(component: GameListComponent, game: Game): void {
        const ERROR_STATUS_NOT_FOUND = 404;
        this.gamesService.getGameById(game._id).subscribe(
            (returnedGame) => {
                this.gamesService.deleteGame(returnedGame._id).subscribe(
                    () => {
                        component.games = component.games.filter((currentGame) => currentGame._id !== game._id);
                    },
                    () => {},
                );
            },
            (error) => {
                if (error.status === ERROR_STATUS_NOT_FOUND) {
                    this.snackBar
                        .open('Ce jeu a été supprimé', 'Ok')
                        .afterDismissed()
                        .subscribe(() => {
                            component.games = component.games.filter((currentGame) => currentGame._id !== game._id);
                        });
                }
            },
        );
    }

    editGame(game: Game): void {
        this.router.navigate(['/edit'], {
            queryParams: { id: game._id, gameMode: game.mode, mapSize: game.mapSize },
        });
    }

    onGameClick(component: GameListComponent, game: Game): void {
        const ERROR_STATUS_NOT_FOUND = 404;
        this.gamesService.getGameById(game._id).subscribe(
            (returnedGame) => {
                if (returnedGame.visibility) {
                    this.sharedService.setGame(returnedGame);
                    this.creationFormService.openCreationForm(game._id, false);
                } else {
                    this.snackBar
                        .open('Ce jeu a été caché', 'Ok')
                        .afterDismissed()
                        .subscribe(() => {
                            component.games = component.games.filter((currentGame) => currentGame._id !== game._id);
                        });
                }
            },
            (error) => {
                if (error.status === ERROR_STATUS_NOT_FOUND) {
                    this.snackBar
                        .open('Ce jeu a été supprimé', 'Ok')
                        .afterDismissed()
                        .subscribe(() => {
                            component.games = component.games.filter((currentGame) => currentGame._id !== game._id);
                        });
                }
            },
        );
    }
    exportButton(game: Game): void {
        this.ImportExportService.exportGame(game);
    }
}
