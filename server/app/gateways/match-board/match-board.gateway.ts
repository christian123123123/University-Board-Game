import { Player } from '@app/model/schema/player.schema';
import { Tiles } from '@app/model/schema/tiles.schema';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';

@WebSocketGateway({ cors: true })
@Injectable()
export class MatchBoardGateway {
    @WebSocketServer() server: Server;
    doorsManipulated: Map<string, { row: number; col: number }[]> = new Map();
    totalTilesVisited: Map<string, { row: number; col: number }[]> = new Map();
    debugState: Map<string, boolean> = new Map();

    constructor(
        public logger: Logger,
        @Inject(forwardRef(() => ChatGateway)) readonly chatGateway: ChatGateway,
        public sharedDataService: SharedDataService,
    ) {}

    // get initial position
    @SubscribeMessage('visitInitialPosition')
    handleInitialPosition(socket: Socket, data: { player: Player; initialPosition: { row: number; col: number }; room: string }) {
        const { player, initialPosition, room } = data;
        if (!this.totalTilesVisited.get(room)) {
            this.totalTilesVisited.set(room, []);
        }
        const tileAlreadyVisited = this.totalTilesVisited
            .get(room)
            .some((tile) => tile.row === initialPosition.row && tile.col === initialPosition.col);
        if (!tileAlreadyVisited) {
            this.totalTilesVisited.get(room).push(initialPosition);
        }
        const playerThatSpawn = this.chatGateway.playersInRoom.get(room).find((p) => p.username === player.username);

        playerThatSpawn.character.tilesVisited = playerThatSpawn.character.tilesVisited ?? [];
        const tileAlreadyVisitedByPlayer = playerThatSpawn.character.tilesVisited.some(
            (tile) => tile.row === initialPosition.row && tile.col === initialPosition.col,
        );

        if (playerThatSpawn && !tileAlreadyVisitedByPlayer) {
            playerThatSpawn.character.tilesVisited.push(initialPosition);
        }
        this.server.to(room).emit('initialPositionVisited', { player, initialPosition });
    }
    // player movement (match board)
    @SubscribeMessage('playerMove')
    handlePlayerMove(
        socket: Socket | null,
        data: {
            player: Player;
            position: { row: number; col: number };
            room: string;
            positionBeforeTeleportation: { row: number; col: number };
            isTeleportation: boolean;
        },
    ) {
        const { player, position, room, positionBeforeTeleportation, isTeleportation } = data;
        const tileAlreadyVisited = this.totalTilesVisited.get(room).some((tile) => tile.row === position.row && tile.col === position.col);
        if (!tileAlreadyVisited) {
            this.totalTilesVisited.get(room).push(position);
        }
        const playerWhoMoved = (this.chatGateway.playersInRoom.get(room) ?? []).find((p) => p.username === player.username);
        if (playerWhoMoved) {
            playerWhoMoved.character.tilesVisited = playerWhoMoved.character.tilesVisited ?? [];
            const tileAlreadyVisitedByPlayer = playerWhoMoved.character.tilesVisited.some(
                (tile) => tile.row === position.row && tile.col === position.col,
            );
            if (playerWhoMoved && !tileAlreadyVisitedByPlayer) {
                playerWhoMoved.character.tilesVisited.push(position);
            }
        } else return;
        const playersTileVisited: { row: number; col: number }[] = playerWhoMoved.character.tilesVisited;
        const totalTilesVisited: { row: number; col: number }[] = this.totalTilesVisited.get(room);
        if (socket) {
            socket.broadcast
                .to(room)
                .emit('playerMoved', { player, position, playersTileVisited, totalTilesVisited, positionBeforeTeleportation, isTeleportation });
            this.server.to(room).emit('tilesVisited', { player, position, playersTileVisited, totalTilesVisited });
        } else {
            this.server
                .to(room)
                .emit('playerMoved', { player, position, playersTileVisited, totalTilesVisited, positionBeforeTeleportation, isTeleportation });
            this.server.to(room).emit('tilesVisited', { player, position, playersTileVisited, totalTilesVisited });
        }
    }
    // door toggle (match board)
    @SubscribeMessage('toggleDoor')
    handleToggleDoor(socket: Socket | null, data: { room: string; currentTile: Tiles; player: Player; wasDoorOpen: boolean }) {
        const { room, currentTile, player, wasDoorOpen } = data;
        if (!this.doorsManipulated.get(room)) {
            this.doorsManipulated.set(room, []);
        }
        const boolean = this.doorsManipulated
            .get(room)
            .some((tile) => tile.row === currentTile.position.row && tile.col === currentTile.position.col);
        if (!boolean) {
            this.doorsManipulated.get(room).push(currentTile.position);
        }
        if (socket) {
            socket.to(room).emit('doorToggled', { tile: currentTile, player, wasDoorOpen, doorsToggled: this.doorsManipulated.get(room) });
        } else {
            this.server.to(room).emit('doorToggled', { tile: currentTile, player, wasDoorOpen, doorsToggled: this.doorsManipulated.get(room) });
        }
    }
    @SubscribeMessage('checkEndTurn')
    checkEndTurn(socket: Socket | null, data: { player: Player; room: string }) {
        const { room } = data;
        if (socket) {
            this.server.to(room).emit('endTurnChecking');
        } else {
            this.server.to(room).emit('endTurnChecking');
        }
    }

    @SubscribeMessage('updatedBoard')
    handleUpdatedBoard(socket: Socket, data: { room: string; board: Tiles[][] }) {
        const { room, board } = data;
        if (room) this.sharedDataService.setBoard(board);
    }

    @SubscribeMessage('toggleDebugMode')
    handleToggleDebugMode(client: Socket, payload: { room: string; status: boolean }): void {
        const { room, status } = payload;
        this.debugState.set(room, status);
        this.server.to(room).emit('debugModeToggled', { status });
    }
}
