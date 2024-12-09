import { Games } from '@app/model/schema/games.schema';
import { Player } from '@app/model/schema/player.schema';
import { Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { ChatEvents } from './chat.gateway.events';

describe('ChatGateway', () => {
    let gateway: ChatGateway;

    const mockTimersGateway = {
        roomVpActionMap: new Map(),
        activePlayers: new Map(),
        randomizedPlayersInRoom: new Map(),
        currentTurnIndices: new Map(),
        playersInFight: new Map(),
        pauseTimer: jest.fn(),
        handleStopGameTimer: jest.fn(),
        endTurn: jest.fn(),
    };

    const mockUsersService = {
        getUsersInRoom: jest.fn(() => []),
        addUser: jest.fn(),
        removeUser: jest.fn(),
        removeVP: jest.fn(),
    };

    const mockRoomsService = {
        roomExists: jest.fn(() => true),
        createRoom: jest.fn(),
        removeRoom: jest.fn(),
    };

    const mockServer = {
        emit: jest.fn(),
        to: jest.fn(() => ({
            emit: jest.fn(),
        })),
        sockets: {
            sockets: new Map(),
        },
    };

    const mockLogger = {
        log: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        /* eslint-disable @typescript-eslint/no-explicit-any */
        gateway = new ChatGateway(mockLogger as any, mockUsersService as any, mockRoomsService as any, mockTimersGateway as any);
        /* eslint-disable @typescript-eslint/no-explicit-any */
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('roomMessage', () => {
        it('should emit a chat message to the room', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            gateway.server = {
                to: mockTo,
            } as any;

            const mockSocket = { id: 'socket-id' } as unknown as Socket;
            const payload = {
                username: 'test-user',
                room: 'test-room',
                message: 'Hello, world!',
                time: new Date(),
            };

            gateway.roomMessages.set('test-room', []);

            gateway.roomMessage(mockSocket, payload);

            expect(gateway.roomMessages.get('test-room')).toEqual([{ user: 'test-user', text: 'Hello, world!', time: payload.time }]);

            expect(mockTo).toHaveBeenCalledWith('test-room');
            expect(mockEmit).toHaveBeenCalledWith('roomMessage', {
                username: 'test-user',
                message: 'Hello, world!',
            });
        });
    });

    describe('handleDisconnect', () => {
        it('should remove the player from the room on disconnect', () => {
            const mockSocket = {
                id: 'socket-id',
                leave: jest.fn(),
            } as unknown as Socket;

            gateway.socketRooms.set('socket-id', 'test-room');

            gateway.handleDisconnect(mockSocket);

            expect(mockUsersService.removeUser).toHaveBeenCalledWith(gateway, 'socket-id', 'test-room');
            expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
        });
    });

    describe('clearRoom', () => {
        it('should remove the room and emit "adminLeft" event', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));

            gateway.server = {
                to: mockTo,
            } as any;

            const mockSocket = { id: 'socket-id' } as unknown as Socket;
            const payload = { room: 'test-room' };

            jest.spyOn(mockRoomsService, 'removeRoom');

            gateway.clearRoom(mockSocket, payload);

            expect(mockRoomsService.removeRoom).toHaveBeenCalledWith('test-room');

            expect(mockTo).toHaveBeenCalledWith('test-room');
            expect(mockEmit).toHaveBeenCalledWith('adminLeft');
        });
    });

    describe('handleQuitGame', () => {
        it('should make the socket leave the room and emit "playerQuitGame" if more than one socket remains', () => {
            const mockSocket = {
                id: 'socket-id',
                leave: jest.fn(),
            } as unknown as Socket;
            const payload = { room: 'test-room', player: 'test-player' };

            gateway.handleQuitGame(mockSocket, payload);

            expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
        });

        it('should not emit "playerQuitGame" if only one socket remains', () => {
            const mockSocket = {
                id: 'socket-id',
                leave: jest.fn(),
            } as unknown as Socket;
            const payload = { room: 'test-room', player: 'test-player' };

            gateway.handleQuitGame(mockSocket, payload);

            expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
            expect(mockServer.to).not.toHaveBeenCalledWith('test-room');
        });
    });

    describe('handleKickPlayer', () => {
        it('should handle kicking a virtual player', async () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));

            gateway.server = {
                to: mockTo,
            } as any;

            const mockSocket = { id: 'socket-id' } as unknown as Socket;
            const mockPayload = {
                room: 'test-room',
                player: { username: 'vp1', isVirtual: true } as any,
                isVirtual: true,
            };

            await gateway.handleKickPlayer(mockSocket, mockPayload);

            expect(mockTo).toHaveBeenCalledWith('test-room');
            expect(mockEmit).toHaveBeenCalledWith('roomMessage', {
                username: 'server',
                message: 'vp1 a été foutu dehors!',
            });

            expect(mockEmit).toHaveBeenCalledWith('roomData', {
                currentRoom: 'test-room',
                players: [],
                accessibility: undefined,
            });

            expect(mockUsersService.removeVP).toHaveBeenCalledWith(gateway, mockPayload.player, 'test-room');
        });

        it('should handle kicking a real player', async () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));

            gateway.server = {
                to: mockTo,
                sockets: {
                    sockets: new Map<string, any>(),
                },
            } as any;

            const mockSocket = { id: 'socket-id' } as unknown as Socket;
            const mockPlayerSocketId = 'real-player-socket-id';
            const mockPayload = {
                room: 'test-room',
                player: { username: 'player1', isVirtual: false } as any,
                isVirtual: false,
            };

            gateway.socketPlayers.set(mockPlayerSocketId, { username: 'player1' } as any);
            gateway.socketRooms.set(mockPlayerSocketId, 'test-room');

            const mockLeave = jest.fn();

            await gateway.handleKickPlayer(mockSocket, mockPayload);

            expect(mockTo).toHaveBeenCalledWith(mockPlayerSocketId);
            expect(mockEmit).toHaveBeenCalledWith('kick', { player: mockPayload.player });

            expect(gateway.socketRooms.has(mockPlayerSocketId)).toBe(false);
            expect(gateway.socketPlayers.has(mockPlayerSocketId)).toBe(false);
        });

        it('should do nothing if kickedPlayerSocketId is not found for a real player', async () => {
            const mockSocket = { id: 'socket-id' } as unknown as Socket;
            const mockPayload = {
                room: 'test-room',
                player: { username: 'nonexistent-player', isVirtual: false } as any,
                isVirtual: false,
            };

            await gateway.handleKickPlayer(mockSocket, mockPayload);

            expect(mockServer.to).not.toHaveBeenCalledWith('nonexistent-player-socket-id');
        });
    });

    describe('handleClearRoom', () => {
        it('should clear room data correctly', () => {
            const mockSocket = {} as Socket;
            const mockData = { room: 'test-room' };

            gateway.handleClearRoom(mockSocket, mockData);

            expect(gateway.roomBoards.has('test-room')).toBe(false);
            expect(gateway.playersInRoom.has('test-room')).toBe(false);
            expect(gateway.roomAccessibility.has('test-room')).toBe(false);
            expect(gateway.activeRooms.has('test-room')).toBe(false);
        });

        it('should handle case where room does not exist gracefully', () => {
            const mockSocket = {} as Socket;
            const mockData = { room: 'nonexistent-room' };

            gateway.handleClearRoom(mockSocket, mockData);

            expect(gateway.roomBoards.has('nonexistent-room')).toBe(false);
            expect(gateway.playersInRoom.has('nonexistent-room')).toBe(false);
            expect(gateway.roomAccessibility.has('nonexistent-room')).toBe(false);
            expect(gateway.activeRooms.has('nonexistent-room')).toBe(false);
        });
    });

    describe('afterInit', () => {
        jest.useFakeTimers();

        it('should call emitTime at regular intervals', () => {
            const DELAY_BEFORE_EMITTING_TIME = 1;
            /* eslint-disable @typescript-eslint/no-empty-function */

            const emitTimeSpy = jest.spyOn(gateway, 'emitTime').mockImplementation(() => {});
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.afterInit();

            jest.advanceTimersByTime(DELAY_BEFORE_EMITTING_TIME);

            expect(emitTimeSpy).toHaveBeenCalledTimes(0);

            jest.advanceTimersByTime(DELAY_BEFORE_EMITTING_TIME);

            expect(emitTimeSpy).toHaveBeenCalledTimes(0);

            jest.useRealTimers();
        });
    });

    describe('handleConnection', () => {
        it('should log connection details', () => {
            const mockSocket = { id: 'socket123' } as Socket;

            gateway.handleConnection(mockSocket);

            expect(mockLogger.log).toHaveBeenCalledWith('Client connected: socket123');
            expect(mockLogger.log).toHaveBeenCalledWith("Connexion par l'utilisateur avec id : socket123");
        });
    });

    it('should call pauseTimer and emit "kickLastPlayer"', () => {
        const mockEmit = jest.fn();
        const mockTo = jest.fn(() => ({ emit: mockEmit }));

        gateway.server = { to: mockTo } as any;

        const mockSocket = {} as Socket;
        const payload = { room: 'testRoom' };

        gateway.handleLastPlayerLeft(mockSocket, payload);

        expect(mockTimersGateway.pauseTimer).toHaveBeenCalledWith('testRoom');

        expect(mockTo).toHaveBeenCalledWith('testRoom');
        expect(mockEmit).toHaveBeenCalledWith('kickLastPlayer');
    });

    it('should create a new room if it does not exist', () => {
        const mockEmit = jest.fn();
        const mockTo = jest.fn(() => ({ emit: mockEmit }));
        const mockBroadcast = { to: mockTo };

        const mockSocket = {
            id: 'socket1',
            join: jest.fn(),
            broadcast: mockBroadcast,
        } as unknown as Socket;

        mockRoomsService.roomExists.mockReturnValue(false);
        mockRoomsService.createRoom = jest.fn();
        const payload = {
            room: 'testRoom',
            player: { username: 'testPlayer' } as Player,
            game: { title: 'testGame' } as Games,
        };

        gateway.server = { to: mockTo } as any;

        gateway.joinRoom(mockSocket, payload);

        expect(mockRoomsService.roomExists).toHaveBeenCalledWith('testRoom');
        expect(mockRoomsService.createRoom).toHaveBeenCalledWith('testRoom');

        expect(mockSocket.join).toHaveBeenCalledWith(payload.room);

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('roomData', {
            currentRoom: payload.room,
            players: [],
            accessibility: true,
        });

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('messageFromServer', `${payload.player.username} vient de rejoindre le salon !`);

        expect(mockEmit).toHaveBeenCalledWith('startGameMessage', {
            username: 'server',
            message: 'Que le meilleur gagne! GOON THE MOON',
        });
    });

    it('should not create a new room if it already exists', () => {
        const mockEmit = jest.fn();
        const mockTo = jest.fn(() => ({ emit: mockEmit }));
        const mockBroadcast = { to: mockTo };

        const mockSocket = {
            id: 'socket1',
            join: jest.fn(),
            broadcast: mockBroadcast,
        } as unknown as Socket;

        mockRoomsService.roomExists.mockReturnValue(true);
        mockUsersService.getUsersInRoom.mockReturnValue([]);
        const payload = {
            room: 'testRoom',
            player: { username: 'testPlayer' } as Player,
            game: { title: 'testGame' } as Games,
        };

        gateway.server = { to: mockTo } as any;

        gateway.joinRoom(mockSocket as Socket, payload);

        expect(mockRoomsService.createRoom).not.toHaveBeenCalled();

        expect(mockSocket.join).toHaveBeenCalledWith(payload.room);

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('roomData', {
            currentRoom: payload.room,
            players: [],
            accessibility: undefined,
        });

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('messageFromServer', `${payload.player.username} vient de rejoindre le salon !`);

        expect(mockEmit).toHaveBeenCalledWith('startGameMessage', {
            username: 'server',
            message: 'Que le meilleur gagne! GOON THE MOON',
        });
    });

    it('should set the room board if it is empty', () => {
        const mockEmit = jest.fn();
        const mockTo = jest.fn(() => ({ emit: mockEmit }));
        const mockBroadcast = { to: mockTo };

        const mockSocket = {
            id: 'socket1',
            join: jest.fn(),
            broadcast: mockBroadcast,
        } as unknown as Socket;

        mockRoomsService.roomExists.mockReturnValue(true);
        mockUsersService.getUsersInRoom.mockReturnValue([]);
        const payload = {
            room: 'testRoom',
            player: { username: 'testPlayer' } as Player,
            game: { title: 'testGame' } as Games,
        };

        gateway.server = { to: mockTo } as any;

        gateway.roomBoards.set('testRoom', null);
        gateway.joinRoom(mockSocket as Socket, payload);

        expect(gateway.roomBoards.get('testRoom')).toEqual(payload.game);

        expect(mockSocket.join).toHaveBeenCalledWith(payload.room);

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('roomData', {
            currentRoom: payload.room,
            players: [],
            accessibility: undefined,
        });

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('messageFromServer', `${payload.player.username} vient de rejoindre le salon !`);

        expect(mockEmit).toHaveBeenCalledWith('startGameMessage', {
            username: 'server',
            message: 'Que le meilleur gagne! GOON THE MOON',
        });
    });

    it('should return the correct data', () => {
        const mockEmit = jest.fn();
        const mockTo = jest.fn(() => ({ emit: mockEmit }));
        const mockBroadcast = { to: mockTo };

        const mockSocket = {
            id: 'socket1',
            join: jest.fn(),
            broadcast: mockBroadcast,
        } as unknown as Socket;

        const payload = {
            room: 'testRoom',
            player: { username: 'testPlayer' } as Player,
            game: { title: 'testGame' } as Games,
        };

        gateway.server = { to: mockTo } as any;

        mockUsersService.getUsersInRoom = jest.fn(() => []);
        gateway.roomAccessibility.set(payload.room, true);

        gateway.joinRoom(mockSocket, payload);

        expect(mockSocket.join).toHaveBeenCalledWith(payload.room);

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('roomData', {
            currentRoom: payload.room,
            players: [],
            accessibility: true,
        });

        expect(mockTo).toHaveBeenCalledWith(payload.room);
        expect(mockEmit).toHaveBeenCalledWith('messageFromServer', `${payload.player.username} vient de rejoindre le salon !`);

        expect(mockEmit).toHaveBeenCalledWith('startGameMessage', {
            username: 'server',
            message: 'Que le meilleur gagne! GOON THE MOON',
        });

        expect(gateway.roomBoards.get(payload.room)).toEqual(payload.game);
        expect(gateway.socketRooms.get(mockSocket.id)).toBe(payload.room);
        expect(gateway.socketPlayers.get(mockSocket.id)).toBe(payload.player);
    });

    describe('joinRoomVP', () => {
        it('should add a user to the room, update roomVpActionMap, and emit roomData and messageFromServer events', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            gateway.server = { to: mockTo } as any;

            const room = 'test-room';
            const player: Player = {
                username: 'test-player',
            } as any;

            mockUsersService.addUser = jest.fn();
            mockUsersService.getUsersInRoom = jest.fn(() => [player]);
            mockTimersGateway.roomVpActionMap = new Map();

            gateway.roomAccessibility.set(room, true);

            gateway.joinRoomVP({} as Socket, { room, player });

            expect(mockUsersService.addUser).toHaveBeenCalledWith(gateway, player, room);

            expect(mockTimersGateway.roomVpActionMap.has(room)).toBe(true);
            expect(mockTimersGateway.roomVpActionMap.get(room).get(player.username)).toBe(false);

            expect(mockTo).toHaveBeenCalledWith(room);
            expect(mockEmit).toHaveBeenCalledWith('roomData', {
                currentRoom: room,
                players: [player],
                accessibility: true,
            });
            expect(mockEmit).toHaveBeenCalledWith('messageFromServer', `${player.username} vient de rejoindre le salon !`);
        });
    });

    describe('handleAccessibility', () => {
        it('should toggle the room accessibility and emit accessibilityToggled event', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            gateway.server = { to: mockTo } as any;

            const room = 'test-room';
            gateway.roomAccessibility.set(room, true);

            gateway.handleAccessibility({} as Socket, { room });

            expect(gateway.roomAccessibility.get(room)).toBe(false);
            expect(mockTo).toHaveBeenCalledWith(room);
            expect(mockEmit).toHaveBeenCalledWith('accessibilityToggled', { accessibility: false });

            gateway.handleAccessibility({} as Socket, { room });

            expect(gateway.roomAccessibility.get(room)).toBe(true);
            expect(mockTo).toHaveBeenCalledWith(room);
            expect(mockEmit).toHaveBeenCalledWith('accessibilityToggled', { accessibility: true });
        });
    });

    describe('handleCheckDuplicateName', () => {
        it('should emit the response with a unique player name if the username is already taken', () => {
            const mockSocket = { id: 'socket1', join: jest.fn(), to: jest.fn(), emit: jest.fn() } as unknown as Socket;

            const accessCode = 'test-room';
            const playerName = 'player1';

            const mockPlayersInRoom = [
                { username: 'player1', character: { name: 'char1' } },
                { username: 'player2', character: { name: 'char2' } },
            ];

            const mockGame = { id: 1, board: [[]] } as Games;

            mockRoomsService.roomExists.mockReturnValue(true);
            mockUsersService.getUsersInRoom.mockReturnValue(mockPlayersInRoom);
            gateway.roomBoards.set(accessCode, mockGame);

            gateway.handleCheckDuplicateName(mockSocket, { accessCode, playerName });
        });

        it('should emit the response with the original name if it is unique', () => {
            const mockSocket = { id: 'socket1', join: jest.fn(), to: jest.fn(), emit: jest.fn() } as unknown as Socket;
            const accessCode = 'test-room';
            const playerName = 'uniquePlayer';
            const mockEmit = jest.fn();
            gateway.server = { emit: mockEmit } as any;

            const mockPlayersInRoom = [
                { username: 'player1', character: { name: 'char1' } },
                { username: 'player2', character: { name: 'char2' } },
            ];

            const mockGame = { id: 1, board: [[]] } as Games;

            mockRoomsService.roomExists.mockReturnValue(true);
            mockUsersService.getUsersInRoom.mockReturnValue(mockPlayersInRoom);
            gateway.roomBoards.set(accessCode, mockGame);

            gateway.handleCheckDuplicateName(mockSocket, { accessCode, playerName });
        });

        it('should emit the response with room existence as false if the room does not exist', () => {
            const mockSocket = { id: 'socket1', join: jest.fn(), to: jest.fn(), emit: jest.fn() } as unknown as Socket;
            const accessCode = 'nonexistent-room';
            const playerName = 'player1';
            const mockEmit = jest.fn();
            gateway.server = { emit: mockEmit } as any;

            mockRoomsService.roomExists.mockReturnValue(false);
            mockUsersService.getUsersInRoom.mockReturnValue([]);
            gateway.roomBoards.delete(accessCode);

            gateway.handleCheckDuplicateName(mockSocket, { accessCode, playerName });
        });
    });

    describe('handleClearRoom', () => {
        it('should clear room data and call handleStopGameTimer', () => {
            const mockSocket = { id: 'socket1', emit: jest.fn() } as unknown as Socket;

            const room = 'test-room';
            const mockEmit = jest.fn();
            gateway.server = { emit: mockEmit } as any;

            gateway.roomBoards.set(room, { some: 'gameData' } as any);
            gateway.playersInRoom.set(room, [{ username: 'player1' }] as any);
            gateway.roomAccessibility.set(room, true);
            gateway.activeRooms.add(room);

            const handleStopGameTimerSpy = jest.spyOn(mockTimersGateway, 'handleStopGameTimer');

            gateway.handleClearRoom(mockSocket, { room });

            expect(gateway.roomBoards.has(room)).toBe(false);
            expect(gateway.playersInRoom.has(room)).toBe(false);
            expect(gateway.roomAccessibility.has(room)).toBe(false);
            expect(gateway.activeRooms.has(room)).toBe(false);

            expect(handleStopGameTimerSpy).toHaveBeenCalledWith(mockSocket, { room });
        });
    });

    describe('handleDisconnect', () => {
        it('should handle user disconnection and update room state', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            const mockBroadcast = { to: mockTo };
            const mockSocket = {
                id: 'socket1',
                leave: jest.fn(),
                broadcast: mockBroadcast,
            } as unknown as Socket;

            const room = 'test-room';
            const user = { username: 'player1', isAdmin: false } as any;

            gateway.server = { to: mockTo } as any;

            gateway.socketRooms.set(mockSocket.id, room);
            gateway.socketPlayers.set(mockSocket.id, user);
            gateway.playersInRoom.set(room, [{ username: 'player1', isVirtual: false }] as any);
            gateway.roomAccessibility.set(room, true);

            jest.spyOn(gateway, 'handleClearRoom').mockImplementation(() => {});
            mockUsersService.getUsersInRoom.mockReturnValue([{ username: 'player2' }]);
            mockTimersGateway.randomizedPlayersInRoom.set(room, [{ username: 'player1' }, { username: 'player2' }]);
            mockTimersGateway.currentTurnIndices.set(room, 1);
            mockTimersGateway.activePlayers.set(room, { username: 'player2' });

            gateway.handleDisconnect(mockSocket);

            expect(gateway.socketRooms.has(mockSocket.id)).toBe(false);
            expect(gateway.socketPlayers.has(mockSocket.id)).toBe(false);

            expect(mockSocket.leave).toHaveBeenCalledWith(room);

            const data = {
                currentRoom: room,
                players: [{ username: 'player2' }],
                accessibility: true,
            };

            expect(mockTo).toHaveBeenCalledWith(room);
            expect(mockEmit).toHaveBeenCalledWith('roomData', data);

            expect(mockUsersService.removeUser).toHaveBeenCalledWith(gateway, mockSocket.id, room);

            expect(mockTo).toHaveBeenCalledWith(room);
            expect(mockEmit).toHaveBeenCalledWith('playerQuitFight', { player: user });
            expect(mockEmit).toHaveBeenCalledWith('messageFromServer', `${user.username} vient de quitter le salon`);
        });

        it('should clear the room if the last real player leaves', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            const mockBroadcast = { to: mockTo };
            gateway.server = { to: mockTo } as any;

            const mockSocket = {
                id: 'socket1',
                leave: jest.fn(),
                broadcast: mockBroadcast,
            } as unknown as Socket;

            const room = 'test-room';
            const user = { username: 'player1', isAdmin: true } as any;

            gateway.socketRooms.set(mockSocket.id, room);
            gateway.socketPlayers.set(mockSocket.id, user);
            gateway.playersInRoom.set(room, [{ username: 'player1', isVirtual: false }] as any);

            jest.spyOn(gateway, 'handleClearRoom').mockImplementation(() => {});

            gateway.handleDisconnect(mockSocket);

            expect(mockTo).toHaveBeenCalledWith(room);
            expect(mockEmit).toHaveBeenCalledWith('adminLeft');
        });
    });

    describe('emitTime', () => {
        it('should emit the current time to the clock event', () => {
            const mockEmit = jest.fn();
            gateway.server = { emit: mockEmit } as any;

            jest.spyOn(global.Date.prototype, 'toLocaleTimeString').mockReturnValue('12:34:56');

            gateway.emitTime();

            expect(mockEmit).toHaveBeenCalledWith(ChatEvents.Clock, '12:34:56');
        });
    });
});
