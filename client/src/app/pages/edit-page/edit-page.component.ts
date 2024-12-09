import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { BoardService } from '@app/services/edit/board/board.service';
import { ObjectsService } from '@app/services/edit/objects/objects.service';
import { SaveGameService } from '@app/services/edit/save/save-game.service';
import { DragEventService } from '@app/services/events/drag-event/drag-event.service';
import { GamesService } from '@app/services/games/games.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { ObjectsComponent } from '../../components/objects/objects.component';
import { TilesComponent } from '../../components/tiles/tiles.component';

@Component({
    selector: 'app-edit-page',
    standalone: true,
    templateUrl: './edit-page.component.html',
    styleUrls: ['./edit-page.component.scss'],
    imports: [CommonModule, RouterLink, BoardComponent, ObjectsComponent, TilesComponent, FormsModule],
})
export class EditPageComponent implements OnInit {
    @ViewChild(BoardComponent) boardComponent!: BoardComponent;
    @ViewChild(ObjectsComponent) objectsComponent!: ObjectsComponent;
    games: Game[] | [];
    game: Game | null = null;
    gameId: string | null = null;
    gameTitle: string = '';
    gameMode: string;
    mapSize: string;
    gameDescription: string = '';
    initialTitle: string = '';
    initialDescription: string = '';
    selectedTile: Tiles;
    gameBoard: Tiles[][];
    lastSavedBoard: Tiles[][];

    constructor(
        private route: ActivatedRoute,
        private gamesService: GamesService,
        private saveGameService: SaveGameService,
        readonly boardService: BoardService,
        readonly objectsService: ObjectsService,
        readonly dragEventService: DragEventService,
    ) {}

    ngOnInit(): void {
        this.gamesService.getGames().subscribe((games: Game[]) => {
            this.games = games;
        });
        this.route.queryParams.subscribe((params) => {
            this.gameId = params['id'];
            this.gameMode = params['gameMode'];
            this.mapSize = params['mapSize'];
        });
        if (this.gameId) {
            this.gamesService.getGameById(this.gameId).subscribe((game: Game) => {
                this.game = game;
                this.gameTitle = game.title;
                this.gameDescription = game.description;
                this.initialTitle = game.title;
                this.initialDescription = game.description;
                this.gameBoard = game.board;
                this.lastSavedBoard = this.initialBoardCopy(game.board);
            });
        }
    }

    initialBoardCopy(board: Tiles[][]): Tiles[][] {
        return board.map((row) => row.map((tile) => ({ ...tile })));
    }

    onTileSelected(tileUrl: Tiles): void {
        this.selectedTile = tileUrl;
    }

    resetTiles(): void {
        if (this.lastSavedBoard && this.game) {
            this.boardComponent.board = this.initialBoardCopy(this.lastSavedBoard);
            this.gameTitle = this.initialTitle;
            this.gameDescription = this.initialDescription;
            for (const key in GAME_OBJECTS) {
                if (Object.prototype.hasOwnProperty.call(GAME_OBJECTS, key)) {
                    GAME_OBJECTS[key].count = this.objectsService.getInitialItemCount(
                        this.boardComponent.board,
                        GAME_OBJECTS[key].object,
                        this.mapSize,
                    );
                }
            }
        } else {
            this.boardComponent.initializeBoard();
            for (const key in GAME_OBJECTS) {
                if (Object.prototype.hasOwnProperty.call(GAME_OBJECTS, key)) {
                    GAME_OBJECTS[key].count = this.objectsService.getInitialItemCount(
                        this.boardComponent.board,
                        GAME_OBJECTS[key].object,
                        this.mapSize,
                    );
                }
            }
        }
    }
    async saveGame(): Promise<void> {
        const currentBoard = this.boardComponent.getBoardState();
        const gameData: Omit<Game, '_id' | 'updatedAt'> = {
            title: this.gameTitle,
            mapSize: this.mapSize,
            mode: this.gameMode,
            visibility: false,
            description: this.gameDescription,
            board: currentBoard,
        };
        this.saveGameService.saveGame(this.game?.['_id'] ?? null, gameData, currentBoard, gameData.mode);
    }
}
