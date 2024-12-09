import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { Game } from '@app/interfaces/Game';
import { ObjectsService } from '@app/services/edit/objects/objects.service';
import { DragEventService } from '@app/services/events/drag-event/drag-event.service';
import { GamesService } from '@app/services/games/games.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
@Component({
    selector: 'app-objects',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './objects.component.html',
    styleUrl: './objects.component.scss',
})
export class ObjectsComponent implements OnInit {
    @ViewChild(BoardComponent) boardComponent!: BoardComponent;
    gameId: string;
    gameMode: string;
    mapSize: string;
    objectsTool = GAME_OBJECTS;

    constructor(
        private route: ActivatedRoute,
        private gamesService: GamesService,
        readonly dragEventService: DragEventService,
        readonly objectsService: ObjectsService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.gameId = params['id'];
            this.mapSize = params['mapSize'];
            this.gameMode = params['gameMode'];

            this.objectsService.adjustObjectCountsBasedOnMapSize(this.mapSize);

            if (this.gameId) {
                this.gamesService.getGameById(this.gameId).subscribe((game: Game) => {
                    const randomCount = this.objectsService.updateRandomItemCount(game.board);
                    for (const key in GAME_OBJECTS) {
                        if (Object.prototype.hasOwnProperty.call(GAME_OBJECTS, key)) {
                            if (key === 'randomItem') {
                                GAME_OBJECTS[key].count = randomCount;
                            } else {
                                GAME_OBJECTS[key].count = this.objectsService.getInitialItemCount(game.board, GAME_OBJECTS[key].object, this.mapSize);
                            }
                        }
                    }
                });
            } else {
                for (const key in GAME_OBJECTS) {
                    if (key === 'universalCube' || key === 'randomItem') {
                        GAME_OBJECTS[key].count = this.objectsService.getItemCount(this.mapSize);
                    } else {
                        GAME_OBJECTS[key].count = 1;
                    }
                }
            }
        });
    }

    isUsed(objectKey: string): boolean {
        if (GAME_OBJECTS[objectKey]) {
            return GAME_OBJECTS[objectKey].count === 0;
        }
        return false;
    }
}
