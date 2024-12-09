import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { ItemsGateway } from '@app/gateways/items/items.gateway';
import { MatchBoardGateway } from '@app/gateways/match-board/match-board.gateway';
import { TimersGateway } from '@app/gateways/timers/timers.gateway';
import { Player } from '@app/model/schema/player.schema';
import { Tiles } from '@app/model/schema/tiles.schema';
import { InventoryService } from '@app/services/inventory/inventory.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { TurnSystemService } from '@app/services/turn-system/turn-system.service';
import {
    CHANCE_OF_THROWING_ITEM,
    FIVE_THOUSAND_MS,
    FOUR_HUNDRED_MS,
    NINE_HUNDRED_MS,
    ONE_THOUSAND_MS,
    THOUSAND_TWO_HUNDRED_MS,
    THREE_HUNDRED_MS,
    THREE_THOUSAND_MS,
    TWO_THOUSAND_MS,
} from '@app/services/virtual-player/games/virtual-player.service.constants';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { GAME_TILES } from '@app/shared/game-tiles';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class VirtualPlayerService {
    @Inject() readonly turnSystemService: TurnSystemService;
    @Inject() readonly movementService: MovementService;
    @Inject() readonly inventoryService: InventoryService;
    @Inject() readonly sharedDataService: SharedDataService;
    @Inject() readonly matchBoardGateway: MatchBoardGateway;

    server: Server;
    http: unknown;
    accessCode: string | null = null;
    players: Player[] | [] = [];
    characterPosition: { row: number; col: number };
    virtualPlayerPosition: { row: number; col: number };
    currentTilePositionVirtualPlayer: { row: number; col: number };
    virtualPlayer: Player | null = null;
    remainingSpeedVirtualPlayer: number | null = null;
    destinationTile: Tiles | null = null;
    boardSize: number;
    board: Tiles[][];
    actionMode: boolean = false;
    isMoving: boolean = false;
    playersVictories = new Map<string, number>();
    playersInitialPositions: Map<string | null, { row: number; col: number } | null> = new Map();
    hasPickedTheFlag: boolean = false;

    constructor(
        @Inject(forwardRef(() => CombatGateway)) readonly combatGateway: CombatGateway,
        @Inject(forwardRef(() => ItemsGateway)) readonly itemsGateway: ItemsGateway,
        @Inject(forwardRef(() => TimersGateway)) readonly timersGateway: TimersGateway,
    ) {}

    getVirtualPlayerPosition(virtualPlayer: Player): void {
        this.board = this.sharedDataService.getBoard();
        const avatar = virtualPlayer.character.body;
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                if (this.board[row][col].avatar === avatar) {
                    this.virtualPlayerPosition = { row, col };
                }
            }
        }
    }

    performActionOnTileVirtualPlayer(row: number, col: number, room: string, randomizedPlayers: Player[], virtualPlayer: Player): void {
        const tile = this.board[row][col];
        if ((tile.fieldTile === GAME_TILES.DOOR_CLOSED || tile.fieldTile === GAME_TILES.DOOR_OPEN) && !tile.avatar) {
            this.toggleDoorVirtualPlayer(tile, room, virtualPlayer);
            const INVENTORY = virtualPlayer.inventory;
            if (INVENTORY[0] === 'assets/object-master-key-only.png' || INVENTORY[1] === 'assets/object-master-key-only.png') {
                return;
            }
            this.turnSystemService.useAction();
        } else if (tile.avatar) {
            const attackedPlayer = randomizedPlayers.find((player) => player.character.body === tile.avatar);

            if (attackedPlayer) {
                let attackedPosition;
                let attackingPosition;
                for (row = 0; row < this.board.length; row++) {
                    for (col = 0; col < this.board[row].length; col++) {
                        if (this.board[row][col].avatar === attackedPlayer.character.body) {
                            attackedPosition = { row, col };
                        } else if (this.board[row][col].avatar === virtualPlayer.character.body) {
                            attackingPosition = { row, col };
                        }
                    }
                }

                if (this.board[attackedPosition.row][attackedPosition.col].fieldTile === GAME_TILES.ICE) {
                    attackedPlayer.character.stats.attack -= 2;
                    attackedPlayer.character.stats.defense -= 2;
                }
                if (attackingPosition) {
                    if (this.board[attackingPosition.row][attackingPosition.col].fieldTile === GAME_TILES.ICE) {
                        virtualPlayer.character.stats.attack -= 2;
                        virtualPlayer.character.stats.defense -= 2;
                    }
                }
                this.timersGateway.roomVpActionMap.get(room).set(virtualPlayer.username, true);
                this.combatGateway.virtualPlayersSmoke(room, attackedPlayer, virtualPlayer, this.matchBoardGateway.debugState.get(room));
                this.turnSystemService.useAction();

                if (this.board[attackedPosition.row][attackedPosition.col].fieldTile === GAME_TILES.ICE) {
                    attackedPlayer.character.stats.attack += 2;
                    attackedPlayer.character.stats.defense += 2;
                }
                if (attackingPosition) {
                    if (this.board[attackingPosition.row][attackingPosition.col].fieldTile === GAME_TILES.ICE) {
                        virtualPlayer.character.stats.attack += 2;
                        virtualPlayer.character.stats.defense += 2;
                    }
                } else {
                    return;
                }
            }
        }
        if (!this.turnSystemService.canPerformAction()) {
            this.matchBoardGateway.checkEndTurn(null, {
                room,
                player: virtualPlayer,
            });
        }
    }

    isTileAdjacentVirtualPlayer(row: number, col: number): boolean {
        const playerPosition = this.virtualPlayerPosition;
        return Math.abs(playerPosition.row - row) + Math.abs(playerPosition.col - col) === 1;
    }

    toggleDoorVirtualPlayer(tile: Tiles, room: string, virtualPlayer): void {
        if (tile.fieldTile === GAME_TILES.DOOR_CLOSED) {
            this.matchBoardGateway.handleToggleDoor(null, {
                room,
                currentTile: tile,
                player: virtualPlayer,
                wasDoorOpen: false,
            });
            tile.fieldTile = GAME_TILES.DOOR_OPEN;
        } else {
            this.matchBoardGateway.handleToggleDoor(null, {
                room,
                currentTile: tile,
                player: virtualPlayer,
                wasDoorOpen: true,
            });
            tile.fieldTile = GAME_TILES.DOOR_CLOSED;
        }
    }

    moveToDestinationVirtualPlayer(destination: Tiles, room: string, randomizedPlayers: Player[], virtualPlayer: Player): void {
        const TIME_INTERVAL = 150;
        if (virtualPlayer.remainingSpeed <= 0) return;
        this.getVirtualPlayerPosition(virtualPlayer);
        if (!destination) return;
        const start = this.virtualPlayerPosition;
        const path = this.movementService.findPath(start, destination.position);
        if (!path) return;
        this.board = this.sharedDataService.getBoard();
        const currentAvatar = this.board[start.row][start.col].avatar;
        if (!currentAvatar) return;

        let stepIndex = 0;
        this.isMoving = true;

        const moveStep = () => {
            if (stepIndex >= path.length || virtualPlayer.remainingSpeed <= 0) {
                this.isMoving = false;
                if (virtualPlayer.remainingSpeed <= 0) {
                    const isInFight = (this.timersGateway.playersInFight.get(room) ?? []).some((vp) => vp.username === virtualPlayer.username);
                    if (this.timersGateway.roomVpActionMap.get(room).get(virtualPlayer.username) && !isInFight) {
                        this.timersGateway.handleEndTurn(null, {
                            room,
                            randomizedPlayers,
                        });
                    }
                }
                return;
            }

            const { row, col } = path[stepIndex];

            if (stepIndex > 0) {
                const prevStep = path[stepIndex - 1];
                this.board[prevStep.row][prevStep.col].avatar = null;
                const nextTile = this.board[row][col];
                this.movementService.checkNextTileStepValue(nextTile);
                const movementCost = this.movementService.stepValue;
                if (virtualPlayer.remainingSpeed < movementCost) {
                    this.board[prevStep.row][prevStep.col].avatar = currentAvatar;
                    this.isMoving = false;
                    const isInFight = (this.timersGateway.playersInFight.get(room) ?? []).some((vp) => vp.username === virtualPlayer.username);
                    if (this.timersGateway.roomVpActionMap.get(room).get(virtualPlayer.username) && !isInFight) {
                        this.timersGateway.handleEndTurn(null, {
                            room,
                            randomizedPlayers,
                        });
                    }
                    return;
                }

                if (nextTile.object && virtualPlayer && nextTile.object !== GAME_OBJECTS['universalCube'].object) {
                    const item = nextTile.object;
                    const added = this.inventoryService.addItemToInventory(item, virtualPlayer);
                    if (added) {
                        nextTile.object = null;
                        this.inventoryService.applyItemEffects(item, virtualPlayer);
                        this.board[row][col].avatar = currentAvatar;
                        this.virtualPlayerPosition = { row, col };

                        const arrayOfVirtualPlayers = this.timersGateway.activeVirtualPlayerWithNewInventory.get(room) || [];
                        const existingIndex = arrayOfVirtualPlayers.findIndex((player) => player.username === virtualPlayer.username);
                        if (existingIndex !== -1) {
                            arrayOfVirtualPlayers[existingIndex] = virtualPlayer;
                        } else {
                            arrayOfVirtualPlayers.push(virtualPlayer);
                        }
                        this.timersGateway.activeVirtualPlayerWithNewInventory.set(room, arrayOfVirtualPlayers);
                        this.matchBoardGateway.handlePlayerMove(null, {
                            player: virtualPlayer,
                            position: { row, col },
                            room,
                            positionBeforeTeleportation: { row: 0, col: 0 },
                            isTeleportation: false,
                        });
                        this.itemsGateway.handleItemPickedUp(null, {
                            position: { row, col },
                            item,
                            room,
                            player: virtualPlayer,
                        });
                        virtualPlayer.remainingSpeed -= movementCost;
                        this.isMoving = false;
                        return;
                    }
                }

                if (nextTile.fieldTile === GAME_TILES.ICE && this.movementService.chanceOfStop()) {
                    virtualPlayer.remainingSpeed = 0;
                    this.board[row][col].avatar = currentAvatar;
                    this.virtualPlayerPosition = { row, col };
                    this.matchBoardGateway.handlePlayerMove(null, {
                        player: virtualPlayer,
                        position: { row, col },
                        room,
                        positionBeforeTeleportation: { row: 0, col: 0 },
                        isTeleportation: false,
                    });

                    this.timersGateway.handleEndTurn(null, {
                        room,
                        randomizedPlayers,
                    });
                    this.isMoving = false;
                    return;
                }

                virtualPlayer.remainingSpeed -= movementCost;
            }
            this.board[row][col].avatar = currentAvatar;
            this.virtualPlayerPosition = { row, col };
            this.matchBoardGateway.handlePlayerMove(null, {
                player: virtualPlayer,
                position: { row, col },
                room,
                positionBeforeTeleportation: { row: 0, col: 0 },
                isTeleportation: false,
            });

            const playersInitialPositions = this.playersInitialPositions.get(virtualPlayer.character.body);
            if (
                virtualPlayer.inventory.some((o) => o === GAME_OBJECTS['flag'].object) &&
                this.virtualPlayerPosition.row === playersInitialPositions.row &&
                this.virtualPlayerPosition.col === playersInitialPositions.col
            ) {
                this.combatGateway.handleVictoryUpdate(null, {
                    room,
                    winner: { username: virtualPlayer.username, isVirtual: true },
                    loser: '',
                    isFlagHome: true,
                });
            }

            stepIndex++;
            setTimeout(moveStep, TIME_INTERVAL);
        };

        moveStep();
    }

    activateBehaviourVP(room: string, activeVirtualPlayer: Player, randomizedPlayers: Player[]): void {
        if (!activeVirtualPlayer?.isVirtual) return;

        activeVirtualPlayer.remainingSpeed = activeVirtualPlayer.character.stats.speed;
        this.getVirtualPlayerPosition(activeVirtualPlayer);
        if (!activeVirtualPlayer) return;

        this.timersGateway.roomVpActionMap.get(room).set(activeVirtualPlayer.username, false);
        let actionUsed = false;
        let doorOpened = false;
        let itemPickedUp = false;

        const { profile } = activeVirtualPlayer;
        const nearestPlayerPosition = this.findNearestPlayer(activeVirtualPlayer, randomizedPlayers);
        const nearestPlayer = randomizedPlayers.find(
            (player) =>
                this.getPlayerPositionOnBoard(player)?.row === nearestPlayerPosition?.row &&
                this.getPlayerPositionOnBoard(player)?.col === nearestPlayerPosition?.col,
        );
        const nextNearestPlayerPosition = this.findNextNearestPlayer(activeVirtualPlayer, randomizedPlayers, nearestPlayer || null);
        const nearestItemPosition = this.findNearestItemAgressif(activeVirtualPlayer);
        const nextNearestItem = this.findNextNearestItemAgressif(activeVirtualPlayer, nearestItemPosition);
        const nearestItemPositionDefensif = this.findNearestItemDefensif(activeVirtualPlayer);
        if (!nearestPlayerPosition) return;
        const postionLandingNextPlayer = this.findShortestPathToAdjacentTile(nearestPlayerPosition, activeVirtualPlayer)?.position;
        if (profile === 'agressif') {
            const distanceToPlayer = postionLandingNextPlayer
                ? Math.abs(this.virtualPlayerPosition.row - postionLandingNextPlayer.row) +
                  Math.abs(this.virtualPlayerPosition.col - postionLandingNextPlayer.col)
                : Infinity;

            const distanceToItem = nearestItemPosition
                ? Math.abs(this.virtualPlayerPosition.row - nearestItemPosition.row) +
                  Math.abs(this.virtualPlayerPosition.col - nearestItemPosition.col)
                : Infinity;

            let targetPosition: { row: number; col: number } | null = null;

            if (nearestPlayerPosition && nearestItemPosition) {
                if (nearestPlayerPosition.row === nearestItemPosition.row && nearestPlayerPosition.col === nearestItemPosition.col) {
                    targetPosition = nearestPlayerPosition;
                } else {
                    targetPosition = distanceToPlayer <= distanceToItem ? nearestPlayerPosition : nearestItemPosition;
                }
            } else if (nearestPlayerPosition) {
                targetPosition = nearestPlayerPosition;
            } else if (nearestItemPosition) {
                targetPosition = nearestItemPosition;
            }

            const distanceToPlayerNext = nextNearestPlayerPosition
                ? Math.abs(this.virtualPlayerPosition.row - nextNearestPlayerPosition.row) +
                  Math.abs(this.virtualPlayerPosition.col - nextNearestPlayerPosition.col)
                : Infinity;

            const distanceToItemNext = nextNearestItem
                ? Math.abs(this.virtualPlayerPosition.row - nextNearestItem.row) + Math.abs(this.virtualPlayerPosition.col - nextNearestItem.col)
                : Infinity;

            const targetPositionNext =
                nextNearestPlayerPosition && distanceToPlayerNext <= distanceToItemNext ? nextNearestPlayerPosition : nextNearestItem;

            const hasFlag = activeVirtualPlayer.inventory.some((o) => o === GAME_OBJECTS['flag'].object);
            const isInventoryFull = activeVirtualPlayer.inventory.every((slot) => slot !== null);
            if (!hasFlag) {
                if (this.checkIfPlayerIsAdjacent(this.virtualPlayerPosition) && !actionUsed && !itemPickedUp) {
                    this.checkAndPerformAction(room, randomizedPlayers, activeVirtualPlayer, this.virtualPlayerPosition);
                    actionUsed = true;
                    this.timersGateway.roomVpActionMap.get(room).set(activeVirtualPlayer.username, true);
                }
                if (!itemPickedUp) {
                    if (CHANCE_OF_THROWING_ITEM) {
                        if (isInventoryFull) {
                            this.throwItem(room, activeVirtualPlayer.inventory[0], activeVirtualPlayer);
                            activeVirtualPlayer.inventory[0] = null;
                        }
                    }
                    if (targetPosition) {
                        if (this.hasAdjacentDoor(this.virtualPlayerPosition) && !doorOpened) {
                            const blockingDoor = this.getAdjacentTiles(this.virtualPlayerPosition).find(
                                (tile) => tile.fieldTile === GAME_TILES.DOOR_CLOSED,
                            );

                            if (blockingDoor) {
                                setTimeout(
                                    () => this.toggleDoorVirtualPlayer(blockingDoor, room, activeVirtualPlayer),
                                    Math.floor(Math.random() * THOUSAND_TWO_HUNDRED_MS + FOUR_HUNDRED_MS),
                                );
                                actionUsed = true;
                                this.timersGateway.roomVpActionMap.get(room).set(activeVirtualPlayer.username, true);
                                doorOpened = true;
                            }
                        }

                        if (!actionUsed && !itemPickedUp) {
                            if (targetPosition === nearestPlayerPosition) {
                                const destinationTile = this.findShortestPathToAdjacentTile(targetPosition, activeVirtualPlayer);
                                setTimeout(() => {
                                    this.moveToDestinationVirtualPlayer(destinationTile, room, randomizedPlayers, activeVirtualPlayer);
                                    setTimeout(() => {
                                        if (!actionUsed) {
                                            setTimeout(
                                                () =>
                                                    this.checkAndPerformAction(
                                                        room,
                                                        randomizedPlayers,
                                                        activeVirtualPlayer,
                                                        this.virtualPlayerPosition,
                                                    ),
                                                Math.floor(Math.random() * FOUR_HUNDRED_MS) + TWO_THOUSAND_MS,
                                            );
                                            actionUsed = true;
                                            this.timersGateway.roomVpActionMap.get(room).set(activeVirtualPlayer.username, true);
                                        }
                                    }, FIVE_THOUSAND_MS);
                                }, ONE_THOUSAND_MS);
                            } else if (targetPosition === nearestItemPosition) {
                                const nearestItemTile = this.board[nearestItemPosition.row][nearestItemPosition.col];
                                setTimeout(() => {
                                    this.moveToDestinationVirtualPlayer(nearestItemTile, room, randomizedPlayers, activeVirtualPlayer);
                                    itemPickedUp = true;
                                }, THREE_HUNDRED_MS);
                            }
                        }

                        if (actionUsed && doorOpened && !itemPickedUp) {
                            if (targetPosition === nearestPlayerPosition) {
                                const destinationTile = this.findShortestPathToAdjacentTile(targetPosition, activeVirtualPlayer);
                                setTimeout(
                                    () => this.moveToDestinationVirtualPlayer(destinationTile, room, randomizedPlayers, activeVirtualPlayer),
                                    TWO_THOUSAND_MS,
                                );
                            } else if (targetPosition === nearestItemPosition) {
                                const nearestItemTile = this.board[nearestItemPosition.row][nearestItemPosition.col];
                                setTimeout(() => {
                                    this.moveToDestinationVirtualPlayer(nearestItemTile, room, randomizedPlayers, activeVirtualPlayer);
                                    itemPickedUp = true;
                                }, NINE_HUNDRED_MS);
                            }
                        }
                    }
                    setTimeout(() => {
                        if (itemPickedUp) {
                            if (targetPositionNext === nextNearestPlayerPosition) {
                                const destinationTile = this.findShortestPathToAdjacentTile(nearestPlayerPosition, activeVirtualPlayer);
                                this.moveToDestinationVirtualPlayer(destinationTile, room, randomizedPlayers, activeVirtualPlayer);
                                setTimeout(() => {
                                    if (!actionUsed) {
                                        setTimeout(
                                            () =>
                                                this.checkAndPerformAction(room, randomizedPlayers, activeVirtualPlayer, this.virtualPlayerPosition),
                                            Math.floor(Math.random() * FOUR_HUNDRED_MS) + TWO_THOUSAND_MS,
                                        );
                                        actionUsed = true;
                                        this.timersGateway.roomVpActionMap.get(room).set(activeVirtualPlayer.username, true);
                                    }
                                }, FIVE_THOUSAND_MS);
                            } else if (targetPositionNext === nextNearestItem) {
                                const nearestItemTile = this.board[nextNearestItem.row][nextNearestItem.col];
                                setTimeout(
                                    () => this.moveToDestinationVirtualPlayer(nearestItemTile, room, randomizedPlayers, activeVirtualPlayer),
                                    FIVE_THOUSAND_MS,
                                );
                            }
                        }
                    }, FIVE_THOUSAND_MS);
                }
            } else if (hasFlag) {
                const initialPlayerPosition = this.playersInitialPositions.get(activeVirtualPlayer.character.body);
                const initialTile = this.board[initialPlayerPosition.row][initialPlayerPosition.col];
                setTimeout(() => this.moveToDestinationVirtualPlayer(initialTile, room, randomizedPlayers, activeVirtualPlayer), TWO_THOUSAND_MS);
            }
        } else if (profile === 'defensif') {
            const hasFlag = activeVirtualPlayer.inventory.some((o) => o === GAME_OBJECTS['flag'].object);
            const isInventoryFull = activeVirtualPlayer.inventory.every((slot) => slot !== null);
            if (!hasFlag) {
                if (!itemPickedUp) {
                    if (CHANCE_OF_THROWING_ITEM) {
                        if (isInventoryFull) {
                            this.throwItem(room, activeVirtualPlayer.inventory[0], activeVirtualPlayer);
                            activeVirtualPlayer.inventory[0] = null;
                        }
                    }
                    if (nearestItemPositionDefensif) {
                        if (this.hasAdjacentDoor(this.virtualPlayerPosition) && !doorOpened) {
                            const blockingDoor = this.getAdjacentTiles(this.virtualPlayerPosition).find(
                                (tile) => tile.fieldTile === GAME_TILES.DOOR_CLOSED,
                            );

                            if (blockingDoor) {
                                setTimeout(
                                    () => this.toggleDoorVirtualPlayer(blockingDoor, room, activeVirtualPlayer),
                                    Math.floor(Math.random() * NINE_HUNDRED_MS) + FOUR_HUNDRED_MS,
                                );
                                actionUsed = true;
                                this.timersGateway.roomVpActionMap.get(room).set(activeVirtualPlayer.username, true);
                                doorOpened = true;
                            }
                        }

                        if (!actionUsed && !itemPickedUp) {
                            if (nearestItemPositionDefensif) {
                                const nearestItemTile = this.board[nearestItemPositionDefensif.row][nearestItemPositionDefensif.col];
                                setTimeout(
                                    () => this.moveToDestinationVirtualPlayer(nearestItemTile, room, randomizedPlayers, activeVirtualPlayer),
                                    ONE_THOUSAND_MS,
                                );
                                itemPickedUp = true;
                            }
                        }

                        if (actionUsed && doorOpened && !itemPickedUp) {
                            if (nearestItemPositionDefensif) {
                                const nearestItemTile = this.board[nearestItemPositionDefensif.row][nearestItemPositionDefensif.col];
                                setTimeout(() => {
                                    this.moveToDestinationVirtualPlayer(nearestItemTile, room, randomizedPlayers, activeVirtualPlayer);
                                    itemPickedUp = true;
                                }, ONE_THOUSAND_MS);
                            }
                        }
                    }
                    setTimeout(() => {
                        if (itemPickedUp) {
                            const nearestItemTile = this.board[nearestItemPositionDefensif.row][nearestItemPositionDefensif.col];
                            setTimeout(
                                () => this.moveToDestinationVirtualPlayer(nearestItemTile, room, randomizedPlayers, activeVirtualPlayer),
                                ONE_THOUSAND_MS,
                            );
                            itemPickedUp = true;
                            if (activeVirtualPlayer.remainingSpeed >= 0 && itemPickedUp) {
                                const nextStep = this.movementService.findPath(nearestItemPositionDefensif, this.virtualPlayerPosition)?.[0];
                                if (nextStep) {
                                    setTimeout(
                                        () =>
                                            this.moveToDestinationVirtualPlayer(
                                                this.board[nextStep.row][nextStep.col],
                                                room,
                                                randomizedPlayers,
                                                activeVirtualPlayer,
                                            ),
                                        ONE_THOUSAND_MS,
                                    );
                                }
                            }
                        }
                    }, THREE_THOUSAND_MS);
                    setTimeout(() => {
                        if (!itemPickedUp) {
                            const targetPositionNew = this.findOppositeDirectionPosition(
                                this.virtualPlayerPosition,
                                activeVirtualPlayer.remainingSpeed,
                                nearestPlayerPosition,
                            );

                            if (targetPositionNew) {
                                const targetTile = this.board[targetPositionNew.row][targetPositionNew.col];
                                this.moveToDestinationVirtualPlayer(targetTile, room, randomizedPlayers, activeVirtualPlayer);
                            }
                        }
                    }, THREE_THOUSAND_MS);
                } 
            } else if (hasFlag) {
                const initialPlayerPosition = this.playersInitialPositions.get(activeVirtualPlayer.character.body);
                const initialTile = this.board[initialPlayerPosition.row][initialPlayerPosition.col];
                setTimeout(() => this.moveToDestinationVirtualPlayer(initialTile, room, randomizedPlayers, activeVirtualPlayer), TWO_THOUSAND_MS);
            }
        }
    }

    findNearestPlayer(activeVirtualPlayer: Player, randomizedPlayers: Player[]): { row: number; col: number } | null {
        const virtualPlayerPos = activeVirtualPlayer.character.position;
        let nearestPlayer: Player | null = null;
        let shortestDistance = Infinity;

        randomizedPlayers.forEach((player) => {
            const playerPos = this.getPlayerPositionOnBoard(player);
            if (player.username !== activeVirtualPlayer.username && playerPos) {
                const distance = Math.abs(virtualPlayerPos.row - playerPos.row) + Math.abs(virtualPlayerPos.col - playerPos.col);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestPlayer = player;
                }
            }
        });

        return nearestPlayer ? this.getPlayerPositionOnBoard(nearestPlayer) : null;
    }

    findNextNearestPlayer(
        activeVirtualPlayer: Player,
        randomizedPlayers: Player[],
        excludedPlayer: Player | null,
    ): { row: number; col: number } | null {
        const virtualPlayerPos = activeVirtualPlayer.character.position;
        let nextNearestPlayer: Player | null = null;
        let shortestDistance = Infinity;

        randomizedPlayers.forEach((player) => {
            const playerPos = this.getPlayerPositionOnBoard(player);
            if (player.username !== activeVirtualPlayer.username && player !== excludedPlayer && playerPos) {
                const distance = Math.abs(virtualPlayerPos.row - playerPos.row) + Math.abs(virtualPlayerPos.col - playerPos.col);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nextNearestPlayer = player;
                }
            }
        });

        return nextNearestPlayer ? this.getPlayerPositionOnBoard(nextNearestPlayer) : null;
    }

    getPlayerPositionOnBoard(player: Player): { row: number; col: number } | null {
        this.board = this.sharedDataService.getBoard();
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                if (this.board[row][col].avatar === player.character.body) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    findShortestPathToAdjacentTile(playerPosition: { row: number; col: number }, virtualPlayer: Player): Tiles | null {
        const adjacentTiles = this.getAdjacentTiles(playerPosition);
        if (!adjacentTiles) return;
        const validAdjacentTiles = adjacentTiles.filter((tile) => {
            return !tile.avatar && tile.fieldTile !== GAME_TILES.WALL && tile.fieldTile !== GAME_TILES.DOOR_CLOSED;
        });

        let shortestPath: { row: number; col: number }[] | null = null;
        let targetTile: Tiles | null = null;
        if (validAdjacentTiles.length === 0) {
            const alternativeTiles = this.getAllAccessibleTiles(playerPosition);

            if (alternativeTiles.length > 0) {
                alternativeTiles.forEach((tile) => {
                    if (tile) {
                        const path = this.movementService.findPath(virtualPlayer.character.position, tile.position);
                        if (path && (!shortestPath || path.length < shortestPath.length)) {
                            shortestPath = path;
                            targetTile = tile;
                        }
                    }
                });

                return targetTile;
            } else {
                return null;
            }
        }

        validAdjacentTiles.forEach((tile) => {
            if (tile) {
                const path = this.movementService.findPath(virtualPlayer.character.position, tile.position);
                if (path && (!shortestPath || path.length < shortestPath.length)) {
                    shortestPath = path;
                    targetTile = tile;
                }
            }
        });

        return targetTile;
    }

    getAllAccessibleTiles(playerPosition: { row: number; col: number }): Tiles[] {
        const allTiles = this.getAllTilesInRange(playerPosition, 2);
        return allTiles.filter((tile) => {
            return !tile.avatar && tile.fieldTile !== GAME_TILES.WALL && tile.fieldTile !== GAME_TILES.DOOR_CLOSED;
        });
    }

    getAllTilesInRange(playerPosition: { row: number; col: number }, range: number): Tiles[] {
        const tilesInRange: Tiles[] = [];
        for (let r = playerPosition.row - range; r <= playerPosition.row + range; r++) {
            for (let c = playerPosition.col - range; c <= playerPosition.col + range; c++) {
                if (this.isWithinBounds(r, c)) {
                    tilesInRange.push(this.board[r][c]);
                }
            }
        }
        return tilesInRange;
    }

    isWithinBounds(row: number, col: number): boolean {
        return row >= 0 && col >= 0 && row < this.board.length && col < this.board[0].length;
    }

    getAdjacentTiles(position: { row: number; col: number }): Tiles[] {
        if (!position) return null;
        const directions = [
            { row: -1, col: 0 }, // Up
            { row: 1, col: 0 }, // Down
            { row: 0, col: -1 }, // Left
            { row: 0, col: 1 }, // Right
        ];
        this.board = this.sharedDataService.getBoard();
        return directions
            .map((dir) => {
                const newRow = position.row + dir.row;
                const newCol = position.col + dir.col;
                if (newRow >= 0 && newRow < this.board.length && newCol >= 0 && newCol < this.board[0].length) {
                    return this.board[newRow][newCol];
                }
                return null;
            })
            .filter((tile) => tile !== null);
    }

    checkAndPerformAction(room: string, randomizedPlayers: Player[], virtualPlayer: Player, playerPosition: { row: number; col: number }): void {
        const adjacentTiles = this.getAdjacentTiles(playerPosition);
        for (const tile of adjacentTiles) {
            if (tile.fieldTile === GAME_TILES.DOOR_CLOSED || tile.fieldTile === GAME_TILES.DOOR_OPEN || tile.avatar) {
                this.performActionOnTileVirtualPlayer(tile.position.row, tile.position.col, room, randomizedPlayers, virtualPlayer);
                break;
            }
        }
    }
    checkIfPlayerIsAdjacent(playerPosition: { row: number; col: number }): boolean {
        const adjacentTiles = this.getAdjacentTiles(playerPosition);
        for (const tile of adjacentTiles) {
            if (tile.avatar) {
                return true;
            }
        }
        return false;
    }

    hasAdjacentDoor(position: { row: number; col: number }): boolean {
        const adjacentTiles = this.getAdjacentTiles(position);
        return adjacentTiles.some((tile) => tile.fieldTile === GAME_TILES.DOOR_CLOSED);
    }

    findNearestItemAgressif(virtualPlayer: Player): { row: number; col: number } | null {
        let nearestItem: { row: number; col: number } | null = null;
        let shortestDistance = Infinity;
        this.board = this.sharedDataService.getBoard();

        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                const tile = this.board[row][col];

                if (
                    tile.object &&
                    tile.object !== GAME_OBJECTS.universalCube.object &&
                    (tile.object === GAME_OBJECTS.flag.object ||
                        tile.object === GAME_OBJECTS.spaceSword.object ||
                        tile.object === GAME_OBJECTS.boots.object)
                ) {
                    const distance = Math.abs(virtualPlayer.character.position.row - row) + Math.abs(virtualPlayer.character.position.col - col);

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestItem = { row, col };
                    }
                }
            }
        }

        return nearestItem;
    }

    findNextNearestItemAgressif(virtualPlayer: Player, excludedItem: { row: number; col: number } | null): { row: number; col: number } | null {
        let nextNearestItem: { row: number; col: number } | null = null;
        let shortestDistance = Infinity;
        this.board = this.sharedDataService.getBoard();

        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                const tile = this.board[row][col];

                if (excludedItem && excludedItem.row === row && excludedItem.col === col) {
                    continue;
                }

                if (
                    tile.object &&
                    tile.object !== GAME_OBJECTS.universalCube.object &&
                    (tile.object === GAME_OBJECTS.flag.object ||
                        tile.object === GAME_OBJECTS.spaceSword.object ||
                        tile.object === GAME_OBJECTS.boots.object)
                ) {
                    const distance = Math.abs(virtualPlayer.character.position.row - row) + Math.abs(virtualPlayer.character.position.col - col);

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nextNearestItem = { row, col };
                    }
                }
            }
        }

        return nextNearestItem;
    }

    findNearestItemDefensif(virtualPlayer: Player): { row: number; col: number } | null {
        let nearestItem: { row: number; col: number } | null = null;
        let shortestDistance = Infinity;
        this.board = this.sharedDataService.getBoard();

        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[row].length; col++) {
                const tile = this.board[row][col];

                if (
                    tile.object &&
                    tile.object !== GAME_OBJECTS.universalCube.object &&
                    (tile.object === GAME_OBJECTS.flag.object ||
                        tile.object === GAME_OBJECTS.shield.object ||
                        tile.object === GAME_OBJECTS.masterKey.object)
                ) {
                    const distance = Math.abs(virtualPlayer.character.position.row - row) + Math.abs(virtualPlayer.character.position.col - col);

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestItem = { row, col };
                    }
                }
            }
        }

        return nearestItem;
    }
    getCharacterInitialPosition(board: Tiles[][]): void {
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                if (board[row][col].avatar) {
                    this.playersInitialPositions.set(board[row][col].avatar, { row, col });
                }
            }
        }
    }

    throwItem(room: string, item: string, virtualPlayer: Player): void {
        this.getVirtualPlayerPosition(virtualPlayer);
        const playerPosition = this.virtualPlayerPosition;
        this.inventoryService.removeItemFromInventory(item, virtualPlayer);
        this.inventoryService.revertItemEffects(item, virtualPlayer);
        this.itemsGateway.handleItemThrown(null, {
            player: virtualPlayer,
            position: playerPosition,
            item,
            room,
        });
        virtualPlayer.inventory[0] = null;
    }

    findOppositeDirectionPosition(
        playerPosition: { row: number; col: number },
        remainingSpeed: number,
        nearestPlayerPosition: { row: number; col: number },
    ): { row: number; col: number } | null {
        if (!nearestPlayerPosition) return null;

        const deltaRow = nearestPlayerPosition.row - playerPosition.row;
        const deltaCol = nearestPlayerPosition.col - playerPosition.col;

        const oppositeRow = playerPosition.row - deltaRow;
        const oppositeCol = playerPosition.col - deltaCol;

        let targetPosition = { row: oppositeRow, col: oppositeCol };
        let remainingSteps = remainingSpeed;
        const path: { row: number; col: number }[] = [];

        while (remainingSteps > 0) {
            targetPosition.row = Math.max(0, Math.min(this.board.length - 1, targetPosition.row));
            targetPosition.col = Math.max(0, Math.min(this.board[0].length - 1, targetPosition.col));

            const targetTile = this.board[targetPosition.row]?.[targetPosition.col];

            if (targetTile && !targetTile.avatar && targetTile.fieldTile !== GAME_TILES.WALL && targetTile.fieldTile !== GAME_TILES.DOOR_CLOSED) {
                path.push({ ...targetPosition });
                remainingSteps--;

                targetPosition = {
                    row: targetPosition.row + Math.sign(oppositeRow - targetPosition.row),
                    col: targetPosition.col + Math.sign(oppositeCol - targetPosition.col),
                };
            } else {
                if (targetPosition.row + 1 < this.board.length) {
                    targetPosition.row++;
                } else if (targetPosition.row - 1 >= 0) {
                    targetPosition.row--;
                } else {
                    break;
                }

                remainingSteps--;
            }
        }

        if (path.length > 0) {
            return path[path.length - 1];
        }

        return null;
    }
}
