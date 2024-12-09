import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { MAX_VICTORY_POINTS, SIXTY_SEC, STAT_OF_FOUR, STAT_OF_SIX, THOUSAND_MS } from '@app/gateways/combat/combat.gateway.constants';
import { TimersGateway } from '@app/gateways/timers/timers.gateway';
import { Player } from '@app/model/schema/player.schema';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { UsersService } from '@app/services/users/users.service';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class CombatGateway {
    @WebSocketServer() server: Server;
    readonly socketRooms: Map<string, string> = new Map();
    readonly socketPlayers: Map<string, Player> = new Map();
    readonly activeRooms: Set<string> = new Set();
    private recentFightWinners: Map<string, string> = new Map();

    constructor(
        public logger: Logger,
        @Inject(forwardRef(() => TimersGateway)) readonly timersGateway: TimersGateway,
        @Inject(forwardRef(() => ChatGateway)) readonly chatGateway: ChatGateway,
        readonly roomsService: RoomsService,
        readonly usersService: UsersService,
    ) {}

    @SubscribeMessage('startFight')
    handleStartFight(socket: Socket | null, payload: { room: string; attacked: Player; attacking: Player; debugMode: boolean }) {
        const { room, attacked, attacking, debugMode } = payload;

        this.timersGateway.playersInFight.set(room, [attacked, attacking]);
        const attackedAfterDice: Player = JSON.parse(JSON.stringify(attacked));
        const attackingAfterDice: Player = JSON.parse(JSON.stringify(attacking));

        let dice: { attackDie: number; defenseDie: number };
        if (attacked.character.dice === 'attack') {
            dice = { attackDie: STAT_OF_SIX, defenseDie: STAT_OF_FOUR };
            if (debugMode) {
                attackedAfterDice.character.stats.attack = attacked.character.stats.attack + dice.attackDie; // Max value
                attackedAfterDice.character.stats.defense = attacked.character.stats.defense + 1; // Min value
            } else {
                attackedAfterDice.character.stats.attack = attacked.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackedAfterDice.character.stats.defense = attacked.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        } else {
            dice = { attackDie: STAT_OF_FOUR, defenseDie: STAT_OF_SIX };
            if (debugMode) {
                attackedAfterDice.character.stats.attack = attacked.character.stats.attack + dice.attackDie; // Max value
                attackedAfterDice.character.stats.defense = attacked.character.stats.defense + 1; // Min value
            } else {
                attackedAfterDice.character.stats.attack = attacked.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackedAfterDice.character.stats.defense = attacked.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        }

        if (attacking.character.dice === 'attack') {
            dice = { attackDie: STAT_OF_SIX, defenseDie: STAT_OF_FOUR };
            if (debugMode) {
                attackingAfterDice.character.stats.attack = attacking.character.stats.attack + dice.attackDie; // Max value
                attackingAfterDice.character.stats.defense = attacking.character.stats.defense + 1; // Min value
            } else {
                attackingAfterDice.character.stats.attack = attacking.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackingAfterDice.character.stats.defense = attacking.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        } else {
            dice = { attackDie: STAT_OF_FOUR, defenseDie: STAT_OF_SIX };
            if (debugMode) {
                attackingAfterDice.character.stats.attack = attacking.character.stats.attack + dice.attackDie; // Max value
                attackingAfterDice.character.stats.defense = attacking.character.stats.defense + 1; // Min value
            } else {
                attackingAfterDice.character.stats.attack = attacking.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackingAfterDice.character.stats.defense = attacking.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        }
        const playersFightingInOrder = [];
        const playersFighting = [attackedAfterDice, attackingAfterDice];
        const firstTurnPlayer = this.determineFirstActionPlayer(attackingAfterDice, attackedAfterDice);
        playersFightingInOrder.push(firstTurnPlayer);
        const otherPlayer = playersFighting.find((p) => p.username !== firstTurnPlayer.username);
        playersFightingInOrder.push(otherPlayer);

        if (this.chatGateway.playersInRoom.get(room)) {
            const attackedPlayer = this.chatGateway.playersInRoom.get(room).find((p) => p.username === attacked.username);
            const attackingPlayer = this.chatGateway.playersInRoom.get(room).find((p) => p.username === attacking.username);
            if (attackedPlayer && attackingPlayer) {
                attackedPlayer.character.combats = (attackedPlayer.character.combats || 0) + 1;
                attackingPlayer.character.combats = (attackingPlayer.character.combats || 0) + 1;
                this.timersGateway.pauseTimer(room);

                this.server.to(room).emit('fightStarted', {
                    attackedAfterDice,
                    attackedBeforeDice: attacked,
                    attackedCombats: attackedPlayer.character.combats,
                    attackingAfterDice,
                    attackingBeforeDice: attacking,
                    attackingCombats: attackingPlayer.character.combats,
                    playerInOrder: playersFightingInOrder,
                });
            } else {
                return;
            }
        } else {
            return;
        }
    }
    virtualPlayersSmoke(room: string, attackedPlayer: Player, virtualPlayer: Player, debugMode: boolean): void {
        this.timersGateway.playersInFight.set(room, [attackedPlayer, virtualPlayer]);
        const attackedAfterDice: Player = JSON.parse(JSON.stringify(attackedPlayer));
        const attackingAfterDice: Player = JSON.parse(JSON.stringify(virtualPlayer));

        let dice: { attackDie: number; defenseDie: number };
        if (attackedPlayer.character.dice === 'attack') {
            dice = { attackDie: STAT_OF_SIX, defenseDie: STAT_OF_FOUR };
            if (debugMode) {
                attackedAfterDice.character.stats.attack = attackedPlayer.character.stats.attack + dice.attackDie; // Max value
                attackedAfterDice.character.stats.defense = attackedPlayer.character.stats.defense + 1; // Min value
            } else {
                attackedAfterDice.character.stats.attack = attackedPlayer.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackedAfterDice.character.stats.defense = attackedPlayer.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        } else {
            dice = { attackDie: STAT_OF_FOUR, defenseDie: STAT_OF_SIX };
            if (debugMode) {
                attackedAfterDice.character.stats.attack = attackedPlayer.character.stats.attack + dice.attackDie; // Max value
                attackedAfterDice.character.stats.defense = attackedPlayer.character.stats.defense + 1; // Min value
            } else {
                attackedAfterDice.character.stats.attack = attackedPlayer.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackedAfterDice.character.stats.defense = attackedPlayer.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        }

        if (virtualPlayer.character.dice === 'attack') {
            dice = { attackDie: STAT_OF_SIX, defenseDie: STAT_OF_FOUR };
            if (debugMode) {
                attackingAfterDice.character.stats.attack = virtualPlayer.character.stats.attack + dice.attackDie; // Max value
                attackingAfterDice.character.stats.defense = virtualPlayer.character.stats.defense + 1; // Min value
            } else {
                attackingAfterDice.character.stats.attack = virtualPlayer.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackingAfterDice.character.stats.defense = virtualPlayer.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        } else {
            dice = { attackDie: STAT_OF_FOUR, defenseDie: STAT_OF_SIX };
            if (debugMode) {
                attackingAfterDice.character.stats.attack = virtualPlayer.character.stats.attack + dice.attackDie; // Max value
                attackingAfterDice.character.stats.defense = virtualPlayer.character.stats.defense + 1; // Min value
            } else {
                attackingAfterDice.character.stats.attack = virtualPlayer.character.stats.attack + Math.floor(Math.random() * dice.attackDie) + 1;
                attackingAfterDice.character.stats.defense = virtualPlayer.character.stats.defense + Math.floor(Math.random() * dice.defenseDie) + 1;
            }
        }
        const playersFightingInOrder = [];
        const playersFighting = [attackedAfterDice, attackingAfterDice];
        const firstTurnPlayer = this.determineFirstActionPlayer(attackingAfterDice, attackedAfterDice);
        playersFightingInOrder.push(firstTurnPlayer);
        const otherPlayer = playersFighting.find((p) => p.username !== firstTurnPlayer.username);
        playersFightingInOrder.push(otherPlayer);

        if (this.chatGateway.playersInRoom.get(room)) {
            const victimPlayer = this.chatGateway.playersInRoom.get(room).find((p) => p.username === attackedPlayer.username);
            const attackingPlayer = this.chatGateway.playersInRoom.get(room).find((p) => p.username === virtualPlayer.username);
            if (victimPlayer && attackingPlayer) {
                victimPlayer.character.combats = (victimPlayer.character.combats || 0) + 1;
                attackingPlayer.character.combats = (attackingPlayer.character.combats || 0) + 1;
                this.timersGateway.pauseTimer(room);
                if (!victimPlayer.isVirtual) {
                    this.server.to(room).emit('fightStarted', {
                        attackedAfterDice,
                        attackedBeforeDice: victimPlayer,
                        attackedCombats: victimPlayer.character.combats,
                        attackingAfterDice,
                        attackingBeforeDice: virtualPlayer,
                        attackingCombats: attackingPlayer.character.combats,
                        playerInOrder: playersFightingInOrder,
                    });
                } else {
                    if (attackedAfterDice.isVirtual && attackingAfterDice.isVirtual) {
                        this.server.to(room).emit('vpFight', { attacker: attackingAfterDice, victim: attackedAfterDice });
                        if (attackedAfterDice.profile === 'defensif' && attackingAfterDice.profile === 'agressif') {
                            const ENDFIGHT = Math.random() < 0.5;
                            let randomTime = Math.floor(Math.random() * 5000) + 5000;
                            if (ENDFIGHT) {
                                setTimeout(() => {
                                    this.handleEndFight(null, { room, escapingPlayer: attackedAfterDice });
                                }, randomTime);
                                setTimeout(() => {
                                    this.timersGateway.handleResumeTurnTimer(null, {
                                        room,
                                        players: this.timersGateway.randomizedPlayersInRoom.get(room),
                                    });
                                }, randomTime + 300);
                            } else {
                                const winner = Math.random() < 0.5 ? attackedAfterDice : attackingAfterDice;
                                const loser = winner === attackedAfterDice ? attackingAfterDice : attackedAfterDice;
                                let winnerData = { username: winner.username, isVirtual: winner.isVirtual };
                                if (loser.username === attackingAfterDice.username) {
                                    setTimeout(
                                        () => {
                                            this.handleVictoryUpdate(null, { room, winner: winnerData, loser: loser.username, isFlagHome: false });
                                            setTimeout(() => {
                                                this.timersGateway.endTurn(room, this.timersGateway.randomizedPlayersInRoom.get(room), false);
                                            }, 3000);
                                        },
                                        Math.floor(Math.random() * 20000) + 10000,
                                    );
                                } else {
                                    setTimeout(
                                        () => {
                                            this.handleVictoryUpdate(null, { room, winner: winnerData, loser: loser.username, isFlagHome: false });
                                        },
                                        Math.floor(Math.random() * 20000) + 10000,
                                    );
                                }
                            }
                        }

                        if (attackedAfterDice.profile === 'agressif' && attackingAfterDice.profile === 'agressif') {
                            const winner = Math.random() < 0.5 ? attackedAfterDice : attackingAfterDice;
                            const loser = winner === attackedAfterDice ? attackingAfterDice : attackedAfterDice;
                            let winnerData = { username: winner.username, isVirtual: winner.isVirtual };
                            if (loser.username === attackingAfterDice.username) {
                                setTimeout(
                                    () => {
                                        this.handleVictoryUpdate(null, { room, winner: winnerData, loser: loser.username, isFlagHome: false });
                                        setTimeout(() => {
                                            this.timersGateway.endTurn(room, this.timersGateway.randomizedPlayersInRoom.get(room), false);
                                        }, 3000);
                                    },
                                    Math.floor(Math.random() * 20000) + 10000,
                                );
                            } else {
                                setTimeout(
                                    () => {
                                        this.handleVictoryUpdate(null, { room, winner: winnerData, loser: loser.username, isFlagHome: false });
                                    },
                                    Math.floor(Math.random() * 20000) + 10000,
                                );
                            }
                        }
                    }
                }
            } else {
                return;
            }
        } else {
            return;
        }
    }

    @SubscribeMessage('startNewRound')
    handleStartNewRound(socket: Socket, payload: { attacked: Player; attacking: Player; debugMode: boolean }) {
        const { attacked, attacking, debugMode } = payload;

        const attackedDiceType = attacked.character.dice;
        const attackingDiceType = attacking.character.dice;

        if (debugMode) {
            if (attackedDiceType === 'attack') {
                attacked.character.stats.attack += STAT_OF_SIX;
                attacked.character.stats.defense += 1;
            } else if (attackedDiceType === 'defense') {
                attacked.character.stats.attack += STAT_OF_FOUR;
                attacked.character.stats.defense += 1;
            }

            if (attackingDiceType === 'attack') {
                attacking.character.stats.attack += STAT_OF_SIX;
                attacking.character.stats.defense += 1;
            } else if (attackingDiceType === 'defense') {
                attacking.character.stats.attack += STAT_OF_FOUR;
                attacking.character.stats.defense += 1;
            }
        } else {
            if (attackedDiceType === 'attack') {
                attacked.character.stats.attack += Math.floor(Math.random() * STAT_OF_SIX) + 1;
                attacked.character.stats.defense += Math.floor(Math.random() * STAT_OF_FOUR) + 1;
            } else if (attackedDiceType === 'defense') {
                attacked.character.stats.attack += Math.floor(Math.random() * STAT_OF_FOUR) + 1;
                attacked.character.stats.defense += Math.floor(Math.random() * STAT_OF_SIX) + 1;
            }

            if (attackingDiceType === 'attack') {
                attacking.character.stats.attack += Math.floor(Math.random() * STAT_OF_SIX) + 1;
                attacking.character.stats.defense += Math.floor(Math.random() * STAT_OF_FOUR) + 1;
            } else if (attackingDiceType === 'defense') {
                attacking.character.stats.attack += Math.floor(Math.random() * STAT_OF_FOUR) + 1;
                attacking.character.stats.defense += Math.floor(Math.random() * STAT_OF_SIX) + 1;
            }
        }

        this.server.emit('diceRolled', { newAttacked: attacked, newAttacking: attacking });
    }

    // combat
    @SubscribeMessage('attack')
    handleAttack(socket: Socket, payload: { room: string; attackSucceed: boolean; attacker: Player; impact: number }) {
        const { room, attackSucceed, attacker, impact } = payload;

        this.server.to(room).emit('hasAttacked', {
            attackSucceed,
            attacker,
            impact,
        });
    }
    // combat
    @SubscribeMessage('endFight')
    handleEndFight(socket: Socket | null, payload: { room: string; escapingPlayer: Player }) {
        const { room, escapingPlayer } = payload;
        const escapePlayer = this.chatGateway.playersInRoom.get(room).find((p) => p.username === escapingPlayer.username);
        this.timersGateway.playersInFight.set(room, []);
        if (escapePlayer) {
            escapePlayer.character.escapes = (escapePlayer.character.escapes || 0) + 1;
            if (socket || !socket) {
                this.server.to(room).emit('fightEnded', {
                    escapingPlayer,
                    escapeCount: escapePlayer.character.escapes,
                });
            }
        }
    }

    // combat
    @SubscribeMessage('victoryUpdate')
    handleVictoryUpdate(
        socket: Socket | null,
        payload: { room: string; winner: { username: string; isVirtual: boolean }; loser: string; isFlagHome: boolean },
    ) {
        const { room, winner, loser, isFlagHome } = payload;

        if (!this.recentFightWinners) {
            this.recentFightWinners = new Map<string, string>();
        }

        const VICTORY_TIMEOUT = 1500;

        if (this.recentFightWinners.get(room) === winner.username) {
            return;
        }

        this.recentFightWinners.set(room, winner.username);
        setTimeout(() => this.recentFightWinners.delete(room), VICTORY_TIMEOUT);

        if (!this.chatGateway.playersInRoom.get(room)) return;
        const player = this.chatGateway.playersInRoom.get(room).find((p) => p.username === winner.username);
        const losingPlayer = this.chatGateway.playersInRoom.get(room).find((p) => p.username === loser);
        const startTime = this.timersGateway.gameStartTimes.get(room);
        const duration = Date.now() - startTime;
        const durationInSeconds = Math.floor(duration / THOUSAND_MS);
        const minutes = Math.floor(durationInSeconds / SIXTY_SEC);
        const seconds = durationInSeconds % SIXTY_SEC;
        const gameDuration: { minutes: number; seconds: number } = { minutes, seconds };

        const remainingSockets = (this.chatGateway.playersInRoom.get(room) ?? []).length;
        if (player && losingPlayer && remainingSockets > 1 && (!socket || socket)) {
            player.character.victories = (player.character.victories || 0) + 1;
            losingPlayer.character.losses = (losingPlayer.character.losses || 0) + 1;
            this.timersGateway.playersInFight.set(room, []);
            this.server.to(room).emit('updateVictories', {
                winner,
                loser,
                victories: player.character.victories,
                losses: losingPlayer.character.losses,
                duration: gameDuration,
                isFlagHome,
            });
            if (player.character.victories === MAX_VICTORY_POINTS) {
                this.timersGateway.gameStartTimes.delete(room);
            }
        } else if (player && remainingSockets > 1) {
            player.character.victories = (player.character.victories || 0) + 1;
            this.timersGateway.playersInFight.set(room, []);
            this.server.to(room).emit('updateVictories', {
                winner,
                loser,
                victories: player.character.victories,
                losses: null,
                duration: gameDuration,
                isFlagHome,
            });
            if (player.character.victories === MAX_VICTORY_POINTS) {
                this.timersGateway.gameStartTimes.delete(room);
            }
        }
    }
    // combat
    @SubscribeMessage('escapeAttempt')
    handleEscape(socket: Socket, data: { room: string; escaper: Player }) {
        const { room, escaper } = data;
        this.server.to(room).emit('escapeFailed', { escaper });
    }
    @SubscribeMessage('attackerStrike')
    handleAttackerStrike(socket: Socket, payload: { room: string; attacker: Player }) {
        const { room, attacker } = payload;
        const playerThatHit = this.chatGateway.playersInRoom.get(room).find((p) => p.username === attacker.username);

        if (playerThatHit) {
            playerThatHit.character.pointsTaken = (playerThatHit.character.pointsTaken || 0) + 1;
        }
        this.server.to(room).emit('attackerPointsTaken', {
            attacker: playerThatHit,
            pointsTaken: playerThatHit.character.pointsTaken,
        });
    }
    @SubscribeMessage('defenderHit')
    handleDefenderHit(socket: Socket, payload: { room: string; defender: Player }) {
        const { room, defender } = payload;
        const playerThatGotHit = this.chatGateway.playersInRoom.get(room).find((p) => p.username === defender.username);

        if (playerThatGotHit) {
            playerThatGotHit.character.pointsLost = (playerThatGotHit.character.pointsLost || 0) + 1;
        }

        this.server.to(room).emit('defenderPointsLost', {
            defender: playerThatGotHit,
            pointsLost: playerThatGotHit.character.pointsLost,
        });
    }
    // combat
    @SubscribeMessage('quitFight')
    handlePlayerQuit(socket: Socket, data: { room: string; player: Player }) {
        const { room, player } = data;
        socket.to(room).emit('playerQuitFight', { player });
    }
    @SubscribeMessage('performAutomaticAttack')
    handlePerformAutomaticAttack(socket: Socket, data: { room: string; player: Player }): void {
        const { room, player } = data;

        const activePlayer = this.timersGateway.activePlayer.get(room);
        if (activePlayer?.username !== player.username) {
            return;
        }

        const opponent = this.timersGateway.playersInRoom.get(room)?.find((p) => p.username !== player.username);

        const attackSucceed = player.character.stats.attack - opponent.character.stats.defense > 0;
        const IMPACT = attackSucceed ? 1 : 0;

        this.server.to(room).emit('hasAttacked', {
            attackSucceed,
            attacker: player,
            impact: IMPACT,
        });
    }

    determineFirstActionPlayer(activePlayer: Player, attackedPlayer: Player): Player {
        if (activePlayer.character.stats.speed > attackedPlayer.character.stats.speed) {
            return activePlayer;
        } else if (activePlayer.character.stats.speed < attackedPlayer.character.stats.speed) {
            return attackedPlayer;
        } else {
            return activePlayer;
        }
    }
}
