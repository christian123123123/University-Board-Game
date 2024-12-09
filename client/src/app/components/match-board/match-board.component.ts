import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { TilesComponent } from '@app/components/tiles/tiles.component';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { BoardService } from '@app/services/edit/board/board.service';
import { ObjectsService } from '@app/services/edit/objects/objects.service';
import { TilesService } from '@app/services/edit/tiles/tiles.service';
import { DragEventService } from '@app/services/events/drag-event/drag-event.service';
import { MouseEventService } from '@app/services/events/mouse-event/mouse-event.service';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { GamesService } from '@app/services/games/games.service';
import { InventoryService } from '@app/services/inventory/inventory.service';
import { ActionService } from '@app/services/match/action/action.service';
import { MovementService } from '@app/services/match/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { GAME_TILES } from '@app/shared/game-tiles';
@Component({
    selector: 'app-match-board',
    standalone: true,
    imports: [CommonModule, TilesComponent],
    templateUrl: './match-board.component.html',
    styleUrl: './match-board.component.scss',
})
export class MatchBoardComponent implements OnInit {
    @Input() selectedTile: Tiles | null = null;
    @Input() gameMode: string;
    @Input() mapSize: string;
    @Input() activePlayer: Player | null = null;
    @Output() tileInfo = new EventEmitter<string>();
    accessCode: string | null = null;
    players: Player[] | [] = [];
    characterPosition: { row: number; col: number };
    currentPlayer: Player;
    destinationTile: Tiles | null = null;
    boardSize: number;
    board: Tiles[][];
    actionMode: boolean = false;
    isMoving: boolean = false;
    playersVictories = new Map<string, number>();
    isCaptureFlag: boolean = false;
    position: { row: number; col: number };
    playersInitialPositions: Map<string | null, { row: number; col: number } | null> = new Map();
    hasWon: boolean = false;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */ // we need to use it here because it help us deal with certain case.

    constructor(
        readonly boardService: BoardService,
        readonly tilesService: TilesService,
        readonly dragEventService: DragEventService,
        readonly mouseEventService: MouseEventService,
        readonly objectsService: ObjectsService,
        readonly route: ActivatedRoute,
        readonly gameService: GamesService,
        readonly socketService: SocketService,
        readonly sharedService: SharedDataService,
        readonly dialog: MatDialog,
        readonly turnSystemService: TurnSystemService,
        readonly movementService: MovementService,
        readonly actionService: ActionService,
        readonly inventoryService: InventoryService,
    ) {}

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent): void {
        event.preventDefault();
    }

    ngOnInit(): void {
        this.socketService.connect();
        this.accessCode = this.sharedService.getAccessCode();
        this.currentPlayer = this.sharedService.getPlayer();
        this.setupListeners();
        this.board = this.sharedService.getBoard();
        this.movementService.board = this.sharedService.getBoard();
        this.gameMode = this.sharedService.getGame().mode;
        this.mapSize = this.sharedService.getGame().mapSize;
        this.boardSize = this.boardService.getBoardSize(this.mapSize);
        this.players = this.sharedService.getPlayersInGame();
        this.movementService.remainingSpeed = this.currentPlayer.character.stats.speed;
        this.getCharacterPosition();
        this.actionService.setPlayers(this.players);

        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                if (this.board[row][col].object === 'assets/object-flag-only.png') {
                    this.isCaptureFlag = true;
                }
            }
        }
        this.getCharacterInitialPosition();
    }

    //#region Listeners
    setupListeners(): void {
        this.socketService.on(
            'playerMoved',
            (data: {
                player: Player;
                position: { row: number; col: number };
                playersTileVisited: { row: number; col: number }[];
                positionBeforeTeleportation: { r: number; c: number };
                isTeleportation: boolean;
            }) => {
                const { player, position, positionBeforeTeleportation, isTeleportation } = data;

                if (player.username === this.currentPlayer.username) {
                    return;
                }

                if (player.username !== this.currentPlayer.username) {
                    const otherPlayer = this.players.find((p) => p.username === player?.username);
                    if (otherPlayer) {
                        if (isTeleportation) {
                            const { r, c } = positionBeforeTeleportation;
                            this.board[r][c].avatar = null;
                        } else if (otherPlayer.character.position) {
                            const { row, col } = otherPlayer.character.position;
                            this.board[row][col].avatar = null;
                        }

                        otherPlayer.character.position = position;
                        this.board[position.row][position.col].avatar = otherPlayer.character.body;
                    }
                }
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
                if (this.currentPlayer?.username === res.attackedAfterDice.username) {
                    this.sharedService.setPlayer(res.attackedAfterDice);
                    this.actionService.openAttackDialog(
                        this,
                        res.attackedAfterDice,
                        res.attackedBeforeDice,
                        res.attackingAfterDice,
                        res.attackingBeforeDice,
                        res.playerInOrder,
                    );
                }
                if (this.currentPlayer?.username === res.attackingAfterDice.username) {
                    this.sharedService.setPlayer(res.attackingAfterDice);
                    this.actionService.openAttackDialog(
                        this,
                        res.attackedAfterDice,
                        res.attackedBeforeDice,
                        res.attackingAfterDice,
                        res.attackingBeforeDice,
                        res.playerInOrder,
                    );
                }
            },
        );
        this.socketService.on('doorToggled', (res: { tile: Tiles }) => {
            const rowToggle = res.tile.position?.row;
            const colToggle = res.tile.position?.col;
            this.board[rowToggle!][colToggle!].fieldTile =
                this.board[rowToggle!][colToggle!].fieldTile === GAME_TILES.DOOR_CLOSED ? GAME_TILES.DOOR_OPEN : GAME_TILES.DOOR_CLOSED;
        });
        this.socketService.on('notificationEnded', (res: { activePlayer: Player }) => {
            setTimeout(() => {
                this.socketService.emit('updatedBoard', { room: this.accessCode, board: this.board });
            }, 300);
        });
    }
    //#endregion
    getRandomWinner(attacking: Player, attacked: Player): void {
        const ENDFIGHT = Math.random() < 0.5;
        let randomTime = Math.floor(Math.random() * 5000) + 5000;
        const loser = Math.random() < 0.5 ? attacked : attacking;
        if (ENDFIGHT) {
            setTimeout(() => {
                this.socketService.emit('endFight', {
                    room: this.sharedService.getAccessCode(),
                    escapingPlayer: loser,
                });
            }, randomTime);
            setTimeout(() => {
                this.socketService.emit('resumeTurnTimer', {
                    room: this.sharedService.getAccessCode(),
                    players: this.sharedService.getPlayersInGame(),
                });
            }, randomTime + 300);
        } else {
            const winner = Math.random() < 0.5 ? attacked : attacking;
            const loser = winner === attacked ? attacking : attacked;
            let winnerData = { username: winner.username, isVirtual: winner.isVirtual };
            setTimeout(
                () => {
                    this.socketService.emit('victoryUpdate', {
                        room: this.sharedService.getAccessCode(),
                        winner: winnerData,
                        loser: loser.username,
                    });
                },
                Math.floor(Math.random() * 20000) + 10000,
            );
        }
    }
    //#region Getters
    getBoardState(): Tiles[][] {
        return this.board;
    }

    getCharacterInitialPosition(): void {
        for (let row = 0; row < this.board!.length; row++) {
            for (let col = 0; col < this.board![row].length; col++) {
                if (this.board![row][col].avatar) {
                    this.playersInitialPositions.set(this.board![row][col].avatar, { row, col });
                }
            }
        }
    }

    getCharacterPosition(): void {
        const avatar = this.currentPlayer?.character.body;
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                if (this.board[row][col].avatar === avatar) {
                    this.characterPosition = { row, col };
                }
            }
        }
    }

    clearAvatar(username: string): void {
        for (const row of this.board) {
            for (const tile of row) {
                if (tile.avatar && tile.avatar === username) {
                    tile.avatar = null;
                }
            }
        }
    }

    getTileInfo(row: number, col: number): void {
        const currentTile = this.board[row][col];
        let tileName = '';
        let tileDescription = '';
        let player: Player | undefined;
        if (currentTile.fieldTile === GAME_TILES.BASE) {
            tileName = 'Tuile basique de terre lunaire';
            tileDescription = "Elle n'a pas de caractéristique particulière, coût de 1.";
        }
        if (currentTile.fieldTile === GAME_TILES.ICE) {
            tileName = 'Tuile de glace';
            tileDescription = 'Glissante, parfaite pour les zones froides, coût de 0.';
        }
        if (currentTile.fieldTile === GAME_TILES.WATER) {
            tileName = "Tuile d'eau";
            tileDescription = 'Utilisée pour les rivières et lacs, coût de 2.';
        }
        if (currentTile.fieldTile === GAME_TILES.WALL) {
            tileName = 'Mur';
            tileDescription = 'Parfait pour les fortifications.';
        }
        if (currentTile.fieldTile === GAME_TILES.DOOR_OPEN) {
            tileName = 'Porte ouverte';
            tileDescription = "Un point d'entrée ou de sortie, coût de 1.";
        }
        if (currentTile.fieldTile === GAME_TILES.DOOR_CLOSED) {
            tileName = 'Porte fermée';
            tileDescription = 'Cette porte agit comme un mur.';
        }
        if (currentTile.avatar) {
            player = this.players.find((c) => c.character.body === currentTile.avatar);
        }
        if (player) {
            this.tileInfo.emit(
                `Tuile: ${tileName}\nDescription de la tuile: ${tileDescription}\nJoueur: ${player.username}\nAvatar: ${player.character.name}`,
            );
        } else {
            this.tileInfo.emit(`Tuile: ${tileName}\nDescription de la tuile: ${tileDescription}\n`);
        }
    }
    //#endregion

    //#region Action
    activateActionMode(): void {
        if (this.turnSystemService.canPerformAction()) {
            this.actionMode = true;
        }
    }

    performActionOnTile(row: number, col: number): void {
        if (!this.actionMode) return;

        const isAdjacent = this.isTileAdjacent(row, col);

        if (isAdjacent && this.turnSystemService.canPerformAction()) {
            const tile = this.board[row][col];
            if ((tile.fieldTile === GAME_TILES.DOOR_CLOSED || tile.fieldTile === GAME_TILES.DOOR_OPEN) && !tile.avatar) {
                this.toggleDoor(tile);
                const INVENTORY = this.currentPlayer.inventory!;
                if (INVENTORY[0] === 'assets/object-master-key-only.png' || INVENTORY[1] === 'assets/object-master-key-only.png') {
                    return;
                }
                this.turnSystemService.useAction();
            } else if (tile.avatar) {
                const attackedPlayer = this.players.find((p) => p.character.body === tile.avatar);

                if (attackedPlayer) {
                    let attackedPosition;
                    let attackingPosition;
                    for (let row = 0; row < this.board.length; row++) {
                        for (let col = 0; col < this.board[row].length; col++) {
                            if (this.board[row][col].avatar === attackedPlayer.character.body) {
                                attackedPosition = { row, col };
                            } else if (this.board[row][col].avatar === this.currentPlayer.character.body) {
                                attackingPosition = { row, col };
                            }
                        }
                    }

                    if (this.board[attackedPosition!.row][attackedPosition!.col].fieldTile === GAME_TILES.ICE) {
                        attackedPlayer.character.stats.attack -= 2;
                        attackedPlayer.character.stats.defense -= 2;
                    }
                    if (this.board[attackingPosition!.row][attackingPosition!.col].fieldTile === GAME_TILES.ICE) {
                        this.currentPlayer.character.stats.attack -= 2;
                        this.currentPlayer.character.stats.defense -= 2;
                    }

                    this.sharedService.setRemainingSpeed(this.movementService.remainingSpeed!);
                    this.socketService.emit('startFight', {
                        room: this.accessCode,
                        attacked: attackedPlayer,
                        attacking: this.currentPlayer,
                        debugMode: this.sharedService.getDebugModeStatus(),
                    });
                    this.turnSystemService.useAction();
                    if (this.board[attackedPosition!.row][attackedPosition!.col].fieldTile === GAME_TILES.ICE) {
                        attackedPlayer.character.stats.attack += 2;
                        attackedPlayer.character.stats.defense += 2;
                    }
                    if (this.board[attackingPosition!.row][attackingPosition!.col].fieldTile === GAME_TILES.ICE) {
                        this.currentPlayer.character.stats.attack += 2;
                        this.currentPlayer.character.stats.defense += 2;
                    }
                }
            }
            this.actionMode = false;
        }
        if (!this.turnSystemService.canPerformAction()) {
            this.socketService.emit('checkEndTurn', {
                room: this.accessCode,
                player: this.activePlayer,
            });
        }
    }

    isTileAdjacent(row: number, col: number): boolean {
        const playerPosition = this.characterPosition;
        return Math.abs(playerPosition.row - row) + Math.abs(playerPosition.col - col) === 1;
    }

    toggleDoor(tile: Tiles): void {
        if (tile.fieldTile === GAME_TILES.DOOR_CLOSED) {
            this.socketService.emit('toggleDoor', { room: this.accessCode, currentTile: tile, player: this.currentPlayer, wasDoorOpen: false });
            tile.fieldTile = GAME_TILES.DOOR_OPEN;
        } else {
            this.socketService.emit('toggleDoor', { room: this.accessCode, currentTile: tile, player: this.currentPlayer, wasDoorOpen: true });
            tile.fieldTile = GAME_TILES.DOOR_CLOSED;
        }
    }
    //#endregion

    //#region Movement
    moveToDestination(destination: Tiles): void {
        const TIME_INTERVAL = 150;
        if (this.isMoving) return;
        this.getCharacterPosition();
        this.movementService.clearPathHighlights();

        const start = this.characterPosition;
        const path = this.movementService.findPath(start, destination.position!);

        if (!path) {
            return;
        }

        const currentAvatar = this.board[start.row][start.col].avatar;
        if (!currentAvatar) return;

        let stepIndex = 0;
        this.isMoving = true;

        const moveStep = () => {
            if (stepIndex >= path.length) {
                this.isMoving = false;
                return;
            }

            const { row, col } = path[stepIndex];

            if (stepIndex > 0) {
                const prevStep = path[stepIndex - 1];
                this.board[prevStep.row][prevStep.col].avatar = null;

                const nextTile = this.board[row][col];
                this.movementService.checkNextTileStepValue(nextTile);

                if (nextTile.object && this.currentPlayer && nextTile.object !== GAME_OBJECTS['universalCube'].object) {
                    const item = nextTile.object;
                    const added = this.inventoryService.addItemToInventory(item, this.currentPlayer);

                    if (added) {
                        nextTile.object = null;
                        if (item !== 'assets/object-shield-only.png' && item !== 'assets/object-Power-fruit-only.png') {
                            this.inventoryService.applyItemEffects(item, this.currentPlayer);
                        }
                        this.board[row][col].avatar = currentAvatar;
                        this.characterPosition = { row, col };

                        this.socketService.emit('playerMove', {
                            player: this.currentPlayer,
                            position: { row, col },
                            room: this.accessCode,
                            positionBeforeTeleportation: null,
                            isTeleportation: false,
                        });
                        this.socketService.emit('itemPickedUp', {
                            position: { row, col },
                            item,
                            room: this.accessCode,
                            player: this.currentPlayer,
                        });
                        this.movementService.remainingSpeed! -= this.movementService.stepValue;

                        this.isMoving = false;
                        return;
                    }
                }

                if (nextTile.fieldTile === GAME_TILES.ICE && this.movementService.chanceOfStop(this.currentPlayer)) {
                    this.movementService.remainingSpeed = 0;
                    this.board[row][col].avatar = currentAvatar;
                    this.characterPosition = { row, col };
                    this.socketService.emit('playerMove', {
                        player: this.currentPlayer,
                        position: { row, col },
                        room: this.accessCode,
                        positionBeforeTeleportation: null,
                        isTeleportation: false,
                    });
                    this.socketService.emit('endTurn', {
                        room: this.accessCode,
                        randomizedPlayers: this.sharedService.getPlayersInGame(),
                    });
                    this.isMoving = false;

                    return;
                }
                this.movementService.remainingSpeed! -= this.movementService.stepValue;
                if (this.movementService.remainingSpeed === 0) {
                    this.socketService.emit('checkEndTurn', {
                        room: this.accessCode,
                        player: this.activePlayer,
                    });
                }
            }

            this.board[row][col].avatar = currentAvatar;
            this.characterPosition = { row, col };

            this.socketService.emit('playerMove', {
                player: this.currentPlayer,
                position: { row, col },
                room: this.accessCode,
                positionBeforeTeleportation: null,
                isTeleportation: false,
            });
            const playersInitialPositions = this.playersInitialPositions.get(this.currentPlayer.character.body);
            if (
                this.currentPlayer.inventory?.includes('assets/object-flag-only.png') &&
                this.characterPosition.row === playersInitialPositions!.row &&
                this.characterPosition.col === playersInitialPositions!.col
            ) {
                this.socketService.emit('victoryUpdate', {
                    room: this.sharedService.getAccessCode(),
                    winner: { username: this.currentPlayer.username, isVirtual: false },
                    loser: '',
                    isFlagHome: true,
                });
            }

            stepIndex++;
            setTimeout(moveStep, TIME_INTERVAL);
        };

        moveStep();
    }

    previewPath(row: number, col: number): void {
        if (!this.currentPlayer) return;
        this.getCharacterPosition();
        const start = this.characterPosition;
        const path = this.movementService.findPath(start, { row, col });
        if (!path || path.length === 0) {
            this.movementService.previewPathTiles = [];
            return;
        }
        this.movementService.previewPathTiles = [];
        for (let i = 1; i < path.length - 1; i++) {
            const step = path[i];
            const nextStep = path[i + 1];
            const direction = nextStep && nextStep.row === step.row ? 'horizontal' : 'vertical';
            if (this.movementService.attainableTiles.has(`${step.row}-${step.col}`)) {
                this.movementService.previewPathTiles.push({ row: step.row, col: step.col, direction });
            }
        }
        if (this.movementService.attainableTiles.has(`${row}-${col}`)) {
            this.movementService.previewPathTiles.push({ row, col, direction: 'horizontal' });
        }
    }

    selectDestination(event: MouseEvent, row: number, col: number): void {
        this.getCharacterPosition();
        const currentTile = this.board[row][col];

        if (event.button === 0 && currentTile) {
            if (currentTile.isTileSelected && this.characterPosition !== currentTile.position) {
                this.moveToDestination(currentTile);
            } else {
                this.destinationTile = currentTile;
                this.movementService.highlightPossiblePaths(this.characterPosition, this.movementService.remainingSpeed!);
            }
        } else if (event.button === 2) {
            if (this.sharedService.getDebugModeStatus()) {
                if (currentTile.object || currentTile.fieldTile === GAME_TILES.DOOR_CLOSED) {
                    return;
                }

                this.movementService.teleportToTile(row, col);
            } else {
                this.getTileInfo(row, col);
            }
        }
    }

    //#endregion

    //#region Item
    throwItem(item: string): void {
        this.getCharacterPosition();
        const playerPosition = this.characterPosition;

        if (this.inventoryService.removeItemFromInventory(item, this.currentPlayer) && this.currentPlayer) {
            this.socketService.emit('itemThrown', {
                position: playerPosition,
                item,
                room: this.accessCode,
                player: this.currentPlayer,
                stats: this.currentPlayer.character.stats,
            });
        }
    }

    //#endregion

    /* eslint-enable @typescript-eslint/no-non-null-assertion */ // we need to use it here because
}
