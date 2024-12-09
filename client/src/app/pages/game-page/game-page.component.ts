import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { CharacterStatsComponent } from '@app/components/character-stats/character-stats.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CombatComponent } from '@app/components/combat/combat.component';
import { EndGameDialogComponent } from '@app/components/end-game-dialog/end-game-dialog.component';
import { JournalComponent } from '@app/components/journal-de-bord/journal-de-bord.component';
import { MatchBoardComponent } from '@app/components/match-board/match-board.component';
import { VictoryDialogComponent } from '@app/components/victory-dialog/victory-dialog.component';
import { Game } from '@app/interfaces/Game';
import { Match } from '@app/interfaces/Match';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { browserRefresh } from '@app/pages/app/app.component';
import { MouseEventService } from '@app/services/events/mouse-event/mouse-event.service';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { InventoryService } from '@app/services/inventory/inventory.service';
import { MovementService } from '@app/services/match/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_TILES } from '@app/shared/game-tiles';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-game-page',
    standalone: true,
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
    imports: [ChatBoxComponent, JournalComponent, CommonModule, MatchBoardComponent, CharacterStatsComponent, MatTooltipModule],
})
export class GamePageComponent implements OnInit, OnDestroy {
    public subscriptions = new Subscription();

    @ViewChild(MatchBoardComponent) matchBoardComponent: MatchBoardComponent;
    @ViewChild(CombatComponent) combatComponent: CombatComponent;
    currentPlayer: Player;
    accessCode: string = '';
    matchId: string | null = null;
    match: Match | null = null;
    roomUsers: { [room: string]: Player[] } = {};
    game: Game | null = null;
    gameBoard: Tiles[][] | null = null;
    mapSize: string;
    gameMode: string;
    players: Player[] | null = null;
    welcomeMessage: string = '';
    currentRoute: string = '';
    isMouseDownRight: boolean = false;
    isMouseDownLeft: boolean = false;
    lastToggledTile: Tiles | null = null;
    activePlayer: Player | null = null;
    turnOrder: Player[] = [];
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    turnTimeLeft: number = 30; // needs to be initialized at 30 and is accessed through other functions.
    notification: string = '';
    isRightPanelVisible: boolean = true;
    activeSection: string = 'chat';
    activeChatSection: string = 'chatBox';
    attackDie: number | null = null;
    defenseDie: number | null = null;
    chatRoomHistory: { user: string; text: string; time: Date }[] = [];
    roomJournal: { usersMentionned: Player[]; text: string }[] = [];
    playersLeft: Player[];
    isActionButtonDisabled: boolean = false;
    playersVictories = new Map<string, number>();
    playersLosses = new Map<string, number>();
    playersCombats = new Map<string, number>();
    playersEscape = new Map<string, number>();
    playersHpTaken = new Map<string, number>();
    playersHpLost = new Map<string, number>();
    playersObjectCount = new Map<string, number>();
    playersWithFlag: Set<string> = new Set();
    playersTilesVisited = new Map<string, { row: number; col: number }[]>();
    totalTilesVisited: { row: number; col: number }[];
    playersInitialPositions: Map<string | null, { row: number; col: number } | null> = new Map();

    inactivePlayers = new Set<string>();
    displayTurnOrder: Player[] = [];
    tileInfo: string;
    inventory: [string | null, string | null] = [null, null];
    combatInProgress = false;
    totalTurns: number = 1;
    doorsManipulated: { row: number; col: number }[];
    socketService = inject(SocketService);
    mouseEventService = inject(MouseEventService);
    sharedService = inject(SharedDataService);
    turnSystemService = inject(TurnSystemService);
    movementService = inject(MovementService);
    inventoryService = inject(InventoryService);

    isDebugMode: boolean = false;

    constructor(
        readonly router: Router,
        readonly snackBar: MatSnackBar,
        readonly dialog: MatDialog,
    ) {}

    get remainingSpeed(): number | null {
        if (this.activePlayer?.username === this.currentPlayer.username) {
            if (this.matchBoardComponent) {
                return this.movementService.remainingSpeed;
            } else {
                return null;
            }
        }
        return this.currentPlayer.character.stats.speed;
    }

    ngOnInit(): void {
        this.socketService.connect();
        this.turnSystemService.resetAction();
        this.accessCode = this.sharedService.getAccessCode();
        this.currentPlayer = this.sharedService.getPlayer();
        if (!this.currentPlayer) {
            this.currentPlayer = {
                username: 'ah',
                character: {
                    name: '',
                    image: '',
                    face: '',
                    body: '',
                    stats: {
                        health: 0,
                        speed: 0,
                        attack: 0,
                        defense: 0,
                    },
                    dice: '',
                    victories: 0,
                    disabled: false,
                    position: null,
                    initialPosition: null,
                },
                isAdmin: false,
                inventory: [null, null],
            };
        }
        if (browserRefresh) {
            this.subscriptions.unsubscribe();
            this.router.navigate(['/home']);
            this.sharedService.resetSharedServices();
            return;
        }

        this.game = this.sharedService.getGame();
        this.gameBoard = this.sharedService.getBoard();
        const players = this.sharedService.getPlayersInGame();

        if (players && players.length > 0) {
            this.turnSystemService.initialize(players, true);
        } else {
            this.router.navigate(['/home']);
            return;
        }
        this.players = players;
        this.gameMode = this.game.mode;
        this.mapSize = this.game.mapSize;
        this.turnOrder = [...(this.players || [])];
        this.displayTurnOrder = [...this.turnOrder];
        this.sharedService.debugModeStatus$.subscribe((status) => {
            this.isDebugMode = status; // Local variable to control UI
        });
        if (this.currentPlayer) {
            const diceSides = this.getDiceSides(this.currentPlayer);
            this.attackDie = diceSides.attackDie;
            this.defenseDie = diceSides.defenseDie;
        }

        this.subscriptions.add(
            this.turnSystemService.turnOrder$.subscribe((order) => {
                this.turnOrder = order;
            }),
        );

        this.displayTurnOrder = [...this.turnOrder];
        this.sharedService.setPlayersInGame(this.turnOrder);
        this.activePlayer = this.sharedService.getActivePlayer();
        if (this.activePlayer) {
            this.roomJournal.push({
                usersMentionned: [this.activePlayer],
                text: `C'est au tour de ${this.activePlayer.username} de jouer!`,
            });
        }

        this.subscriptions.add(
            this.inventoryService.inventory$.subscribe((inventory) => {
                this.inventory = inventory;
            }),
        );
        this.currentPlayer.character.effects = [];

        this.setupListeners();
        this.getCharacterInitialPosition();
    }

    ngOnDestroy(): void {
        this.socketService.off('kickLastPlayer');
        this.socketService.off('playerQuitGame');
        this.socketService.off('playerQuitFight');
        this.subscriptions.unsubscribe();
    }

    getCharacterInitialPosition(): void {
        for (let row = 0; row < this.gameBoard!.length; row++) {
            for (let col = 0; col < this.gameBoard![row].length; col++) {
                if (this.gameBoard![row][col].avatar) {
                    this.playersInitialPositions.set(this.gameBoard![row][col].avatar, { row, col });
                    const player = this.displayTurnOrder.find((p) => p.character.body === this.gameBoard![row][col].avatar);
                    this.socketService.emit('visitInitialPosition', { player: player, initialPosition: { row, col }, room: this.accessCode });
                }
            }
        }
    }

    displayTileInfo(info: string): void {
        this.tileInfo = info;
    }

    quitGame(): void {
        // Emit quitGame to server

        // Unsubscribe from local subscriptions
        this.subscriptions.unsubscribe();

        this.socketService.off('kickLastPlayer');
        this.socketService.off('activePlayerUpdate');
        this.socketService.off('turnTimeLeftUpdate');
        this.socketService.off('notificationTimeLeftUpdate');
        this.socketService.off('gameWon');
        this.socketService.off('victoryUpdated');
        this.socketService.off('fightStarted');
        this.socketService.off('playerQuitGame');
        this.socketService.off('playerQuitFight');
        this.socketService.off('endTurnChecking');
        this.socketService.off('doorToggled');
        this.socketService.off('roomData');

        // Disconnect socket
        this.socketService.disconnect();

        // Navigate to home
        this.router.navigate(['/home']);
        this.sharedService.resetSharedServices();
    }

    showSection(section: string): void {
        this.activeSection = section;
    }

    showChatSection(subsection: string): void {
        this.activeChatSection = subsection;
    }

    toggleRightPanel() {
        this.isRightPanelVisible = !this.isRightPanelVisible;
    }

    onActionClick(): void {
        if (this.turnSystemService.canPerformAction()) {
            this.matchBoardComponent.activateActionMode();
        }
    }

    onActionUsed(): void {
        this.turnSystemService.useAction();
        this.isActionButtonDisabled = true;
    }

    getDiceSides(player: Player): { attackDie: number; defenseDie: number } {
        return player.character.dice === 'attack' ? { attackDie: 6, defenseDie: 4 } : { attackDie: 4, defenseDie: 6 };
    }

    endTurn(): void {
        if (this.currentPlayer.username === this.activePlayer?.username) {
            this.socketService.emit('endTurn', { room: this.accessCode, randomizedPlayers: this.turnOrder });
        }
    }

    throwItem(item: string): void {
        this.matchBoardComponent.throwItem(item);
    }

    isPlayerDoorOrWall(tile: Tiles): boolean {
        if (tile.avatar || tile.fieldTile === GAME_TILES.DOOR_CLOSED || tile.wall) {
            return true;
        } else {
            return false;
        }
    }

    setupListeners(): void {
        this.socketService.off('activePlayerUpdate');
        this.socketService.off('turnTimeLeftUpdate');
        this.socketService.off('notificationTimeLeftUpdate');
        this.socketService.off('gameWon');
        this.socketService.off('victoryUpdated');
        this.socketService.off('fightStarted');
        this.socketService.off('playerQuitGame');
        this.socketService.off('playerQuitFight');
        this.socketService.off('doorToggled');
        this.socketService.off('roomData');
        this.socketService.off('victoryUpdate');

        this.socketService.on('initialPositionVisited', (res: { player: Player; position: { row: number; col: number } }) => {
            this.playersTilesVisited.set(res.player.username, [res.position]);
        });

        this.socketService.on('roomData', (res: { currentRoom: string; players: Player[] }) => {
            this.roomUsers[res.currentRoom] = res.players;
            this.players = this.roomUsers[this.accessCode];
        });

        this.socketService.on(
            'doorToggled',
            (res: { tile: Tiles; player: Player; wasDoorOpen: boolean; doorsToggled: { row: number; col: number }[] }) => {
                this.doorsManipulated = res.doorsToggled;
                const row = res.tile.position?.row;
                const col = res.tile.position?.col;
                if (res.wasDoorOpen)
                    this.roomJournal.push({
                        usersMentionned: [res.player],
                        text: `${res.player.username} a fermé la porte à la position (${row}, ${col})`,
                    });
                if (!res.wasDoorOpen)
                    this.roomJournal.push({
                        usersMentionned: [res.player],
                        text: `${res.player.username} a ouvert la porte à la position (${row}, ${col})`,
                    });
            },
        );

        this.socketService.on('endTurnChecking', () => {
            this.sharedService.combatInProgress$.pipe(take(2)).subscribe((combatInProgress) => {
                this.combatInProgress = combatInProgress;
                if (!this.combatInProgress && this.remainingSpeed === 0 && !this.turnSystemService.canPerformAction()) {
                    this.endTurn();
                }
            });
        });

        this.socketService.on('updateBoard', (data: { item: string; position: { row: number; col: number } }) => {
            const { item, position } = data;
            if (this.currentPlayer.inventory?.includes(item)) {
                const inventoryIndex = this.currentPlayer.inventory.indexOf(item);
                if (inventoryIndex !== -1) {
                    this.currentPlayer.inventory[inventoryIndex] = null;
                }
            }

            this.matchBoardComponent.board[position.row][position.col].object = item;
        });
        this.socketService.on(
            'tilesVisited',
            (data: {
                player: Player;
                position: { row: number; col: number };
                playersTileVisited: { row: number; col: number }[];
                totalTilesVisited: { row: number; col: number }[];
            }) => {
                this.playersTilesVisited.set(data.player.username, data.playersTileVisited);
                this.totalTilesVisited = data.totalTilesVisited;
            },
        );

        this.socketService.on(
            'fightStarted',
            (res: {
                attackedAfterDice: Player;
                attackedBeforeDice: Player;
                attackedCombats: number;
                attackingAfterDice: Player;
                attackingBeforeDice: Player;
                attackingCombats: number;
                playerInOrder: Player[];
            }) => {
                this.playersCombats.set(res.attackedAfterDice.username, res.attackedCombats);
                this.playersCombats.set(res.attackingAfterDice.username, res.attackingCombats);
                this.roomJournal.push({
                    usersMentionned: [res.attackedAfterDice, res.attackingAfterDice],
                    text: `Un combat vient de débuter entre ${res.attackingAfterDice.username} et ${res.attackedAfterDice.username}!`,
                });
            },
        );
        this.socketService.on('vpFight', (res: { attacker: Player; victim: Player }) => {
            this.roomJournal.push({
                usersMentionned: [res.attacker, res.victim],
                text: `Un combat vient de débuter entre ${res.attacker.username} et ${res.victim.username}!`,
            });
        });
        this.socketService.on('attackerPointsTaken', (res: { attacker: Player; pointsTaken: number }) => {
            this.playersHpTaken.set(res.attacker.username, res.pointsTaken);
        });
        this.socketService.on('defenderPointsLost', (res: { defender: Player; pointsLost: number }) => {
            this.playersHpLost.set(res.defender.username, res.pointsLost);
        });
        this.socketService.on('fightEnded', (res: { escapingPlayer: Player; escapeCount: number }) => {
            this.sharedService.setCombatInProgress(false);
            this.playersEscape.set(res.escapingPlayer.username, res.escapeCount);
            this.roomJournal.push({
                usersMentionned: [res.escapingPlayer],
                text: `${res.escapingPlayer.username} a réussi à s'enfuir !`,
            });
        });
        this.socketService.on('playerQuitGame', (data: { player: Player }) => {
            this.roomJournal.push({ usersMentionned: [data.player], text: `${data.player.username} a quitté la partie!` });
            this.inactivePlayers.add(data.player.username);
            const playerWhoLeft = this.players?.find((p) => p.username === data.player.username);
            if (this.matchBoardComponent) {
                for (let row = 0; row < this.matchBoardComponent.board.length; row++) {
                    for (let col = 0; col < this.matchBoardComponent.board[row].length; col++) {
                        if (this.matchBoardComponent.board[row][col].avatar === playerWhoLeft!.character.body) {
                            this.inventoryService.placeItemsOnNearestTiles(
                                playerWhoLeft!.inventory!,
                                this.matchBoardComponent.board[row][col].position!,
                                this.matchBoardComponent.board,
                                this.sharedService.getAccessCode(),
                            );
                        }
                    }
                }
                this.matchBoardComponent.clearAvatar(data.player.character.body);
            }

            this.turnSystemService.removePlayerFromTurnOrder(data.player.username);
            if (data.player.isAdmin) {
                this.sharedService.setDebugModeStatus(false);
                this.socketService.emit('toggleDebugMode', { room: this.accessCode, status: false });
            }

            if (this.players) {
                const activePlayersCount = this.players.filter((player) => !this.inactivePlayers.has(player.username)).length;
                if (activePlayersCount === 1) {
                    this.socketService.emit('onePlayerLeft', { room: this.accessCode });
                }
            }
        });
        this.socketService.on('kickLastPlayer', () => {
            const returnToMenuDialog = this.dialog.open(VictoryDialogComponent, {
                data: {
                    title: `Tout le monde est parti!`,
                    message: `Malheureusement tu es seul dans la partie :(\n Tu seras maintenant redirigé vers le menu principal.\n Merci d'avoir joué!`,
                },
            });
            setTimeout(() => {
                // Unsubscribe from local subscriptions
                this.subscriptions.unsubscribe();

                this.socketService.off('activePlayerUpdate');
                this.socketService.off('turnTimeLeftUpdate');
                this.socketService.off('notificationTimeLeftUpdate');
                this.socketService.off('gameWon');
                this.socketService.off('victoryUpdated');
                this.socketService.off('fightStarted');
                this.socketService.off('playerQuitGame');
                this.socketService.off('playerQuitFight');
                this.socketService.off('endTurnChecking');
                this.socketService.off('doorToggled');
                this.socketService.off('roomData');
                // this.socketService.off('joinRoom');

                // Disconnect socket
                this.socketService.disconnect();

                // Navigate to home
                this.router.navigate(['/home']);
                this.sharedService.resetSharedServices();
                returnToMenuDialog.close();
            }, 6000);
        });
        this.socketService.on('playerQuitFight', (data: { player: Player }) => {
            this.inactivePlayers.add(data.player.username);

            if (this.players) {
                const activePlayersCount = this.players.filter((player) => !this.inactivePlayers.has(player.username)).length;
                if (activePlayersCount === 1) {
                    this.socketService.emit('onePlayerLeft', { room: this.accessCode });
                }
            }
        });
        this.socketService.on(
            'updateVictories',
            (res: {
                winner: { username: string; isVirtual: boolean };
                loser: string;
                victories: number;
                losses: number | null;
                duration: { minutes: number; seconds: number };
                isFlagHome: boolean;
            }) => {
                if (!res.isFlagHome) {
                    this.playersVictories.set(res.winner.username, res.victories);
                }
                const winner = this.players?.find((p) => p.username === res.winner.username);
                const loser = this.players?.find((p) => p.username === res.loser);
                let newPosition: { row: number; col: number } | null = null;

                if (loser) {
                    if (res.losses) {
                        this.playersLosses.set(res.loser, res.losses);
                    }
                    const loserInitialPosition = this.playersInitialPositions.get(loser.character.body);

                    for (let row = 0; row < this.matchBoardComponent.board.length; row++) {
                        for (let col = 0; col < this.matchBoardComponent.board[row].length; col++) {
                            if (this.matchBoardComponent.board[row][col].avatar === loser.character.body) {
                                this.matchBoardComponent.board[row][col].avatar = null;
                                this.inventoryService.placeItemsOnNearestTiles(
                                    loser.inventory!,
                                    this.matchBoardComponent.board[row][col].position!,
                                    this.matchBoardComponent.board,
                                    this.sharedService.getAccessCode(),
                                );
                            }
                        }
                    }
                    if (loser.isVirtual) {
                        this.socketService.emit('resetInventory', { room: this.accessCode, loser: loser });
                    } else if (this.currentPlayer.username === loser.username) {
                        this.inventoryService.revertItemEffects(this.currentPlayer.inventory[0]!, this.currentPlayer);
                        this.inventoryService.revertItemEffects(this.currentPlayer.inventory[1]!, this.currentPlayer);
                        this.currentPlayer.inventory = loser.inventory;
                        this.matchBoardComponent.currentPlayer.inventory = loser.inventory;
                    }

                    if (loserInitialPosition) {
                        if (!this.isPlayerDoorOrWall(this.matchBoardComponent.board[loserInitialPosition.row][loserInitialPosition.col])) {
                            this.matchBoardComponent.board[loserInitialPosition.row][loserInitialPosition.col].avatar = loser.character.body;
                            newPosition = { row: loserInitialPosition.row, col: loserInitialPosition.col };
                        } else {
                            const tilesAvailableRangeOne: Tiles[] = this.movementService.getAllAccessibleTilesRangeOne(loserInitialPosition);
                            const tilesAvailableRangeTwo: Tiles[] = this.movementService.getAllAccessibleTilesRangeTwo(loserInitialPosition);
                            if (tilesAvailableRangeOne.length === 0 && tilesAvailableRangeTwo[0].position) {
                                this.matchBoardComponent.board[tilesAvailableRangeTwo[0].position.row][
                                    tilesAvailableRangeTwo[0].position.col
                                ].avatar = loser.character.body;
                                newPosition = tilesAvailableRangeTwo[0].position;
                            } else if (tilesAvailableRangeOne[0].position) {
                                this.matchBoardComponent.board[tilesAvailableRangeOne[0].position.row][
                                    tilesAvailableRangeOne[0].position.col
                                ].avatar = loser.character.body;
                                newPosition = tilesAvailableRangeOne[0].position;
                            }
                        }

                        this.socketService.emit('playerMove', {
                            player: loser,
                            position: newPosition,
                            room: this.accessCode,
                            positionBeforeTeleportation: null,
                            isTeleportation: false,
                        });
                    }
                }

                if (winner && loser) {
                    this.roomJournal.push({
                        usersMentionned: [winner],
                        text: `${res.winner.username} vient de battre ${res.loser}! Il a maintenant ${this.playersVictories.get(
                            res.winner.username,
                        )} victoire(s)!`,
                    });
                } else if (winner && !loser) {
                    this.roomJournal.push({
                        usersMentionned: [winner],
                        text: `${res.winner.username} vient de gagner!`,
                    });
                }

                if (this.currentPlayer.username === res.winner.username && this.playersVictories.get(res.winner.username)! >= 1) {
                    this.inventoryService.revertItemEffects('assets/object-Power-fruit-only.png', this.currentPlayer);
                    if (
                        !this.currentPlayer.character.effects?.includes('Shield') &&
                        this.currentPlayer.inventory.includes('assets/object-shield-only.png')
                    ) {
                        this.inventoryService.applyItemEffects('assets/object-shield-only.png', this.currentPlayer);
                    }
                }

                if (
                    (!this.matchBoardComponent.isCaptureFlag &&
                        this.currentPlayer.username === res.winner.username &&
                        this.playersVictories.get(res.winner.username) === 3) ||
                    (this.matchBoardComponent.isCaptureFlag && this.currentPlayer.username === res.winner.username && res.isFlagHome)
                ) {
                    this.socketService.emit('clearRoom', {
                        room: this.accessCode,
                    });
                    const endGameDialog = this.dialog.open(EndGameDialogComponent, {
                        data: {
                            title: 'TU ES LE VAINQUEUR!',
                            message: `Bravo champion, tu es le vainqueur de cette partie! Tu seras maintenant redirigé vers les statistiques de fin de partie.`,
                        },
                    });
                    this.sharedService.setPlayer(this.currentPlayer);
                    this.sharedService.setVictoryMap(this.playersVictories);
                    this.sharedService.setLossesMap(this.playersLosses);
                    this.sharedService.setAccessCode(this.accessCode);
                    this.sharedService.setPlayersInGame(this.displayTurnOrder);
                    this.sharedService.setCombatMap(this.playersCombats);
                    this.sharedService.setEscapeMap(this.playersEscape);
                    this.sharedService.setPointsLostMap(this.playersHpLost);
                    this.sharedService.setPointsTakenMap(this.playersHpTaken);
                    this.sharedService.setObjectsCountMap(this.playersObjectCount);
                    this.sharedService.setPlayersWithFlagMap(this.playersWithFlag);
                    this.sharedService.setTilesVisitedMap(this.playersTilesVisited);
                    this.sharedService.setTotalTurns(this.totalTurns);
                    this.sharedService.setGameDuration(res.duration);
                    this.sharedService.setDoorsToggled(this.doorsManipulated);
                    this.sharedService.setTotalTilesVisited(this.totalTilesVisited);
                    if (this.matchBoardComponent.isCaptureFlag) {
                        this.sharedService.setIsCTF(true);
                    }
                    setTimeout(() => {
                        endGameDialog.close();
                        this.sharedService.setCombatInProgress(false);
                        this.router.navigate(['/post-game-stats']);
                    }, 7000);
                } else if (
                    (!this.matchBoardComponent.isCaptureFlag &&
                        this.currentPlayer.username !== res.winner.username &&
                        this.playersVictories.get(res.winner.username) === 3) ||
                    (this.matchBoardComponent.isCaptureFlag && this.currentPlayer.username !== res.winner.username && res.isFlagHome) ||
                    (this.matchBoardComponent.isCaptureFlag && res.winner.isVirtual && res.isFlagHome)
                ) {
                    this.socketService.emit('clearRoom', {
                        room: this.accessCode,
                    });
                    const endGameDialog = this.dialog.open(EndGameDialogComponent, {
                        data: {
                            title: `${res.winner.username} EST LE VAINQUEUR!`,
                            message: `${res.winner.username} est le vainqueur de cette partie! Tu seras maintenant redirigé vers les statistiques de fin de partie!`,
                        },
                    });
                    this.sharedService.setPlayer(this.currentPlayer);
                    this.sharedService.setVictoryMap(this.playersVictories);
                    this.sharedService.setLossesMap(this.playersLosses);
                    this.sharedService.setAccessCode(this.accessCode);
                    this.sharedService.setPlayersInGame(this.displayTurnOrder);
                    this.sharedService.setCombatMap(this.playersCombats);
                    this.sharedService.setEscapeMap(this.playersEscape);
                    this.sharedService.setPointsLostMap(this.playersHpLost);
                    this.sharedService.setPointsTakenMap(this.playersHpTaken);
                    this.sharedService.setObjectsCountMap(this.playersObjectCount);
                    this.sharedService.setPlayersWithFlagMap(this.playersWithFlag);
                    this.sharedService.setTilesVisitedMap(this.playersTilesVisited);
                    this.sharedService.setTotalTurns(this.totalTurns);
                    this.sharedService.setGameDuration(res.duration);
                    this.sharedService.setDoorsToggled(this.doorsManipulated);
                    this.sharedService.setTotalTilesVisited(this.totalTilesVisited);
                    if (this.matchBoardComponent.isCaptureFlag) {
                        this.sharedService.setIsCTF(true);
                    }
                    setTimeout(() => {
                        endGameDialog.close();
                        this.sharedService.setCombatInProgress(false);
                        this.router.navigate(['/post-game-stats']);
                    }, 7000);
                } else if (
                    (!this.matchBoardComponent.isCaptureFlag &&
                        this.currentPlayer.username === res.winner.username &&
                        this.playersVictories.get(res.winner.username) !== 3) ||
                    (this.matchBoardComponent.isCaptureFlag && this.currentPlayer.username === res.winner.username && !res.isFlagHome)
                ) {
                    const victoryDialog = this.dialog.open(VictoryDialogComponent, {
                        data: { title: 'VICTOIRE!', message: `Tu as maintenant ${this.playersVictories.get(res.winner.username)} victoire(s)!` },
                    });
                    if (res.loser === this.activePlayer?.username && loser) {
                        setTimeout(() => {
                            victoryDialog.close();
                            this.socketService.emit('endTurn', { room: this.accessCode, randomizedPlayers: this.turnOrder });
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    } else if (res.winner.username === this.activePlayer?.username && loser) {
                        setTimeout(() => {
                            victoryDialog.close();
                            this.socketService.emit('resumeTurnTimer', {
                                room: this.sharedService.getAccessCode(),
                                players: this.turnOrder,
                            });
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    } else if (res.winner.username !== this.activePlayer?.username && !loser) {
                        setTimeout(() => {
                            victoryDialog.close();
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    } else if (res.winner.username === this.activePlayer?.username && !loser) {
                        setTimeout(() => {
                            victoryDialog.close();
                            this.socketService.emit('resumeTurnTimer', {
                                room: this.sharedService.getAccessCode(),
                                players: this.turnOrder,
                            });
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    }
                } else if (
                    (!this.matchBoardComponent.isCaptureFlag && res.winner.isVirtual && this.playersVictories.get(res.winner.username) !== 3) ||
                    (this.matchBoardComponent.isCaptureFlag && res.winner.isVirtual && !res.isFlagHome)
                ) {
                    if (res.loser === this.activePlayer?.username && loser && !loser.isVirtual) {
                        if (this.currentPlayer.username === this.activePlayer.username) {
                            setTimeout(() => {
                                this.socketService.emit('endTurn', { room: this.accessCode, randomizedPlayers: this.turnOrder });

                                this.sharedService.setCombatInProgress(false);
                            }, 3000);
                        }
                    } else if (res.loser === this.activePlayer?.username && loser && loser.isVirtual) {
                        setTimeout(() => {
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    } else if (res.winner.username === this.activePlayer?.username && loser) {
                        setTimeout(() => {
                            this.socketService.emit('resumeTurnTimer', {
                                room: this.sharedService.getAccessCode(),
                                players: this.turnOrder,
                            });
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    } else if (res.winner.username !== this.activePlayer?.username && !loser) {
                        setTimeout(() => {
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    } else if (res.winner.username === this.activePlayer?.username && !loser) {
                        setTimeout(() => {
                            this.socketService.emit('resumeTurnTimer', {
                                room: this.sharedService.getAccessCode(),
                                players: this.turnOrder,
                            });
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    }
                }
                if (
                    (!this.matchBoardComponent.isCaptureFlag &&
                        this.currentPlayer.username === res.loser &&
                        this.playersVictories.get(res.winner.username) !== 3) ||
                    (this.matchBoardComponent.isCaptureFlag && this.currentPlayer.username === res.loser && !res.isFlagHome)
                ) {
                    const victoryDialog = this.dialog.open(VictoryDialogComponent, {
                        data: {
                            title: `DÉFAITE!`,
                            message: `${res.winner.username} a maintenant ${this.playersVictories.get(res.winner.username)} victoire(s)!`,
                        },
                    });
                    setTimeout(() => {
                        victoryDialog.close();
                        this.sharedService.setCombatInProgress(false);
                    }, 3000);
                } else if (
                    (!this.matchBoardComponent.isCaptureFlag &&
                        this.currentPlayer.username !== res.winner.username &&
                        this.playersVictories.get(res.winner.username) !== 3) ||
                    (this.matchBoardComponent.isCaptureFlag && this.currentPlayer.username !== res.winner.username && !res.isFlagHome)
                ) {
                    if (res.loser) {
                        const victoryDialog = this.dialog.open(VictoryDialogComponent, {
                            data: {
                                title: `${res.winner.username} a battu ${res.loser}!`,
                                message: `${res.winner.username} a maintenant ${this.playersVictories.get(res.winner.username)} victoire(s)!`,
                            },
                        });
                        setTimeout(() => {
                            victoryDialog.close();
                            this.sharedService.setCombatInProgress(false);
                        }, 3000);
                    } else {
                        const victoryDialog = this.dialog.open(VictoryDialogComponent, {
                            data: {
                                title: `${res.winner.username} a gagné par forfait!`,
                                message: `${res.winner.username} a maintenant ${this.playersVictories.get(res.winner.username)} victoire(s)!`,
                            },
                        });
                        setTimeout(() => victoryDialog.close(), 3000);
                    }
                }
                this.displayTurnOrder.forEach((player) => {
                    if (player.username === res.loser) {
                        player.character.hasFlag = false;
                    }
                });
            },
        );
        this.socketService.on('notificationTimeLeftUpdate', (res: { notificationTimer: number }) => {
            const timeLeft = res.notificationTimer;
            this.notification = timeLeft > 0 ? `${timeLeft}` : '';
        });

        this.socketService.on('turnTimeLeftUpdate', (res: { turnTimeLeft: number }) => {
            this.turnTimeLeft = res.turnTimeLeft;
        });

        this.socketService.on('activePlayerUpdate', (res: { activePlayer: Player; turnIndex: number }) => {
            this.totalTurns++;
            const index = res.turnIndex;
            if (this.turnOrder[index]) {
                this.turnSystemService.resetAction();
                this.combatInProgress = false;
                this.activePlayer = this.turnOrder[index];
                this.activePlayer.character.stats.speed = res.activePlayer.character.stats.speed;
                this.sharedService.setActivePlayer(this.activePlayer);
                this.movementService.remainingSpeed = this.currentPlayer.character.stats.speed;

                this.roomJournal.push({
                    usersMentionned: [this.activePlayer],
                    text: `C'est au tour de ${this.activePlayer.username} de jouer!`,
                });
            }
        });

        this.socketService.on(
            'itemPickedUpBroadcast',
            (res: { position: { row: number; col: number }; item: string; player: Player; playerObjectCount: number }) => {
                this.playersObjectCount.set(res.player.username, res.playerObjectCount);
                if (!this.playersWithFlag.has(res.player.username)) {
                    this.playersWithFlag.add(res.player.username);
                }
                const { row, col } = res.position;
                if (this.gameBoard![row][col].object === res.item) {
                    this.gameBoard![row][col].object = null;
                }

                if (
                    res.item === 'assets/object-Power-fruit-only.png' &&
                    (this.playersVictories.get(res.player.username)! < 1 || this.playersVictories.get(res.player.username) === undefined)
                ) {
                    this.inventoryService.applyItemEffects('assets/object-Power-fruit-only.png', res.player);
                }
                if (res.item === 'assets/object-shield-only.png' && this.playersVictories.get(res.player.username)! >= 1) {
                    this.inventoryService.applyItemEffects('assets/object-shield-only.png', res.player);
                }
                if (this.currentPlayer.username === res.player.username) {
                    this.currentPlayer.character.stats = res.player.character.stats;
                    this.currentPlayer.character.effects = res.player.character.effects;
                }

                this.players = this.players?.filter((p) => p.username !== res.player.username) || [];
                this.players?.push(res.player);
                const playerToUpdate = this.players!.find((p) => p.username === res.player.username);
                this.matchBoardComponent.players = this.players;

                if (playerToUpdate) {
                    playerToUpdate.character.stats = res.player.character.stats;
                    playerToUpdate.character.hasFlag = res.player.character.hasFlag;
                    this.displayTurnOrder.forEach((player) => {
                        if (player.username === res.player.username) {
                            player.character.stats = res.player.character.stats;
                            player.character.hasFlag = res.player.character.hasFlag;
                        }
                    });
                    const itemName = this.inventoryService.getItemNameFromPath(res.item);
                    this.roomJournal.push({
                        usersMentionned: [playerToUpdate],
                        text: `${playerToUpdate.username} vient de prendre ${itemName}`,
                    });
                }
            },
        );

        this.socketService.on('itemThrownBroadcast', (data: { position: { row: number; col: number }; item: string; player: Player }) => {
            const { row, col } = data.position;
            const inventory = data.player.inventory!;
            const isInventoryFull = inventory.every((slot) => slot !== null && slot !== '');

            if (!this.gameBoard || !this.gameBoard[row] || !this.gameBoard[row][col]) {
                return;
            }

            const boardObject = this.gameBoard[row][col].object;

            if (!boardObject) {
                const itemIndex = inventory.indexOf(data.item);
                if (itemIndex === -1) {
                    return;
                }
                this.gameBoard[row][col].object = data.item;
                inventory[itemIndex] = null;
                this.inventoryService.revertItemEffects(data.item, data.player);

                if (this.currentPlayer.username === data.player.username) {
                    this.currentPlayer.character.stats = data.player.character.stats;
                    this.currentPlayer.character.effects = data.player.character.effects;
                    this.currentPlayer.inventory = inventory;
                }
            } else if (isInventoryFull) {
                const swappedItemIndex = inventory.indexOf(data.item);
                if (swappedItemIndex === -1) {
                    return;
                }

                const temp = boardObject;
                this.gameBoard[row][col].object = data.item;
                inventory[swappedItemIndex] = temp;
                this.inventoryService.revertItemEffects(data.item, data.player);
                if (
                    temp === 'assets/object-Power-fruit-only.png' &&
                    (this.playersVictories.get(data.player.username)! < 1 || this.playersVictories.get(data.player.username) === undefined)
                ) {
                    this.inventoryService.applyItemEffects(temp!, data.player);
                } else if (temp === 'assets/object-shield-only.png' && this.playersVictories.get(data.player.username)! > 1) {
                    this.inventoryService.applyItemEffects(temp!, data.player);
                } else if (temp !== 'assets/object-shield-only.png' && temp !== 'assets/object-Power-fruit-only.png') {
                    this.inventoryService.applyItemEffects(temp!, data.player);
                }

                if (this.currentPlayer.username === data.player.username) {
                    this.currentPlayer.character.stats = data.player.character.stats;
                    this.currentPlayer.character.effects = data.player.character.effects;
                    this.currentPlayer.inventory = inventory;
                }

                this.roomJournal.push({
                    usersMentionned: [data.player],
                    text: `${data.player.username} a échangé ${temp}`,
                });
            }
            this.players = this.players?.filter((p) => p.username !== data.player.username) || [];
            this.players?.push(data.player);
            const playerToUpdate = this.players!.find((p) => p.username === data.player.username);
            if (playerToUpdate) {
                playerToUpdate.character.stats = data.player.character.stats;
                playerToUpdate.character.hasFlag = data.player.character.hasFlag;
                const itemName = this.inventoryService.getItemNameFromPath(data.item);
                this.roomJournal.push({
                    usersMentionned: [playerToUpdate],
                    text: `${playerToUpdate.username} vient de jeté ${itemName}`,
                });
                playerToUpdate.inventory = [...data.player.inventory!];
                playerToUpdate.character.stats = { ...data.player.character.stats };
                if (!playerToUpdate.inventory.includes('assets/object-flag-only.png')) {
                    playerToUpdate.character.hasFlag = false;
                } else {
                    playerToUpdate.character.hasFlag = true;
                }
            } else {
                this.players!.push(data.player);
            }

            this.matchBoardComponent.players = [...this.players!];
            this.displayTurnOrder.forEach((player) => {
                if (player.username === data.player.username) {
                    player.character.stats = data.player.character.stats;
                    player.character.hasFlag = playerToUpdate!.character.hasFlag;
                }
            });
        });

        this.socketService.on('debugModeToggled', (data: { status: boolean }) => {
            this.sharedService.setDebugModeStatus(data.status);

            this.roomJournal.push({
                usersMentionned: [],
                text: `Mode debug ${data.status ? 'activé' : 'désactivé'} pour tous les joueurs.`,
            });
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        if (event.key === 'd') {
            this.toggleDebugMode();
        }
    }

    toggleDebugMode(): void {
        if (this.currentPlayer?.isAdmin) {
            const currentStatus = this.sharedService.getDebugModeStatus();
            const newStatus = !currentStatus;
            this.sharedService.setDebugModeStatus(newStatus);
            this.socketService.emit('toggleDebugMode', { room: this.accessCode, status: newStatus });
        }
    }
}
