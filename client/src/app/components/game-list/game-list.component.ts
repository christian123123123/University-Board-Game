import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Game } from '@app/interfaces/Game';
import { BoardService } from '@app/services/edit/board/board.service';
import { GameListService } from '@app/services/game-list/game-list.service';
import { GamesService } from '@app/services/games/games.service';

@Component({
    selector: 'app-game-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class GameListComponent implements OnInit {
    @Input() filteredVisibility: boolean = true;
    games: Game[] = [];
    activeGame: Game | null = null;
    currentRoute: string = '';
    isBoardHovered: boolean = false;
    constructor(
        private route: ActivatedRoute,
        private gamesService: GamesService,
        readonly boardService: BoardService,
        readonly gameListService: GameListService,
    ) {}

    ngOnInit(): void {
        this.route.url.subscribe((url) => {
            this.currentRoute = url[0]?.path;
        });

        this.gamesService.getGames().subscribe((response: Game[]) => {
            this.games = response;
        });
    }

    onBoardHover(): void {
        this.isBoardHovered = true;
    }

    onBoardLeave(): void {
        this.isBoardHovered = false;
    }
}
