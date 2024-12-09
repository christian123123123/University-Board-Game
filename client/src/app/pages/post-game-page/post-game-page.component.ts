import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_TILES } from '@app/shared/game-tiles';
import { browserRefresh } from '../app/app.component';

@Component({
    selector: 'app-post-game-page',
    standalone: true,
    templateUrl: './post-game-page.component.html',
    styleUrls: ['./post-game-page.component.scss'],
    imports: [CommonModule, RouterLink, ChatBoxComponent],
    encapsulation: ViewEncapsulation.None,
})
export class PostGamePageComponent {
    players: Player[];
    player: Player;
    playerVictories: Map<string, number>;
    playerLosses: Map<string, number>;
    playerCombats: Map<string, number>;
    playerEscape: Map<string, number>;
    playerHpLost: Map<string, number>;
    playerHpWon: Map<string, number>;
    playerObjectsCount: Map<string, number>;
    playerTilesVisited: Map<string, { row: number; col: number }[]>;
    totalTurns: number;
    gameDurationMinutes: number;
    gameDurationSeconds: number;
    welcomeMessage: string = '';
    chatRoomHistory: { user: string; text: string; time: Date }[] = [];
    accessCode: string;
    isCTFMode: boolean = false;
    doorsManipulated: number;
    doorsInBoard: number = 0;
    flagHolders: number = 0;
    sortedPlayers: Player[];
    currentSortColumn: string = '';
    isAscending: boolean = true;
    game: Game | null = null;
    board: Tiles[][];
    numberOfTiles: number;
    activeChatSection: string = 'stats';
    activeSection: string = 'chat';
    tilesVisitedPercentage: number;

    constructor(
        private router: Router,
        readonly socketService: SocketService,
        readonly sharedService: SharedDataService,
        readonly dialog: MatDialog,
    ) {}

    ngOnInit(): void {
        this.socketService.connect();
        if (browserRefresh) {
            this.router.navigate(['/home']);
            this.sharedService.resetSharedServices();
            return;
        }
        this.isCTFMode = this.sharedService.getIsCTF();
        this.flagHolders = this.sharedService.getPlayersWithFlagMap().size;
        this.players = this.sharedService.getPlayersInGame();
        this.player = this.sharedService.getPlayer();
        this.playerVictories = this.sharedService.getVictoryMap();
        this.playerLosses = this.sharedService.getLossesMap();
        this.playerCombats = this.sharedService.getCombatMap();
        this.playerEscape = this.sharedService.getEscapeMap();
        this.playerHpLost = this.sharedService.getPointsLostMap();
        this.playerHpWon = this.sharedService.getPointsTakenMap();
        this.playerObjectsCount = this.sharedService.getObjectsCountMap();
        this.playerTilesVisited = this.sharedService.getTilesVisitedMap();
        this.totalTurns = this.sharedService.getTotalTurns();
        this.gameDurationMinutes = this.sharedService.getGameDuration().minutes;
        this.gameDurationSeconds = this.sharedService.getGameDuration().seconds;
        this.accessCode = this.sharedService.getAccessCode();
        this.doorsManipulated = (this.sharedService.getDoorsToggled() ?? 0).length;
        this.board = this.sharedService.getBoard();
        this.numberOfTiles = this.board.length * this.board.length;
        this.tilesVisitedPercentage = this.sharedService.getTotalTilesVisited().length / this.numberOfTiles;
        this.sortedPlayers = [...this.players];
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                if (this.board[row][col].fieldTile === GAME_TILES.DOOR_CLOSED || this.board[row][col].fieldTile === GAME_TILES.DOOR_OPEN) {
                    this.doorsInBoard++;
                }
            }
        }
    }

    sortTable(column: string): void {
        if (this.currentSortColumn === column) {
            this.isAscending = !this.isAscending;
        } else {
            this.currentSortColumn = column;
            this.isAscending = true;
        }

        this.sortedPlayers.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (column) {
                case 'username':
                    aValue = a.username;
                    bValue = b.username;
                    break;
                case 'combats':
                    aValue = this.playerCombats.get(a.username) ?? 0;
                    bValue = this.playerCombats.get(b.username) ?? 0;
                    break;
                case 'escapes':
                    aValue = this.playerEscape.get(a.username) ?? 0;
                    bValue = this.playerEscape.get(b.username) ?? 0;
                    break;
                case 'victories':
                    aValue = this.playerVictories.get(a.username) ?? 0;
                    bValue = this.playerVictories.get(b.username) ?? 0;
                    break;
                case 'losses':
                    aValue = this.playerLosses.get(a.username) ?? 0;
                    bValue = this.playerLosses.get(b.username) ?? 0;
                    break;
                case 'hpTaken':
                    aValue = this.playerHpWon.get(a.username) ?? 0;
                    bValue = this.playerHpWon.get(b.username) ?? 0;
                    break;
                case 'hpLost':
                    aValue = this.playerHpLost.get(a.username) ?? 0;
                    bValue = this.playerHpLost.get(b.username) ?? 0;
                    break;
                case 'objects':
                    aValue = this.playerObjectsCount.get(a.username) ?? 0;
                    bValue = this.playerObjectsCount.get(b.username) ?? 0;
                    break;
                case 'tilesVisited':
                    aValue = (this.playerTilesVisited.get(a.username)?.length ?? 0) / this.numberOfTiles;
                    bValue = (this.playerTilesVisited.get(b.username)?.length ?? 0) / this.numberOfTiles;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return this.isAscending ? -1 : 1;
            if (aValue > bValue) return this.isAscending ? 1 : -1;
            return 0;
        });
    }

    showChatSection(subsection: string): void {
        this.activeChatSection = subsection;
    }

    returnToHome(): void {
        this.socketService.disconnect();
        this.router.navigate(['/home']);
        this.sharedService.resetSharedServices();
    }
}
