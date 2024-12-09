import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Player } from '@app/interfaces/Player';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';
import { BoardService } from '@app/services/edit/board/board.service';
import { GamesService } from '@app/services/games/games.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';

@Injectable({
    providedIn: 'root',
})
export class WaitingRoomService {
    constructor(
        readonly socketService: SocketService,
        readonly snackBar: MatSnackBar,
        private router: Router,
        readonly gameService: GamesService,
        readonly sharedService: SharedDataService,
        readonly boardService: BoardService,
    ) {}

    kickPlayer(component: WaitingRoomPageComponent, user: Player): void {
        this.socketService.emit('kickPlayer', {
            room: component.accessCode,
            player: user,
            isVirtual: user.isVirtual,
        });
    }

    isLobbyFull(component: WaitingRoomPageComponent): boolean {
        const PLAYERS_COUNT = component.roomUsers[component.accessCode]?.length || 0;
        const MAX_SMALL = 2;
        const MAX_MEDIUM = 4;
        const MAX_LARGE = 6;

        if (
            (component.gameSize === 'petite' && PLAYERS_COUNT === MAX_SMALL) ||
            (component.gameSize === 'moyenne' && PLAYERS_COUNT === MAX_MEDIUM) ||
            (component.gameSize === 'grande' && PLAYERS_COUNT === MAX_LARGE)
        ) {
            return true;
        }
        return false;
    }

    isLobbyReady(component: WaitingRoomPageComponent): boolean {
        const PLAYERS_COUNT = component.roomUsers[component.accessCode]?.length || 0;
        const MAX_SMALL = 2;
        const MAX_MEDIUM = 4;
        const MAX_LARGE = 6;

        if (
            (component.gameSize === 'petite' && PLAYERS_COUNT === MAX_SMALL) ||
            (component.gameSize === 'moyenne' && PLAYERS_COUNT >= MAX_SMALL && PLAYERS_COUNT <= MAX_MEDIUM) ||
            (component.gameSize === 'grande' && PLAYERS_COUNT >= MAX_SMALL && PLAYERS_COUNT <= MAX_LARGE)
        ) {
            return true;
        }
        return false;
    }

    toggleAccessibility(component: WaitingRoomPageComponent): void {
        this.socketService.emit('toggleAccessibility', { room: component.accessCode });
    }

    onPlayMatch(component: WaitingRoomPageComponent): void {
        const initialBoard = this.sharedService.getGame().board;
        const clonedBoard = JSON.parse(JSON.stringify(initialBoard));
        const accessCode = this.sharedService.getAccessCode();
        const PERCENTAGE = 0.5;
        const players = [...component.roomUsers[component.accessCode]].sort((a, b) => {
            if (b.character.stats.speed !== a.character.stats.speed) {
                return b.character.stats.speed - a.character.stats.speed;
            }
            return Math.random() - PERCENTAGE;
        });
        const newBoard = this.boardService.placePlayersOnBoard(clonedBoard, component.roomUsers[accessCode]);
        this.socketService.emit('startGame', { room: component.accessCode, board: newBoard, randomizedPlayers: players });
    }

    onLeaveMatch(component: WaitingRoomPageComponent): void {
        if (component.player.isAdmin) {
            this.socketService.emit('adminLeft', { room: component.accessCode });
            this.socketService.disconnect();
            this.router.navigate(['/home']);
            this.sharedService.resetSharedServices();
        } else {
            this.socketService.disconnect();
            this.sharedService.setPlayersInGame([]);
            this.router.navigate(['/home']);
            this.sharedService.resetSharedServices();
        }
    }
}
