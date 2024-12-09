import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CharacterStatsComponent } from '@app/components/character-stats/character-stats.component';
import { JournalComponent } from '@app/components/journal-de-bord/journal-de-bord.component';
import { MatchBoardComponent } from '@app/components/match-board/match-board.component';
import { Player } from '@app/interfaces/Player';
import { browserRefresh } from '@app/pages/app/app.component';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { InventoryService } from '@app/services/inventory/inventory.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-combat',
    standalone: true,
    imports: [CharacterStatsComponent, CommonModule, JournalComponent],
    templateUrl: './combat.component.html',
    styleUrls: ['./combat.component.scss'],
})
export class CombatComponent implements OnInit, OnDestroy {
    private subscriptions = new Subscription();
    @ViewChild(MatchBoardComponent) matchBoardComponent: MatchBoardComponent;
    firstDefender: Player;
    escapeAttempts: { [playerId: string]: number } = {};
    isActiveFighter: boolean = false;
    playersInTheFight: Player[] = [];
    roundOrder: Player[] = [];
    displayRoundOrder: Player[] = [];
    roundTimeLeft: number = 5;
    attackUsed: boolean = false;
    roomJournal: { usersMentionned: Player[]; text: string }[] = [];
    noMoreEscapes: boolean = false;

    opponentPlayer: Player | undefined;
    myPlayer: Player | undefined;
    activeFighter: Player | undefined;
    firstFighter: Player;
    firstFighterBeforeDice: Player;
    firstDefenderBeforeDice: Player;
    myPlayerBeforeDice: Player;

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public data: {
            victimPlayerAfterDice: Player;
            victimPlayerBeforeDice: Player;
            fightStarterAfterDice: Player;
            fightStarterBeforeDice: Player;
            playersInOrder: Player[];
        },
        readonly dialogRef: MatDialogRef<CombatComponent>,
        readonly sharedService: SharedDataService,
        readonly turnSystemService: TurnSystemService,
        readonly socketService: SocketService,
        readonly router: Router,
        readonly inventoryService: InventoryService,
    ) {
        this.playersInTheFight = data.playersInOrder;
        this.firstFighter = this.playersInTheFight[0];
        this.firstDefender = this.playersInTheFight[1];
        if (this.firstFighter.username === data.fightStarterBeforeDice.username) {
            this.firstFighterBeforeDice = data.fightStarterBeforeDice;
            this.firstDefenderBeforeDice = data.victimPlayerBeforeDice;
        } else if (this.firstFighter.username === data.victimPlayerBeforeDice.username) {
            this.firstFighterBeforeDice = data.victimPlayerBeforeDice;
            this.firstDefenderBeforeDice = data.fightStarterBeforeDice;
        }
    }
    /* eslint-disable @typescript-eslint/no-non-null-assertion */ // we need to use it here because it helps us manage certain cases.

    //#region Initialization
    ngOnInit(): void {
        this.attackUsed = false;
        this.turnSystemService.initializeCombat(this.playersInTheFight, this.sharedService.getAccessCode());
        this.myPlayer = this.sharedService.getPlayer();
        if (browserRefresh) {
            this.subscriptions.unsubscribe();
            this.router.navigate(['/home']);
            this.sharedService.resetSharedServices();
            return;
        }
        this.opponentPlayer = this.playersInTheFight.find((p) => p.username !== this.myPlayer?.username);
        this.startNewRound();

        if (this.myPlayer?.username === this.firstFighter.username) {
            this.myPlayerBeforeDice = this.firstFighterBeforeDice;
            this.isActiveFighter = true;
        } else {
            this.myPlayerBeforeDice = this.firstDefenderBeforeDice;
            this.isActiveFighter = false;
        }

        this.setUpListener();

        this.subscriptions.add(
            this.turnSystemService.roundOrder$.subscribe((order) => {
                this.roundOrder = order;
            }),
        );

        this.displayRoundOrder = [...this.roundOrder];
        this.socketService.emit('initializeRound', { room: this.sharedService.getAccessCode(), players: this.playersInTheFight });
        this.initializeEscapeAttempts();
        this.setupAutomaticAttack();
    }

    ngOnDestroy(): void {
        const room = this.sharedService.getAccessCode();

        this.socketService.emit('stopCombatTimer', {
            room: room,
            players: this.playersInTheFight,
        });

        this.socketService.off('roundTimeLeftUpdate');
        this.socketService.off('escapeAttemptUpdate');
        this.socketService.off('roundEnded');
        this.socketService.off('hasAttacked');
        this.socketService.off('playerQuit');
        this.socketService.off('diceRolled');

        if (this.sharedService.getAccessCode()) {
            this.initializeEscapeAttempts();
        }
        this.cleanupFightListeners();
    }

    cleanupFightListeners(): void {
        this.socketService.off('hasAttacked'); // Remove listener for attack events
        this.socketService.off('diceRolled'); // Remove listener for dice rolls
        this.socketService.off('escapeFailed'); // Remove listener for escape attempts
        this.socketService.off('roundEnded'); // Remove listener for round end
    }

    initializeEscapeAttempts(): void {
        this.escapeAttempts[this.firstFighter.username] = 2;
        this.escapeAttempts[this.firstDefender.username] = 2;
    }
    //#endregion

    //#region Listeners
    setUpListener(): void {
        const room = this.sharedService.getAccessCode();
        this.socketService.off('roundTimeLeftUpdate');
        this.socketService.off('escapeAttemptUpdate');
        this.socketService.off('roundEnded');
        this.socketService.off('playerQuit');
        this.socketService.off('hasAttacked');
        this.socketService.off('diceRolled');

        this.initializeEscapeAttempts();
        this.socketService.on('fightEnded', (res: { escapingPlayer: Player }) => {
            if (
                (this.myPlayer?.username === this.sharedService.getActivePlayer()?.username && this.sharedService.getRemainingSpeed() !== 0) ||
                this.sharedService.getActivePlayer()?.isVirtual
            ) {
                setTimeout(() => {
                    this.socketService.emit('resumeTurnTimer', {
                        room: this.sharedService.getAccessCode(),
                        players: this.sharedService.getPlayersInGame(),
                    });
                }, 300);
            }
            this.dialogRef.close(CombatComponent);
        });
        this.socketService.on('escapeFailed', (res: { escaper: Player }) => {
            this.roomJournal.push({
                usersMentionned: [res.escaper],
                text: `${res.escaper.username} a tenté de s'enfuir, mais en vain !`,
            });
        });
        this.socketService.on('roundEnded', (data: { room: string; player: Player }) => {
            if (data.room === this.sharedService.getAccessCode()) {
                this.isActiveFighter = !this.isActiveFighter;
                this.attackUsed = false;
                this.startNewRound();
            }
        });
        this.socketService.on('playerQuitFight', (res: { player: Player }) => {
            if (this.matchBoardComponent) {
                this.matchBoardComponent.clearAvatar(res.player.character.body);
            }
            this.turnSystemService.removePlayerFromTurnOrder(res.player.username);
            const winner = this.playersInTheFight.find((p) => p.username !== res.player.username);
            this.dialogRef.close({ winner: winner });
        });
        this.socketService.on('kickLastPlayer', (res: { player: Player }) => {
            if (this.matchBoardComponent) {
                for (let row = 0; row < this.matchBoardComponent.board.length; row++) {
                    for (let col = 0; col < this.matchBoardComponent.board[row].length; col++) {
                        if (this.matchBoardComponent.board[row][col].avatar === res.player.character.body) {
                            this.inventoryService.placeItemsOnNearestTiles(
                                res.player.inventory!,
                                this.matchBoardComponent.board[row][col].position!,
                                this.matchBoardComponent.board,
                                this.sharedService.getAccessCode(),
                            );
                        }
                    }
                }
            }
            this.dialogRef.close();
        });
        this.socketService.on('hasAttacked', (res: { attackSucceed: boolean; attacker: Player; impact: number }) => {
            const otherPlayer = this.playersInTheFight.find((p) => p.username !== res.attacker.username);
            if (res.attackSucceed) {
                this.roomJournal.push({
                    usersMentionned: [res.attacker, otherPlayer!],
                    text: `${res.attacker.username}
                     vient d'attaquer ${otherPlayer?.username}!\n${otherPlayer?.username} vient de perdre un point de vie!`,
                });
                if (res.attacker.isVirtual) {
                    this.socketService.emit('attackerStrike', { room: this.sharedService.getAccessCode(), attacker: res.attacker });
                }
                if (otherPlayer?.isVirtual) {
                    this.socketService.emit('defenderHit', { room: this.sharedService.getAccessCode(), defender: otherPlayer });
                }
                if (this.myPlayer?.username === res.attacker.username) {
                    this.socketService.emit('attackerStrike', { room: this.sharedService.getAccessCode(), attacker: res.attacker });
                    this.opponentPlayer!.character.stats.health -= res.impact;
                    if (this.opponentPlayer!.character.stats.health === 0) {
                        this.dialogRef.close({ winner: this.myPlayer, loser: this.opponentPlayer });
                        this.opponentPlayer!.inventory = [null, null];
                    }
                } else if (this.myPlayer?.username !== res.attacker.username) {
                    this.socketService.emit('defenderHit', { room: this.sharedService.getAccessCode(), defender: otherPlayer });
                    this.myPlayer!.character.stats.health -= res.impact;
                    if (this.myPlayer!.character.stats.health === 0) {
                        this.cleanupFightListeners();
                        this.dialogRef.close({ winner: this.opponentPlayer, loser: this.myPlayer });
                        this.myPlayer!.inventory = [null, null];
                    }
                }
            } else {
                this.roomJournal.push({
                    usersMentionned: [res.attacker, otherPlayer!],
                    text: `${res.attacker.username} à tenter une 
                    attaque sur ${otherPlayer?.username} mais il s'est manqué!\n${otherPlayer?.username} l'a échappé belle!`,
                });
            }
        });
        this.socketService.on('roundTimeLeftUpdate', (data: { room: string; player: Player; timeLeft: number }) => {
            if (data.room === room) {
                this.roundTimeLeft = data.timeLeft;
            }
        });

        this.socketService.on('escapeAttemptUpdate', (data: { player: Player; remainingAttempts: number }) => {});
    }
    //#endregion
    setupAutomaticAttack(): void {
        const startingHealth = this.opponentPlayer?.character.stats.health;
        const room = this.sharedService.getAccessCode();
        this.socketService.on('roundTimeLeftUpdate', (data: { room: string; player: Player; timeLeft: number }) => {
            let randomNumber = Math.floor(Math.random() * 4) + 1; // random number between 1 and 4
            if (data.room === room && data.timeLeft === randomNumber && data.player.isVirtual && !this.isActiveFighter) {
                if (data.player.profile === 'agressif') {
                    this.performVirtualAttack();
                    this.socketService.emit('playerAction', {
                        room: this.sharedService.getAccessCode(),
                        player: data.player,
                    });
                } else if (data.player.profile === 'defensif') {
                    if (this.opponentPlayer!.character.stats.health >= startingHealth! && this.escapeAttempts[this.opponentPlayer!.username] > 0) {
                        this.performVirtualAttack();
                        this.socketService.emit('playerAction', {
                            room: this.sharedService.getAccessCode(),
                            player: data.player,
                        });
                    } else if (
                        this.opponentPlayer!.character.stats.health < startingHealth! &&
                        this.escapeAttempts[this.opponentPlayer!.username] > 0
                    ) {
                        this.attemptVirtualEscape();
                        this.socketService.emit('playerAction', {
                            room: this.sharedService.getAccessCode(),
                            player: data.player,
                        });
                    } else if (
                        this.opponentPlayer!.character.stats.health < startingHealth! &&
                        this.escapeAttempts[this.opponentPlayer!.username] <= 0
                    ) {
                        this.performVirtualAttack();
                        this.socketService.emit('playerAction', {
                            room: this.sharedService.getAccessCode(),
                            player: data.player,
                        });
                    }
                }
            } else if (data.room === room && data.timeLeft === 0) {
                if (this.isActiveFighter && !this.attackUsed && !data.player.isVirtual) {
                    this.performAutomaticAttack();
                } else if (data.player.isVirtual && data.player.profile === 'agressif') {
                    this.performVirtualAttack();
                } else if (
                    data.player.isVirtual &&
                    data.player.profile === 'defensif' &&
                    this.opponentPlayer!.character.stats.health < startingHealth! &&
                    this.escapeAttempts[this.opponentPlayer!.username] <= 0
                ) {
                    this.performVirtualAttack();
                } else if (
                    data.player.isVirtual &&
                    data.player.profile === 'defensif' &&
                    this.opponentPlayer!.character.stats.health < startingHealth! &&
                    this.escapeAttempts[this.opponentPlayer!.username] > 0
                ) {
                    this.attemptVirtualEscape();
                } else if (
                    data.player.isVirtual &&
                    data.player.profile === 'defensif' &&
                    this.opponentPlayer!.character.stats.health >= startingHealth! &&
                    this.escapeAttempts[this.opponentPlayer!.username] > 0
                ) {
                    this.performVirtualAttack();
                }
            }
        });
    }
    performVirtualAttack(): void {
        const attacker = this.opponentPlayer;
        const defender = this.myPlayer;
        if (!attacker || !defender) {
            return;
        }

        const attackSucceed = attacker.character.stats.attack - defender.character.stats.defense > 0;
        const IMPACT = attackSucceed ? 1 : 0;

        this.socketService.emit('attack', {
            room: this.sharedService.getAccessCode(),
            attackSucceed: attackSucceed,
            attacker: attacker,
            impact: IMPACT,
        });
        this.attackUsed = true;
    }

    performAutomaticAttack(): void {
        const attacker = this.myPlayer;
        const defender = this.opponentPlayer;

        if (!attacker || !defender) {
            return;
        }

        const attackSucceed = attacker.character.stats.attack - defender.character.stats.defense > 0;
        const IMPACT = attackSucceed ? 1 : 0;

        this.socketService.emit('attack', {
            room: this.sharedService.getAccessCode(),
            attackSucceed: attackSucceed,
            attacker: attacker,
            impact: IMPACT,
        });
        this.attackUsed = true;
    }

    //#region Other
    performAttack(): void {
        this.attackUsed = true;
        const attacker = this.myPlayer;
        const defender = this.opponentPlayer;

        if (attacker!.character.stats.attack - defender!.character.stats.defense > 0) {
            const IMPACT = 1;
            this.socketService.emit('attack', {
                room: this.sharedService.getAccessCode(),
                attackSucceed: true,
                attacker: this.myPlayer,
                impact: IMPACT,
            });
        } else {
            const IMPACT = 0;
            this.socketService.emit('attack', {
                room: this.sharedService.getAccessCode(),
                attackSucceed: false,
                attacker: this.myPlayer,
                impact: IMPACT,
            });
        }
        this.socketService.emit('playerAction', {
            room: this.sharedService.getAccessCode(),
            player: this.myPlayer,
        });
    }

    attemptEscape(): boolean {
        if (this.escapeAttempts[this.myPlayer!.username] > 0) {
            this.escapeAttempts[this.myPlayer!.username]--;
            const ESCAPE_ATTEMPT = Math.random() < 0.4;
            if (ESCAPE_ATTEMPT) {
                this.socketService.emit('endFight', {
                    room: this.sharedService.getAccessCode(),
                    escapingPlayer: this.myPlayer,
                });
                return true;
            }
        }
        if (this.escapeAttempts[this.myPlayer!.username] <= 0) {
            this.noMoreEscapes = true;
            this.socketService.emit('escapeAttempted', {
                room: this.sharedService.getAccessCode(),
                escaper: this.myPlayer,
                escapeAttempts: this.escapeAttempts,
            });
        }
        this.socketService.emit('escapeAttempted', {
            room: this.sharedService.getAccessCode(),
            escaper: this.myPlayer,
            escapeAttempts: this.escapeAttempts,
        });
        this.socketService.emit('playerAction', {
            room: this.sharedService.getAccessCode(),
            player: this.myPlayer,
        });
        this.socketService.emit('escapeAttempt', { room: this.sharedService.getAccessCode(), escaper: this.myPlayer });
        return false;
    }

    attemptVirtualEscape(): boolean {
        if (this.escapeAttempts[this.opponentPlayer!.username] > 0) {
            this.escapeAttempts[this.opponentPlayer!.username]--;
            const ESCAPE_ATTEMPT = Math.random() < 0.4;
            if (ESCAPE_ATTEMPT) {
                this.socketService.emit('endFight', {
                    room: this.sharedService.getAccessCode(),
                    escapingPlayer: this.opponentPlayer,
                });
                return true;
            }
        }
        if (this.escapeAttempts[this.opponentPlayer!.username] <= 0) {
            this.socketService.emit('escapeAttempted', {
                room: this.sharedService.getAccessCode(),
                escaper: this.opponentPlayer,
                escapeAttempts: this.escapeAttempts,
            });
        }
        this.socketService.emit('escapeAttempted', {
            room: this.sharedService.getAccessCode(),
            escaper: this.opponentPlayer,
            escapeAttempts: this.escapeAttempts,
        });
        this.socketService.emit('escapeAttempt', { room: this.sharedService.getAccessCode(), escaper: this.opponentPlayer });
        return false;
    }

    quitFight(): void {
        this.dialogRef.close();
        this.socketService.disconnect();
        this.subscriptions.unsubscribe();
        this.router.navigate(['/home']);
        this.sharedService.resetSharedServices();
    }

    startNewRound(): void {
        this.attackUsed = false;
        this.socketService.emit('initializeRound', { room: this.sharedService.getAccessCode(), players: this.playersInTheFight });
        this.socketService.emit('startNewRound', {
            attacked: this.firstDefenderBeforeDice,
            attacking: this.firstFighterBeforeDice,
            debugMode: this.sharedService.getDebugModeStatus(),
        });
        this.socketService.on('diceRolled', (res: { newAttacked: Player; newAttacking: Player }) => {
            if (this.myPlayer?.username === res.newAttacked.username) {
                this.myPlayer.character.stats.attack = res.newAttacked.character.stats.attack;
                this.myPlayer.character.stats.defense = res.newAttacked.character.stats.defense;
                this.opponentPlayer!.character.stats.attack = res.newAttacking.character.stats.attack;
                this.opponentPlayer!.character.stats.defense = res.newAttacking.character.stats.defense;
            } else if (this.myPlayer!.username !== res.newAttacked.username) {
                this.myPlayer!.character.stats.attack = res.newAttacking.character.stats.attack;
                this.myPlayer!.character.stats.defense = res.newAttacking.character.stats.defense;
                this.opponentPlayer!.character.stats.attack = res.newAttacked.character.stats.attack;
                this.opponentPlayer!.character.stats.defense = res.newAttacked.character.stats.defense;
            }
        });
    }
    //#endregion
}
/* eslint-enable @typescript-eslint/no-non-null-assertion */
