import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { ValidationService } from '@app/services/edit/save/validation/validation.service';
import { GamesService } from '@app/services/games/games.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    GAME_OBJECTS = GAME_OBJECTS;
    constructor(
        readonly gamesService: GamesService,
        readonly snackBar: MatSnackBar,
        readonly router: Router,
        readonly validationService: ValidationService,
        readonly activatedRoute: ActivatedRoute,
    ) {}

    checkForDuplicateTitleEditing(title: string, currentGameId?: string): Observable<boolean> {
        return this.gamesService.getGames().pipe(
            map((games: Game[]) => {
                return games.some((game) => game.title === title && game._id !== currentGameId);
            }),
        );
    }

    checkForDuplicateTitleCreating(title: string): Observable<boolean> {
        return this.gamesService.getGames().pipe(
            map((games: Game[]) => {
                return games.some((game) => game.title === title);
            }),
        );
    }

    snackBarMessages(message: string): void {
        this.snackBar.open(message, 'Ok', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 3000,
        });
    }

    saveGame(gameId: string | null, gameData: Omit<Game, '_id' | 'updatedAt'>, currentBoard: Tiles[][], gameMode: string): void {
        if (this.validationService.isTitleOrDescriptionMissing(gameData)) {
            this.snackBarMessages('Vous devez donner un titre et une description à votre jeu');
            return;
        }
        if (!this.validationService.isValidBoardPercentage(currentBoard)) {
            this.snackBarMessages('Plus de 50% de la surface de la carte doit être occupée par des tuiles de terrain');
            return;
        }
        if (!this.validationService.areAllTerrainTilesAccessible(currentBoard)) {
            this.snackBarMessages('Toutes les tuiles de terrain doivent être accessibles sans être bloquées par des murs');
            return;
        }
        if (!this.validationService.areStartingPointsSet(currentBoard, gameData.mapSize)) {
            this.snackBarMessages('Tous les points de départ doivent être placés.');
            return;
        }
        if (!this.validationService.isFlagHere(currentBoard) && gameMode !== 'classique') {
            this.snackBarMessages('Le flag doit être placé.');
            return;
        }
        if (this.validationService.isDoorNotSurrounded(currentBoard)) {
            this.snackBarMessages('Chaque tuile de porte doit se trouver entre deux tuiles de mur sur un même axe.');
            return;
        }

        if (gameId) {
            this.gamesService.getGameById(gameId).subscribe((returnedGame) => {
                this.checkForDuplicateTitleEditing(gameData.title, returnedGame._id).subscribe((isNotUniqueTitle: boolean) => {
                    if (isNotUniqueTitle) {
                        this.snackBarMessages('Ce titre est déjà utilisé par un autre jeu');
                    } else {
                        this.gamesService.updateGameDetails(returnedGame._id, gameData.title, gameData.description, currentBoard).subscribe(() => {
                            this.gamesService.changeVisibility(returnedGame._id, gameData.visibility).subscribe();
                            this.router.navigate(['/admin']);
                        });
                    }
                });
            });
        } else {
            this.checkForDuplicateTitleCreating(gameData.title).subscribe((isNotUniqueTitle: boolean) => {
                if (isNotUniqueTitle) {
                    this.snackBarMessages('Ce titre est déjà utilisé par un autre jeu');
                } else {
                    this.gamesService.createGame(gameData).subscribe(() => {
                        this.router.navigate(['/admin']);
                    });
                }
            });
        }
    }
}
