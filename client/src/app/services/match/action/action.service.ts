import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CombatComponent } from '@app/components/combat/combat.component';
import { MatchBoardComponent } from '@app/components/match-board/match-board.component';
import { Player } from '@app/interfaces/Player';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { SocketService } from '@app/services/socket/socket.service';
import { SharedDataService } from '../../shared-data/shared-data.service';

@Injectable({
    providedIn: 'root',
})
export class ActionService {
    players: Player[] = [];
    activePlayer: Player | null = null;

    constructor(
        public turnSystemService: TurnSystemService,
        public socketService: SocketService,
        public dialog: MatDialog,
        public sharedService: SharedDataService,
    ) {}

    setPlayers(players: Player[]) {
        this.players = players;
    }

    setActivePlayer(player: Player) {
        this.activePlayer = player;
    }

    openAttackDialog(
        component: MatchBoardComponent,
        attackedPlayerAfterDice: Player,
        attackedPlayerBeforeDice: Player,
        attackingPlayerAfterDice: Player,
        attackingPlayerBeforeDice: Player,
        playersInOrders: Player[],
    ): void {
        this.sharedService.setCombatInProgress(true);
        const dialogRef = this.dialog.open(CombatComponent, {
            data: {
                victimPlayerAfterDice: attackedPlayerAfterDice,
                victimPlayerBeforeDice: attackedPlayerBeforeDice,
                fightStarterAfterDice: attackingPlayerAfterDice,
                fightStarterBeforeDice: attackingPlayerBeforeDice,
                playersInOrder: playersInOrders,
            },
        });
        dialogRef.afterClosed().subscribe((res: { winner: Player | undefined; loser: Player | undefined }) => {
            if (res.winner && res.loser) {
                const currentVictories = component.playersVictories.get(res.winner.username) ?? 0;
                component.playersVictories.set(res.winner.username, currentVictories + 1);
                let winnerData = { username: res.winner.username, isVirtual: res.winner.isVirtual };
                this.socketService.emit('victoryUpdate', {
                    room: this.sharedService.getAccessCode(),
                    winner: winnerData,
                    loser: res.loser.username,
                    isFlagHome: false,
                });
            } else if (res.winner && !res.loser) {
                const currentVictories = component.playersVictories.get(res.winner.username) ?? 0;
                component.playersVictories.set(res.winner.username, currentVictories + 1);
                let winnerData = { username: res.winner.username, isVirtual: res.winner.isVirtual };
                this.socketService.emit('victoryUpdate', {
                    room: this.sharedService.getAccessCode(),
                    winner: winnerData,
                    loser: '',
                    isFlagHome: false,
                });
            }
        });
    }
    getPlayerByAvatar(avatar: string): Player | undefined {
        return this.players.find((player) => player.character.body === avatar);
    }
}
