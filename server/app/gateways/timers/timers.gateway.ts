import {
    DEFAULT_TIMER,
    FIVE_HUNDRED_MS,
    FIVE_THOUSAND_MS,
    NOTIFICATION_DURATION,
    ONE_HUNDRED_MS,
    ONE_THOUSAND_MS,
    REDUCED_TIMER,
    TURN_DURATION,
} from '@app/gateways/timers/timers.gateway.constants';
import { Player } from '@app/model/schema/player.schema';
import { Tiles } from '@app/model/schema/tiles.schema';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { VirtualPlayerService } from '@app/services/virtual-player/games/virtual-player.service';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class TimersGateway {
    @WebSocketServer() server: Server;
    readonly socketRooms: Map<string, string> = new Map();
    readonly socketPlayers: Map<string, Player> = new Map();
    readonly playersInRoom: Map<string, Player[]> = new Map();
    readonly playersInRoomCombat: Map<string, Player[]> = new Map();
    readonly roomAccessibility: Map<string, boolean> = new Map();
    gameStartTimes: Map<string, number> = new Map();
    roomVpActionMap = new Map<string, Map<string, boolean>>();

    turnTimesLeft: Map<string, number> = new Map();
    notificationTimesLeft: Map<string, number> = new Map();
    readonly timers: Map<string, NodeJS.Timeout> = new Map();
    readonly notificationTimers: Map<string, NodeJS.Timeout> = new Map();
    readonly activePlayers: Map<string, Player> = new Map();
    readonly pausedTimesLeft: Map<string, number | null> = new Map();
    readonly pausedNotificationTimesLeft: Map<string, number | null> = new Map();
    readonly currentTurnIndices: Map<string, number> = new Map();
    readonly turnInProgress: Map<string, boolean> = new Map();
    gameActive = new Map<string, boolean>();
    readonly playerSpeeds: Map<string, number> = new Map();

    readonly roundTimeLeft: Map<string, number> = new Map();
    readonly escapeAttempts: Map<string, number> = new Map();
    readonly activePlayer: Map<string, Player> = new Map();
    readonly activeVirtualPlayerWithNewInventory: Map<string, Player[] | null> = new Map();

    readonly orderedPlayersInRoom: Map<string, string[]> = new Map();
    readonly randomizedPlayersInRoom: Map<string, Player[]> = new Map();
    readonly playersInFight: Map<string, Player[]> = new Map();

    constructor(
        public logger: Logger,
        readonly virtualPlayerService: VirtualPlayerService,
        readonly sharedService: SharedDataService,
    ) {}

    @SubscribeMessage('startGame')
    startGame(socket: Socket, payload: { room: string; board: Tiles[][]; randomizedPlayers: Player[] }) {
        const { room, board, randomizedPlayers } = payload;
        const randomizedBoard = this.randomizeObjects(board);
        this.gameActive.set(room, true);
        this.randomizedPlayersInRoom.set(room, randomizedPlayers);
        this.activePlayers.set(room, randomizedPlayers[0]);
        this.currentTurnIndices.set(room, 0);
        randomizedPlayers.forEach((player) => {
            this.playerSpeeds.set(player.username, player.character.stats.speed);
        });
        this.sharedService.setBoard(randomizedBoard);
        this.virtualPlayerService.getCharacterInitialPosition(randomizedBoard);
        this.startNotificationTimer(room, randomizedPlayers);
        this.gameStartTimes.set(room, Date.now());
        this.server.to(room).emit('gameStarted', { board: randomizedBoard, randomizedPlayers, firstActivePlayer: this.activePlayers.get(room) });
    }

    @SubscribeMessage('resumeTurnTimer')
    handleResumeTurnTimer(socket: Socket | null, data: { room: string; players: Player[] }) {
        const { room, players } = data;
        if (!socket || socket) {
            this.resumeTimer(room, players);
        }
    }

    @SubscribeMessage('endTurn')
    handleEndTurn(socket: Socket | null, data: { room: string; randomizedPlayers: Player[] }) {
        const { room, randomizedPlayers } = data;
        this.clearTurnTimer(room);

        const currentTurnIndex = this.currentTurnIndices.get(room) ?? -1;

        const nextTurnIndex = (currentTurnIndex + 1) % randomizedPlayers.length;

        this.currentTurnIndices.set(room, nextTurnIndex);

        const activePlayer = randomizedPlayers[nextTurnIndex];

        this.activePlayers.set(room, activePlayer);
        if (socket) {
            this.server.to(room).emit('activePlayerUpdate', { activePlayer, turnIndex: nextTurnIndex });
        } else {
            this.server.to(room).emit('activePlayerUpdate', { activePlayer, turnIndex: nextTurnIndex });
        }
        this.startNotificationTimer(room, randomizedPlayers);
    }

    @SubscribeMessage('playerAction')
    handlePlayerAction(socket: Socket, data: { room: string; player: Player }): void {
        const { room, player } = data;
        this.clearTimer(room);
        this.server.to(room).emit('roundEnded', { room, player });
        this.moveToNextPlayer(room);
    }

    @SubscribeMessage('initializeRound')
    handleInitializeRound(socket: Socket, data: { room: string; players: Player[] }): void {
        const { room, players } = data;
        const array = [];
        for (const player of players) {
            array.push(player.username);
        }
        this.playersInRoomCombat.set(room, players);
        this.orderedPlayersInRoom.set(room, array);
        this.clearTimer(room);
        if (!this.escapeAttempts.has(players[0].username)) {
            players.forEach((player) => this.escapeAttempts.set(player.username, 2));
        }
        const currentActivePlayer = this.activePlayer.get(room) || players[0];
        this.activePlayer.set(room, currentActivePlayer);
        this.startRoundTimer(room);
        this.server.to(room).emit('newRoundStarted');
    }

    @SubscribeMessage('escapeAttempted')
    handleEscapeAttempt(socket: Socket, data: { room: string; escaper: Player; escapeAttempts: { [player: string]: number } }): void {
        const { room, escaper, escapeAttempts } = data;
        this.clearTimer(room);
        const remainingAttempts = escapeAttempts[escaper.username];
        this.escapeAttempts.set(escaper.username, remainingAttempts);
        this.server.to(room).emit('escapeAttemptUpdate', {
            player: escaper,
            remainingAttempts,
        });
    }

    @SubscribeMessage('stopCombatTimer')
    handleStopCombatTimer(socket: Socket, data: { room: string; players: Player[] }): void {
        const { room, players } = data;

        if (this.timers.has(room)) {
            this.clearTimer(room);
            this.logger.log(`Timer cleared for room: ${room}`);
        }

        const array = [];
        for (const player of players) {
            array.push(player.username);
        }
        players.forEach((player) => this.escapeAttempts.set(player.username, 2));

        this.activePlayer.delete(room);
        this.roundTimeLeft.delete(room);

        this.logger.log(`Escape attempts reset and state cleared for room: ${room}`);
    }

    @SubscribeMessage('stopGameTimer')
    handleStopGameTimer(socket: Socket, data: { room: string }): void {
        const { room } = data;

        if (this.timers.has(room)) {
            this.clearTimer(room);
            this.logger.log(`Timer cleared for room: ${room}`);
        }

        this.activePlayer.delete(room);

        this.turnTimesLeft.delete(room);
    }

    @SubscribeMessage('resetInventory')
    handleResetInventory(socket: Socket | null, payload: { room: string; loser: Player }) {
        const { room, loser } = payload;
        const arrayOfVirtualPlayers = this.activeVirtualPlayerWithNewInventory.get(room) || [];
        const existingIndex = arrayOfVirtualPlayers.findIndex((player) => player.username === loser.username);
        if (existingIndex !== -1) {
            arrayOfVirtualPlayers[existingIndex] = loser;
        } else {
            arrayOfVirtualPlayers.push(loser);
        }
        this.activeVirtualPlayerWithNewInventory.set(room, arrayOfVirtualPlayers);
    }

    randomizeObjects(board: Tiles[][]): Tiles[][] {
        const items = [
            'assets/object-Power-fruit-only.png',
            'assets/object-shield-only.png',
            'assets/object-master-key-only.png',
            'assets/object-space-sword-only.png',
            'assets/object-space-skates-only.png',
            'assets/object-boots-only.png',
        ];

        const usedItems = new Set<string>();

        for (const row of board) {
            for (const tile of row) {
                if (tile.object && items.includes(tile.object)) {
                    usedItems.add(tile.object);
                }
            }
        }

        for (const row of board) {
            for (const tile of row) {
                if (tile.object === 'assets/object-random-item-only.png') {
                    const availableItems = items.filter((item) => !usedItems.has(item));
                    if (availableItems.length === 0) {
                        return board;
                    }
                    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                    tile.object = randomItem;
                    usedItems.add(randomItem);
                }
            }
        }

        return board;
    }

    startNotificationTimer(room: string, randomizedPlayers: Player[]): void {
        this.clearTurnTimer(room);
        this.notificationTimesLeft.set(room, NOTIFICATION_DURATION);

        this.notificationTimers.set(
            room,
            setInterval(() => {
                const notificationTimeLeft = this.notificationTimesLeft.get(room) - 1;
                this.notificationTimesLeft.set(room, notificationTimeLeft);
                this.server.to(room).emit('notificationTimeLeftUpdate', { notificationTimer: notificationTimeLeft });

                if (notificationTimeLeft <= 0) {
                    clearInterval(this.notificationTimers.get(room));
                    this.notificationTimers.delete(room);
                    let activeVirtualPlayer = this.activePlayers.get(room);
                    const virtualPlayersInRoom = this.activeVirtualPlayerWithNewInventory.get(room);

                    const activeVirtualPlayerWithNewInventory = virtualPlayersInRoom?.find(
                        (player) => player.username === activeVirtualPlayer.username,
                    );

                    if (activeVirtualPlayer) {
                        if (activeVirtualPlayer.isVirtual) {
                            if (activeVirtualPlayerWithNewInventory) {
                                if (activeVirtualPlayer.username === activeVirtualPlayerWithNewInventory.username) {
                                    activeVirtualPlayer = activeVirtualPlayerWithNewInventory;
                                }
                            }
                            setTimeout(
                                () => {
                                    this.virtualPlayerService.activateBehaviourVP(room, activeVirtualPlayer, randomizedPlayers);
                                },
                                Math.floor(Math.random() * FIVE_THOUSAND_MS) + ONE_THOUSAND_MS,
                            );
                        }
                    }
                    this.startTurnTimer(room, randomizedPlayers);
                }
            }, ONE_THOUSAND_MS),
        );
    }

    startTurnTimer(room: string, randomizedPlayers: Player[]): number {
        this.clearTurnTimer(room);
        setTimeout(() => {
            this.server.to(room).emit('notificationEnded', { room });
        }, FIVE_HUNDRED_MS);
        this.turnTimesLeft.set(room, TURN_DURATION);

        const timer = setInterval(() => {
            const turnTimeLeft = this.turnTimesLeft.get(room) - 1;
            this.turnTimesLeft.set(room, turnTimeLeft);
            this.server.to(room).emit('turnTimeLeftUpdate', { turnTimeLeft });

            if (turnTimeLeft <= 0) {
                this.endTurn(room, randomizedPlayers, false);
            }
        }, ONE_THOUSAND_MS);

        this.timers.set(room, timer);
        return this.turnTimesLeft.get(room);
    }

    endTurn(room: string, randomizedPlayers: Player[], someoneLeft: boolean): void {
        if (this.turnInProgress.get(room)) {
            return;
        }
        this.turnInProgress.set(room, true);

        this.clearTurnTimer(room);

        const currentIndex = this.currentTurnIndices.get(room) ?? 0;

        const nextIndex = someoneLeft ? currentIndex % randomizedPlayers.length : (currentIndex + 1) % randomizedPlayers.length;

        this.currentTurnIndices.set(room, nextIndex);

        const activePlayer = randomizedPlayers[nextIndex];

        this.activePlayers.set(room, activePlayer);

        this.server.to(room).emit('activePlayerUpdate', { activePlayer, turnIndex: nextIndex });

        this.startNotificationTimer(room, randomizedPlayers);

        setTimeout(() => {
            this.turnInProgress.set(room, false);
        }, ONE_HUNDRED_MS);
    }

    clearTurnTimer(room: string): void {
        const timer = this.timers.get(room);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(room);
        }

        const notificationTimer = this.notificationTimers.get(room);
        if (notificationTimer) {
            clearInterval(notificationTimer);
            this.notificationTimers.delete(room);
        }
    }

    pauseTimer(room: string): void {
        if (this.timers.get(room)) {
            clearInterval(this.timers.get(room));
            this.pausedTimesLeft.set(room, this.turnTimesLeft.get(room));
            this.timers.delete(room);
        } else if (this.notificationTimers.get(room)) {
            clearInterval(this.notificationTimers.get(room));
            this.pausedNotificationTimesLeft.set(room, this.notificationTimesLeft.get(room));
            this.notificationTimers.delete(room);
        }
    }

    resumeTimer(room: string, randomizedPlayers: Player[]): number {
        this.clearTurnTimer(room);

        const pausedTimeLeft = this.pausedTimesLeft.get(room);
        this.turnTimesLeft.set(room, pausedTimeLeft);

        const timer = setInterval(() => {
            const turnTimeLeft = this.turnTimesLeft.get(room) - 1;
            this.turnTimesLeft.set(room, turnTimeLeft);

            this.server.to(room).emit('turnTimeLeftUpdate', { turnTimeLeft });

            if (turnTimeLeft <= 0) {
                this.endTurn(room, randomizedPlayers, false);
            }
        }, ONE_THOUSAND_MS);

        this.timers.set(room, timer);
        return this.turnTimesLeft.get(room);
    }

    startRoundTimer(room: string): void {
        const activePlayer = this.activePlayer.get(room);
        const remainingAttempts = this.escapeAttempts.get(activePlayer.username) ?? 2;
        const duration = remainingAttempts > 0 ? DEFAULT_TIMER : REDUCED_TIMER;
        this.clearTimer(room);
        this.roundTimeLeft.set(room, duration);
        this.timers.set(
            room,
            setInterval(() => {
                let timeLeft = this.roundTimeLeft.get(room) || duration;
                timeLeft = Math.max(timeLeft - 1, 0);
                this.roundTimeLeft.set(room, timeLeft);
                this.server.to(room).emit('roundTimeLeftUpdate', { room, player: activePlayer, timeLeft });
                if (timeLeft <= 0) {
                    this.clearTimer(room);
                    this.server.to(room).emit('roundEnded', { room, player: activePlayer });
                    this.server.to(room).emit('performAutomaticAttack', { room, player: activePlayer });
                    this.moveToNextPlayer(room);
                }
            }, ONE_THOUSAND_MS),
        );
    }

    moveToNextPlayer(room: string): void {
        const players = this.orderedPlayersInRoom.get(room);
        const activeIndex = players.findIndex((username) => username === this.activePlayer.get(room)?.username);
        const nextIndex = (activeIndex + 1) % players.length;

        const nextPlayerUsername = players[nextIndex];
        if (nextPlayerUsername) {
            const allPlayers = this.playersInRoomCombat.get(room);
            const nextPlayer = allPlayers?.find((player) => player.username === nextPlayerUsername);
            if (nextPlayer) {
                this.activePlayer.set(room, nextPlayer);
                this.startRoundTimer(room);
            }
        }
    }

    clearTimer(room: string): void {
        const timer = this.timers.get(room);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(room);
        }
    }
}
