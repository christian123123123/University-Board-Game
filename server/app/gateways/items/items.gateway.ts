import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Player } from '@app/model/schema/player.schema';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class ItemsGateway {
    @WebSocketServer() server: Server;
    constructor(
        public logger: Logger,
        @Inject(forwardRef(() => ChatGateway)) readonly chatGateway: ChatGateway,
    ) {}

    @SubscribeMessage('itemPickedUp')
    handleItemPickedUp(socket: Socket | null, payload: { player: Player; position: { row: number; col: number }; item: string; room: string }) {
        const { position, item, room, player } = payload;
        const playerWithObject = (this.chatGateway.playersInRoom.get(room) ?? []).find((p) => p.username === player.username);

        if (playerWithObject === undefined) {
            return;
        }
        playerWithObject.character.objectCount = (playerWithObject.character.objectCount || 0) + 1;

        if (socket || !socket) {
            this.server.to(room).emit('itemPickedUpBroadcast', {
                position,
                item,
                player,
                playerObjectCount: playerWithObject.character.objectCount,
            });
        }
    }

    @SubscribeMessage('itemThrown')
    handleItemThrown(socket: Socket | null, payload: { player: Player; position: { row: number; col: number }; item: string; room: string }) {
        const { position, item, room, player } = payload;
        if (socket) {
            this.server.to(room).emit('itemThrownBroadcast', { position, item, player });
        } else {
            this.server.to(room).emit('itemThrownBroadcast', { position, item, player });
        }
    }

    @SubscribeMessage('itemDropped')
    handleItemDropped(socket: Socket | null, payload: { item: string; position: { row: number; col: number }; room: string }) {
        const { item, position, room } = payload;
        if (socket) {
            this.server.to(room).emit('updateBoard', { item, position });
        } else {
            this.server.to(room).emit('updateBoard', { item, position });
        }
    }
}
