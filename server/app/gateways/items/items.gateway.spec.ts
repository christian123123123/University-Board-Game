import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Player } from '@app/model/schema/player.schema';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { ItemsGateway } from './items.gateway';

describe('ItemsGateway', () => {
    let itemsGateway: ItemsGateway;
    let chatGateway: jest.Mocked<ChatGateway>;
    let mockServer: jest.Mocked<Server>;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;

        chatGateway = {
            playersInRoom: new Map(),
        } as unknown as jest.Mocked<ChatGateway>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [ItemsGateway, { provide: ChatGateway, useValue: chatGateway }, { provide: Logger, useValue: new Logger() }],
        }).compile();

        itemsGateway = module.get<ItemsGateway>(ItemsGateway);
        itemsGateway.server = mockServer;
    });

    it('should be defined', () => {
        expect(itemsGateway).toBeDefined();
    });

    describe('handleItemPickedUp', () => {
        it('should increment objectCount and broadcast itemPickedUpBroadcast event', () => {
            const mockSocket = {} as Socket;
            const mockPlayer: Player = {
                username: 'player1',
                character: { objectCount: 0 },
            } as Player;
            const payload = {
                player: mockPlayer,
                position: { row: 1, col: 1 },
                item: 'item1',
                room: 'room1',
            };

            chatGateway.playersInRoom.set('room1', [mockPlayer]);

            itemsGateway.handleItemPickedUp(mockSocket, payload);

            expect(mockPlayer.character.objectCount).toBe(1);
            expect(mockServer.to).toHaveBeenCalledWith('room1');
            expect(mockServer.emit).toHaveBeenCalledWith('itemPickedUpBroadcast', {
                position: payload.position,
                item: payload.item,
                player: mockPlayer,
                playerObjectCount: 1,
            });
        });

        it('should return early if the player is not found in the room', () => {
            const mockSocket = {} as Socket;
            const payload = {
                player: { username: 'unknownPlayer' } as Player,
                position: { row: 1, col: 1 },
                item: 'item1',
                room: 'room1',
            };

            chatGateway.playersInRoom.set('room1', []);

            itemsGateway.handleItemPickedUp(mockSocket, payload);

            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).not.toHaveBeenCalled();
        });
    });

    describe('handleItemThrown', () => {
        it('should broadcast itemThrownBroadcast event', () => {
            const mockSocket = {} as Socket;
            const payload = {
                player: { username: 'player1' } as Player,
                position: { row: 1, col: 1 },
                item: 'item1',
                room: 'room1',
            };

            itemsGateway.handleItemThrown(mockSocket, payload);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
            expect(mockServer.emit).toHaveBeenCalledWith('itemThrownBroadcast', {
                position: payload.position,
                item: payload.item,
                player: payload.player,
            });
        });

        it('should work even if the socket is null', () => {
            const payload = {
                player: { username: 'player1' } as Player,
                position: { row: 1, col: 1 },
                item: 'item1',
                room: 'room1',
            };

            itemsGateway.handleItemThrown(null, payload);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
            expect(mockServer.emit).toHaveBeenCalledWith('itemThrownBroadcast', {
                position: payload.position,
                item: payload.item,
                player: payload.player,
            });
        });
    });

    describe('handleItemDropped', () => {
        it('should broadcast updateBoard event', () => {
            const mockSocket = {} as Socket;
            const payload = {
                item: 'item1',
                position: { row: 1, col: 1 },
                room: 'room1',
            };

            itemsGateway.handleItemDropped(mockSocket, payload);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
            expect(mockServer.emit).toHaveBeenCalledWith('updateBoard', {
                item: payload.item,
                position: payload.position,
            });
        });

        it('should work even if the socket is null', () => {
            const payload = {
                item: 'item1',
                position: { row: 1, col: 1 },
                room: 'room1',
            };

            itemsGateway.handleItemDropped(null, payload);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
            expect(mockServer.emit).toHaveBeenCalledWith('updateBoard', {
                item: payload.item,
                position: payload.position,
            });
        });
    });
});
