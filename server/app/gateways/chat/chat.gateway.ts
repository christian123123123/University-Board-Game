import { ChatMessage } from '@app/model/schema/chatMessage.schema';
import { Games } from '@app/model/schema/games.schema';
import { Player } from '@app/model/schema/player.schema';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { UsersService } from '@app/services/users/users.service';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TimersGateway } from '@app/gateways/timers/timers.gateway';
import { DELAY_BEFORE_EMITTING_TIME, DELAY_BEFORE_END_TURN } from './chat.gateway.constants';
import { ChatEvents } from './chat.gateway.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() server: Server;
    readonly socketRooms: Map<string, string> = new Map();
    readonly socketPlayers: Map<string, Player> = new Map();
    readonly roomBoards: Map<string, Games> = new Map();
    readonly playersInRoom: Map<string, Player[]> = new Map();
    readonly roomAccessibility: Map<string, boolean> = new Map();
    readonly roomMessages: Map<string, ChatMessage[]> = new Map();
    readonly activeRooms: Set<string> = new Set();

    constructor(
        public logger: Logger,
        private readonly usersService: UsersService,
        private readonly roomsService: RoomsService,
        readonly timersGateway: TimersGateway,
    ) {}

    @SubscribeMessage(ChatEvents.JoinRoom)
    joinRoom(
        socket: Socket,
        payload: { room: string; player: Player; game: Games },
    ): { welcomeMessageFromServer: string; chatHistory: ChatMessage[]; gameMap: Games } {
        const { room, player, game } = payload;
        if (!this.roomsService.roomExists(room)) {
            this.roomsService.createRoom(room);
            this.roomAccessibility.set(room, true);
        }
        socket.join(room);
        this.socketRooms.set(socket.id, room);
        this.socketPlayers.set(socket.id, player);
        if (this.usersService.getUsersInRoom(this, room).length === 0) {
            this.roomBoards.set(room, game);
        }
        this.usersService.addUser(this, player, room);

        this.server.to(room).emit('roomData', {
            currentRoom: room,
            players: this.usersService.getUsersInRoom(this, room),
            accessibility: this.roomAccessibility.get(room),
        });
        socket.broadcast.to(room).emit('messageFromServer', `${player.username} vient de rejoindre le salon !`);
        const messageFromServer = 'Que le meilleur gagne! GOON THE MOON';
        this.server.to(room).emit('startGameMessage', { username: 'server', message: messageFromServer });
        const welcomeMessageFromServer = `Bienvenue dans le salon ${room}!`;
        const chatHistory: ChatMessage[] = this.roomMessages.get(room);
        const gameMap: Games = this.roomBoards.get(room);
        return { welcomeMessageFromServer, chatHistory, gameMap };
    }

    // VP join room
    @SubscribeMessage('joinRoomVP')
    joinRoomVP(socket: Socket, payload: { room: string; player: Player }): void {
        const { room, player } = payload;
        this.usersService.addUser(this, player, room);
        if (!this.timersGateway.roomVpActionMap.has(room)) {
            this.timersGateway.roomVpActionMap.set(room, new Map<string, boolean>());
        }
        this.timersGateway.roomVpActionMap.get(room).set(player.username, false);

        this.server.to(room).emit('roomData', {
            currentRoom: room,
            players: this.usersService.getUsersInRoom(this, room),
            accessibility: this.roomAccessibility.get(room),
        });
        this.server.to(room).emit('messageFromServer', `${player.username} vient de rejoindre le salon !`);
    }

    // room message (chat box)
    @SubscribeMessage('sendMessage')
    roomMessage(socket: Socket, payload: { username: string; room: string; message: string; time: Date }) {
        const { username, room, message, time } = payload;
        const messageObject: ChatMessage = { user: username, text: message, time };
        if (!this.roomMessages.has(room)) {
            this.roomMessages.set(room, []);
        }
        this.roomMessages.get(room).push(messageObject);
        this.server.to(room).emit('roomMessage', { username, message });
    }
    @SubscribeMessage('checkRoomExistence')
    handleCheckRoomExistence(socket: Socket, data: { accessCode: string }): void {
        const { accessCode } = data;
        const isAccessible: boolean = this.roomAccessibility.get(accessCode);
        const roomExists: boolean = this.roomsService.roomExists(accessCode);

        socket.emit('checkRoomExistenceResponse', {
            exists: roomExists,
            accessible: isAccessible,
            playersInRoom: this.playersInRoom.get(accessCode),
            game: this.roomBoards.get(accessCode),
        });
    }
    // (waiting room)
    @SubscribeMessage('checkDuplicateName')
    handleCheckDuplicateName(socket: Socket, data: { accessCode: string; playerName: string }): void {
        const { accessCode, playerName } = data;
        const roomExists = this.roomsService.roomExists(accessCode);
        const playersInRoom = this.usersService.getUsersInRoom(this, accessCode);

        let uniqueUsername = playerName;
        let suffix = 2;

        const usernamesInRoom = playersInRoom.map((p) => p.username);
        const charactersInRoom = playersInRoom.map((p) => p.character.name);

        while (usernamesInRoom.includes(uniqueUsername)) {
            uniqueUsername = `${playerName}-${suffix}`;
            suffix++;
        }
        socket.emit('checkDuplicateNameResponse', {
            exists: roomExists,
            charactersInRoom,
            playerUpdatedName: uniqueUsername,
            game: this.roomBoards.get(accessCode),
        });
    }
    // accessibility button (waiting room)
    @SubscribeMessage('toggleAccessibility')
    handleAccessibility(socket: Socket, payload: { room: string }) {
        const { room } = payload;
        const currentAccessibility = this.roomAccessibility.get(room);
        const newAccessibility = !currentAccessibility;
        this.roomAccessibility.set(room, newAccessibility);
        this.server.to(room).emit('accessibilityToggled', { accessibility: newAccessibility });
    }
    // admin quit (waiting room)
    @SubscribeMessage('adminLeft')
    clearRoom(socket: Socket, payload: { room: string }) {
        const { room } = payload;
        this.roomsService.removeRoom(room);
        this.server.to(room).emit('adminLeft');
    }

    @SubscribeMessage('quitGame')
    handleQuitGame(socket: Socket, payload: { room: string; player: string }) {
        const { room, player } = payload;
        socket.leave(room);
        const remainingSockets = (this.playersInRoom.get(room) ?? []).length;
        if (remainingSockets > 1) {
            this.server.to(room).emit('playerQuitGame', { player });
        }
    }

    @SubscribeMessage('kickPlayer')
    async handleKickPlayer(socket: Socket, payload: { room: string; player: Player; isVirtual: boolean }) {
        const { room, player, isVirtual } = payload;
        const kickedPlayerSocketId = Array.from(this.socketPlayers.keys()).find((socketId) => {
            return this.socketPlayers.get(socketId).username === player.username;
        });
        if (isVirtual) {
            this.usersService.removeVP(this, player, room);
            this.server.to(room).emit('roomMessage', { username: 'server', message: `${player.username} a été foutu dehors!` });
            this.server.to(room).emit('roomData', {
                currentRoom: room,
                players: this.usersService.getUsersInRoom(this, room),
                accessibility: this.roomAccessibility.get(room),
            });
        } else if (kickedPlayerSocketId && !isVirtual) {
            this.server.to(kickedPlayerSocketId).emit('kick', { player });
            this.server.sockets.sockets.get(kickedPlayerSocketId)?.leave(room);
            this.usersService.removeUser(this, kickedPlayerSocketId, room);
            this.socketRooms.delete(kickedPlayerSocketId);
            this.socketPlayers.delete(kickedPlayerSocketId);
            this.server.to(room).emit('roomMessage', { username: 'server', message: `${player.username} a été foutu dehors!` });
            this.server.to(room).emit('roomData', {
                currentRoom: room,
                players: this.usersService.getUsersInRoom(this, room),
                accessibility: this.roomAccessibility.get(room),
            });
        }
    }

    @SubscribeMessage('onePlayerLeft')
    handleLastPlayerLeft(socket: Socket, payload: { room: string }) {
        const { room } = payload;
        this.timersGateway.pauseTimer(room);
        this.server.to(room).emit('kickLastPlayer');
    }

    @SubscribeMessage('clearRoom')
    handleClearRoom(socket: Socket, data: { room: string }): void {
        const { room } = data;
        if (this.roomBoards.has(room)) {
            this.roomBoards.delete(room);
        }
        if (this.playersInRoom.has(room)) {
            this.playersInRoom.delete(room);
        }
        if (this.roomAccessibility.has(room)) {
            this.roomAccessibility.delete(room);
        }
        if (this.activeRooms.has(room)) {
            this.activeRooms.delete(room);
        }
        this.timersGateway.handleStopGameTimer(socket, { room });
    }

    afterInit() {
        setInterval(() => {
            this.emitTime();
        }, DELAY_BEFORE_EMITTING_TIME);
    }

    handleConnection(socket: Socket) {
        this.logger.log(`Client connected: ${socket.id}`);
        this.logger.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        const room = this.socketRooms.get(socket.id);
        this.socketRooms.delete(socket.id);
        const user = this.socketPlayers.get(socket.id);
        this.usersService.removeUser(this, socket.id, room);
        this.socketPlayers.delete(socket.id);
        socket.leave(room);

        const remainingSockets = (this.playersInRoom.get(room) ?? []).length;
        if (user) {
            if (user.isAdmin) {
                // In Waiting-room, kicks everyone if admin leaves
                this.server.to(room).emit('adminLeft');
                this.roomsService.removeRoom(room);
            }
            if (room) {
                // For everyone in the room, sends them three update events when a player leaves
                socket.broadcast.to(room).emit('messageFromServer', `${user.username} vient de quitter le salon`);
                this.server.to(room).emit('playerQuitFight', { player: user });
                this.server.to(room).emit('playerQuitGame', { player: user });
            }

            // Check the number of real players left (non-bots)
            const socketsInRoom = (this.playersInRoom.get(room) ?? []).filter((player) => !player.isVirtual);
            if (socketsInRoom.length === 0) {
                // If there is no longer any real player left, clear the room
                this.handleClearRoom(socket, { room });
            } else if (this.timersGateway.activePlayers.get(room)) {
                // Enter this condition only when in game
                // Index of player who quit and the index of the current active player
                const quitterIndex = this.timersGateway.randomizedPlayersInRoom.get(room)?.findIndex((player) => player.username === user.username);
                const currentIndex = this.timersGateway.currentTurnIndices.get(room);

                if (quitterIndex < currentIndex) {
                    // If the quitter is before the current active player in the list
                    this.timersGateway.currentTurnIndices.set(room, currentIndex - 1); // current active player's index will go down one
                } else if (quitterIndex >= currentIndex) {
                    // If the quitter is after the current active player in the list or IS the active player
                    this.timersGateway.currentTurnIndices.set(room, currentIndex); // current active player's index will stay the same
                }

                // Updating randomized players list after removing the quitter
                const updatedRandomizedPlayersInRoom: Player[] = this.timersGateway.randomizedPlayersInRoom
                    .get(room)
                    .filter((p) => p.username !== user.username);
                this.timersGateway.randomizedPlayersInRoom.set(room, updatedRandomizedPlayersInRoom);

                // Looking for active fight to see if the quitter was in a fight when he quit
                const playersInFight: Player[] = this.timersGateway.playersInFight.get(room) ?? [];
                const wasQuitterFighting: boolean = playersInFight.some((p) => user.username === p.username);

                // If the player wasn't fighting and he had the active turn when he left, end his turn,
                // but if he was fighting then wait 3 seconds for the victory message to close before ending turn
                if (remainingSockets > 1 && user.username === this.timersGateway.activePlayers.get(room).username && !wasQuitterFighting) {
                    this.timersGateway.endTurn(room, this.timersGateway.randomizedPlayersInRoom.get(room), true);
                } else if (remainingSockets > 1 && user.username === this.timersGateway.activePlayers.get(room).username && wasQuitterFighting) {
                    setTimeout(() => {
                        this.timersGateway.endTurn(room, this.timersGateway.randomizedPlayersInRoom.get(room), true);
                    }, DELAY_BEFORE_END_TURN);
                }
            }

            // emit updated data after someone leaves
            const data = {
                currentRoom: room,
                players: this.usersService.getUsersInRoom(this, room),
                accessibility: this.roomAccessibility.get(room),
            };

            this.server.to(room).emit('roomData', data);
        }
    }
    emitTime() {
        this.server.emit(ChatEvents.Clock, new Date().toLocaleTimeString());
    }
}
