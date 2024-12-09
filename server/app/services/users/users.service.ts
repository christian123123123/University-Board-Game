import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Player } from '@app/model/schema/player.schema';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
    addUser(gateway: ChatGateway, player: Player, room: string): void {
        if (!gateway.playersInRoom.has(room)) {
            gateway.playersInRoom.set(room, []);
        }

        if (!player) {
            return;
        }

        const usersInRoom = gateway.playersInRoom.get(room);

        const existingUser = usersInRoom.find((user) => user.username === player.username);
        if (!existingUser) {
            gateway.playersInRoom.get(room).push(player);
        }
    }

    removeUser(gateway: ChatGateway, id: string, room: string): void {
        const player = gateway.socketPlayers.get(id);
        if (player && gateway.playersInRoom.get(room)) {
            const updatedUsersInRoom = gateway.playersInRoom.get(room).filter((user) => user.username !== player.username);
            gateway.playersInRoom.set(room, updatedUsersInRoom);
        }
    }

    removeVP(gateway: ChatGateway, virtualPlayer: Player, room: string): void {
        const updatedUsersInRoom = gateway.playersInRoom.get(room).filter((user) => user.username !== virtualPlayer.username);
        gateway.playersInRoom.set(room, updatedUsersInRoom);
    }

    getUsersInRoom(gateway: ChatGateway, room: string) {
        return gateway.playersInRoom.get(room) || [];
    }
}
