import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewTitleDialogComponent } from '@app/components/new-title-dialog/new-title-dialog.component';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { GamesService } from '@app/services/games/games.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { GAME_TILES } from '@app/shared/game-tiles';
import { SaveGameService } from '../save/save-game.service';
import { ValidationService } from '../save/validation/validation.service';
@Injectable({
    providedIn: 'root',
})
export class ImportExportService {
    constructor(
        private dialog: MatDialog,
        readonly gamesService: GamesService,
        readonly saveGameService: SaveGameService,
        readonly matSnackBar: MatSnackBar,
        readonly validationService: ValidationService,
    ) {}
    importGame(): void {
        const MAX_FILE_SIZE = 1 * 1024 * 1024;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const fileSelected = target.files ? target.files[0] : null;
            if (fileSelected) {
                if (fileSelected.size > MAX_FILE_SIZE) {
                    this.matSnackBar.open('Fichier trop grand, veuillez sélectionné un fichier de taille inférieure à 1 MB', 'Ok', {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        duration: 3000,
                    });
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target?.result as string; // the optional marking operator ensures that if e.target is unexpectedly null, the code wont throw an error
                    const gameObject: Game = JSON.parse(fileContent);
                    const { _id, updatedAt, createdAt, __v, ...gameWithAttributes } = gameObject as Game & { createdAt?: string; __v?: string };
                    const gameWithAttributesWitVisibility: Omit<Game, '_id' | 'updatedAt'> & { visibility: boolean } = {
                        ...gameWithAttributes,
                        visibility: false,
                    };
                    const validModes = ['capture the flag', 'classique'];

                    if (!validModes.includes(gameObject.mode)) {
                        this.displaySnackBar('Mode de jeu inconnu.');
                        return;
                    }
                    if (gameObject.mode == 'capture the flag') {
                        if (!this.isFlagInFile(gameObject.board)) {
                            this.displaySnackBar('Drapeau manquant dans une partie CTF.');
                            return;
                        }
                    }
                    if (gameObject.mode == 'classique') {
                        if (this.isFlagInFile(gameObject.board)) {
                            this.displaySnackBar('Il ne devrait pas avoir un drapeau dans une partie classique.');
                            return;
                        }
                    }
                    if (!this.areTilesValid(gameObject.board)) {
                        return;
                    }
                    if (!this.isObjectCountValid(gameObject.board, gameObject.mapSize)) {
                        return;
                    }
                    if (!this.isBoardSizeValid(gameObject.board)) {
                        this.displaySnackBar('Taille de la map invalide. Elle doit être de 10x10, 15x15 ou 20x20');
                        return;
                    }
                    if (!this.isMapSizeValid(gameObject.board, gameObject.mapSize)) {
                        this.displaySnackBar('Taille de map correcte, mais elle ne correspond pas avec mapSize. Fichier corrompu?');
                        return;
                    }
                    this.checkAndSaveGame(gameWithAttributesWitVisibility, gameObject);
                };
                reader.readAsText(fileSelected);
            }
        };
        input.click();
    }
    exportGame(game: Game): void {
        this.gamesService.getGameById(game._id).subscribe((game: Game) => {
            const MODIFIED_GAME: Partial<Game> = { ...game };
            delete MODIFIED_GAME.visibility;
            const GAME_CONTENT = JSON.stringify(MODIFIED_GAME, null, 2);
            this.downloadFile(`${game.title}.json`, GAME_CONTENT);
        });
    }
    // every function below needs to be placed in service.
    isFlagInFile(board: Tiles[][]): boolean {
        if (this.validationService.isFlagHere(board)) return true;
        return false;
    }
    // edge-cases
    areTilesValid(board: Tiles[][]): boolean {
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const tile = board[row][col];
                const VALID_FIELDS = Object.values(GAME_TILES);
                const VALID_OBJECTS = Object.values(GAME_OBJECTS).map((item) => item.object);

                if (typeof tile !== 'object' || tile === null) {
                    this.displaySnackBar(`Tile at (${row}, ${col}) must be an object.`);
                    return false;
                }
                if (!VALID_FIELDS.includes(tile.fieldTile)) {
                    this.displaySnackBar(`Invalid field at (${row}, ${col}): ${tile.fieldTile}`);
                    return false;
                }

                if (tile.object !== null && tile.object !== '' && !VALID_OBJECTS.includes(tile.object)) {
                    this.displaySnackBar(`Invalid object at (${row}, ${col}): ${tile.object}`);
                    return false;
                }
                // edge-cases door
                if (typeof tile.door !== 'boolean') {
                    this.displaySnackBar(`Invalid door attribute at (${row}, ${col}). Must be a boolean.`);
                    return false;
                }
                if (tile.fieldTile !== GAME_TILES.DOOR_CLOSED && tile.fieldTile !== GAME_TILES.DOOR_OPEN) {
                    if (tile.door) {
                        this.displaySnackBar(`La tuile a (${row}, ${col}) n'est pas une porte. l'attribut door doit etre false.`);
                        return false;
                    }
                }

                if (tile.fieldTile === GAME_TILES.DOOR_CLOSED || tile.fieldTile === GAME_TILES.DOOR_OPEN) {
                    if (!tile.door) {
                        this.displaySnackBar(`La tuile a (${row}, ${col}) est une porte. l'attribut door doit etre true.`);
                        return false;
                    }
                }
                // edge-cases wall
                if (typeof tile.wall !== 'boolean') {
                    this.displaySnackBar(`Invalid wall attribute at (${row}, ${col}). Must be a boolean.`);
                    return false;
                }
                if (tile.fieldTile === GAME_TILES.WALL) {
                    if (!tile.wall) {
                        this.displaySnackBar(`La tuile a (${row}, ${col}) est un mur. l'attribut wall doit etre true.`);
                        return false;
                    }
                }
                if (tile.fieldTile !== GAME_TILES.WALL) {
                    if (tile.wall) {
                        this.displaySnackBar(`La tuile a (${row}, ${col}) est n'est pas un mur. l'attribut mur doit etre false.`);
                        return false;
                    }
                }

                if (tile.isTileSelected !== false) {
                    this.displaySnackBar(`Tile at (${row}, ${col}) must have isTileSelected set to false.`);
                    return false;
                }

                if ('avatar' in tile && tile.avatar !== null && tile.avatar !== '') {
                    this.displaySnackBar(`Tile at (${row}, ${col}) must not have an avatar.`);
                    return false;
                }
            }
        }
        return true;
    }
    isObjectCountValid(board: Tiles[][], mapSize: string): boolean {
        const requiredStartingPoints = mapSize === 'petite' ? 2 : mapSize === 'moyenne' ? 4 : 6;
        const maxTotalObjects = mapSize === 'petite' ? 2 : mapSize === 'moyenne' ? 4 : 6; // Combined limit for random and other items

        const objectCounts: { [key: string]: number } = {};

        for (const key in GAME_OBJECTS) {
            objectCounts[key] = 0;
        }

        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const tile = board[row][col];

                if (tile.object) {
                    const objectKey = Object.keys(GAME_OBJECTS).find((key) => GAME_OBJECTS[key].object === tile.object);

                    if (objectKey) {
                        objectCounts[objectKey]++;
                    }
                }
            }
        }

        if (objectCounts['universalCube'] !== requiredStartingPoints) {
            this.displaySnackBar(
                `Le nombre de points de départ (cubes universels) est incorrect. Requis: ${requiredStartingPoints}, trouvés: ${objectCounts['universalCube']}.`,
            );
            return false;
        }

        const totalItems = Object.keys(objectCounts)
            .filter((key) => key !== 'universalCube' && key !== 'flag')
            .reduce((sum, key) => sum + objectCounts[key], 0);

        if (totalItems > maxTotalObjects) {
            this.displaySnackBar(
                `Le nombre total d'objets (y compris objets aléatoires) dépasse la limite. Maximum autorisé: ${maxTotalObjects}, trouvés: ${totalItems}.`,
            );
            return false;
        }

        return true;
    }

    isBoardSizeValid(board: Tiles[][]): boolean {
        if (!Array.isArray(board) || board.length === 0) return false;
        const rows = board.length;
        const columns = board[0].length;
        const isSquare = board.every((row) => Array.isArray(row) && row.length === columns);
        if (!isSquare) {
            return false;
        }
        const SMALL = 10;
        const MEDIUM = 15;
        const LARGE = 20;
        const allowedSizes = [
            { rows: SMALL, columns: SMALL }, // Small
            { rows: MEDIUM, columns: MEDIUM }, // Medium
            { rows: LARGE, columns: LARGE }, // Large
        ];

        return allowedSizes.some((size) => rows === size.rows && columns === size.columns);
    }
    isMapSizeValid(board: Tiles[][], mapSize: string): boolean {
        const rows = board.length;
        const cols = board[0].length;
        const SMALL = 10;
        const MEDIUM = 15;
        const LARGE = 20;
        if (rows === SMALL && cols === SMALL && mapSize === 'petite') {
            return true;
        }
        if (rows === MEDIUM && cols === MEDIUM && mapSize === 'moyenne') {
            return true;
        }
        if (rows === LARGE && cols === LARGE && mapSize === 'grande') {
            return true;
        }
        return false;
    }

    downloadFile(filename: string, content: string): void {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    displaySnackBar(message: string): void {
        this.matSnackBar.open(message, 'Ok', {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 3000,
        });
    }

    checkAndSaveGame(
        gameWithAttributesWithVisibility: Omit<Game, '_id' | 'updatedAt'> & { visibility: boolean },
        gameObject: Game & { createdAt?: string; __v?: number },
    ): void {
        this.saveGameService.checkForDuplicateTitleCreating(gameWithAttributesWithVisibility.title).subscribe((isNotUniqueTitle: boolean) => {
            if (isNotUniqueTitle) {
                const dialogRef = this.dialog.open(NewTitleDialogComponent, {
                    width: '400px',
                    data: { newTitle: '' },
                });

                dialogRef.afterClosed().subscribe((newTitle: string | undefined) => {
                    if (newTitle) {
                        gameWithAttributesWithVisibility.title = newTitle;
                        this.checkAndSaveGame(gameWithAttributesWithVisibility, gameObject);
                    }
                });
            } else {
                this.saveGameService.saveGame(null, gameWithAttributesWithVisibility, gameObject.board, gameObject.mode);
                this.matSnackBar.open('Veuillez refraichir la page!', 'Ok', {
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    duration: 3000,
                });
            }
        });
    }
}
