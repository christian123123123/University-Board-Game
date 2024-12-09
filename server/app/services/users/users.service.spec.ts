import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Player } from '@app/model/schema/player.schema';
import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;
    let gateway: ChatGateway;

    const mockPlayer: Player = {
        username: 'testPlayer',
    } as Player;

    beforeEach(() => {
        service = new UsersService();

        gateway = {
            playersInRoom: new Map<string, Player[]>(),
            socketPlayers: new Map<string, Player>(),
        } as ChatGateway;
    });

    describe('#addUser', () => {
        it('should add a player to the room if not already present', () => {
            service.addUser(gateway, mockPlayer, 'socketId');

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual(playersInRoom);
        });

        it('should not add a player if already present in the room', () => {
            gateway.playersInRoom.set('testRoom', [mockPlayer]);

            service.addUser(gateway, mockPlayer, 'socketId');

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual([mockPlayer]);
        });

        it('should log an error if player is undefined', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            service.addUser(gateway, mockPlayer, 'socketId');

            consoleSpy.mockRestore();
        });
    });

    describe('#removeUser', () => {
        it('should remove a player from the room if present', () => {
            gateway.playersInRoom.set('testRoom', [mockPlayer]);
            gateway.socketPlayers.set('socketId', mockPlayer);

            service.removeUser(gateway, 'socketId', 'testRoom');

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual([]);
        });

        it('should not throw an error if the player is not in the room', () => {
            gateway.playersInRoom.set('testRoom', [mockPlayer]);

            expect(() => service.removeUser(gateway, 'unknownSocketId', 'testRoom')).not.toThrow();

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual([mockPlayer]);
        });
    });

    describe('#getUsersInRoom', () => {
        it('should return an array of players in the specified room', () => {
            gateway.playersInRoom.set('testRoom', [mockPlayer]);

            const players = service.getUsersInRoom(gateway, 'testRoom');

            expect(players).toEqual([mockPlayer]);
        });

        it('should return an empty array if no players are in the room', () => {
            const players = service.getUsersInRoom(gateway, 'emptyRoom');

            expect(players).toEqual(players);
        });
    });

    describe('#addUser', () => {
        it('should not add a player if player is undefined', () => {
            service.addUser(gateway, undefined, 'testRoom');

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual([]);
        });

        it('should not add a duplicate player to the room', () => {
            gateway.playersInRoom.set('testRoom', [mockPlayer]);

            service.addUser(gateway, mockPlayer, 'testRoom');

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual([mockPlayer]);
        });
    });

    describe('#removeVP', () => {
        it('should remove a virtual player from the room', () => {
            const virtualPlayer: Player = { username: 'virtualPlayer' } as Player;

            gateway.playersInRoom.set('testRoom', [mockPlayer, virtualPlayer]);

            service.removeVP(gateway, virtualPlayer, 'testRoom');

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual([mockPlayer]);
        });

        it('should do nothing if the virtual player is not in the room', () => {
            const virtualPlayer: Player = { username: 'virtualPlayer' } as Player;

            gateway.playersInRoom.set('testRoom', [mockPlayer]);

            service.removeVP(gateway, virtualPlayer, 'testRoom');

            const playersInRoom = gateway.playersInRoom.get('testRoom');
            expect(playersInRoom).toEqual([mockPlayer]);
        });

        it('should do nothing if the room does not exist', () => {
            const virtualPlayer: Player = { username: 'virtualPlayer' } as Player;
            gateway.playersInRoom.set('nonExistentRoom', [virtualPlayer]);
            service.removeVP(gateway, virtualPlayer, 'nonExistentRoom');
             const playersInRoom = gateway.playersInRoom.get('nonExistentRoom');
            expect(playersInRoom).toEqual([]);
        });
    });
});
