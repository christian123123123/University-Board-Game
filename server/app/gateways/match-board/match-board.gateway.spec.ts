import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Player } from '@app/model/schema/player.schema';
import { Tiles } from '@app/model/schema/tiles.schema';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { MatchBoardGateway } from './match-board.gateway';

describe('MatchBoardGateway', () => {
    let gateway: MatchBoardGateway;
    let chatGateway: jest.Mocked<ChatGateway>;
    let sharedDataService: jest.Mocked<SharedDataService>;
    let mockServer: jest.Mocked<Server>;

    beforeEach(async () => {
        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;

        chatGateway = {
            playersInRoom: new Map(),
        } as unknown as jest.Mocked<ChatGateway>;

        sharedDataService = {
            setBoard: jest.fn(),
        } as unknown as jest.Mocked<SharedDataService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchBoardGateway,
                { provide: ChatGateway, useValue: chatGateway },
                { provide: SharedDataService, useValue: sharedDataService },
                { provide: Logger, useValue: new Logger() },
            ],
        }).compile();

        gateway = module.get<MatchBoardGateway>(MatchBoardGateway);
        gateway.server = mockServer;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    describe('handleInitialPosition', () => {
        it('should add initial position to totalTilesVisited and emit event', () => {
            const mockSocket = {} as Socket;
            const mockPlayer: Player = {
                username: 'player1',
                character: { tilesVisited: [] },
            } as Player;
            const payload = {
                player: mockPlayer,
                initialPosition: { row: 0, col: 0 },
                room: 'room1',
            };

            chatGateway.playersInRoom.set('room1', [mockPlayer]);
            gateway.handleInitialPosition(mockSocket, payload);

            expect(gateway.totalTilesVisited.get('room1')).toContainEqual(payload.initialPosition);
            expect(mockPlayer.character.tilesVisited).toContainEqual(payload.initialPosition);
            expect(mockServer.to).toHaveBeenCalledWith('room1');
        });
    });

    describe('handlePlayerMove', () => {
        it('should update tilesVisited and emit events', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            const mockBroadcast = { to: mockTo };
            const mockSocket = { id: 'socket1', broadcast: mockBroadcast } as unknown as Socket;

            const mockPlayer: Player = {
                username: 'player1',
                character: { tilesVisited: [] },
            } as Player;

            const payload = {
                player: mockPlayer,
                position: { row: 1, col: 1 },
                room: 'room1',
                positionBeforeTeleportation: { row: 0, col: 0 },
                isTeleportation: false,
            };

            chatGateway.playersInRoom.set('room1', [mockPlayer]);
            gateway.totalTilesVisited.set('room1', []);

            gateway.handlePlayerMove(mockSocket, payload);

            expect(gateway.totalTilesVisited.get('room1')).toContainEqual(payload.position);
            expect(mockPlayer.character.tilesVisited).toContainEqual(payload.position);

            expect(mockTo).toHaveBeenCalledWith('room1');
            expect(mockEmit).toHaveBeenCalledWith('playerMoved', {
                player: mockPlayer,
                position: payload.position,
                playersTileVisited: mockPlayer.character.tilesVisited,
                totalTilesVisited: gateway.totalTilesVisited.get('room1'),
                positionBeforeTeleportation: payload.positionBeforeTeleportation,
                isTeleportation: payload.isTeleportation,
            });
        });
    });

    describe('handleToggleDoor', () => {
        it('should add door to doorsManipulated and emit event', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            const mockSocket = { id: 'socket1', to: mockTo } as unknown as Socket;

            gateway.server = { to: mockTo } as any;

            const room = 'test-room';
            const player = { username: 'test-player' } as Player;
            const currentTile = { fieldTile: 'DOOR_OPEN', position: { row: 0, col: 0 } } as Tiles;

            gateway.doorsManipulated.set(room, []);

            gateway.handleToggleDoor(mockSocket, { room, currentTile, player, wasDoorOpen: true });

            expect(gateway.doorsManipulated.get(room)).toEqual([{ row: 0, col: 0 }]);

            expect(mockTo).toHaveBeenCalledWith('test-room');
            expect(mockEmit).toHaveBeenCalledWith('doorToggled', {
                tile: currentTile,
                player,
                wasDoorOpen: true,
                doorsToggled: [{ row: 0, col: 0 }],
            });
        });
    });

    describe('checkEndTurn', () => {
        it('should emit endTurnChecking event', () => {
            const mockEmit = jest.fn();
            const mockTo = jest.fn(() => ({ emit: mockEmit }));
            gateway.server = { to: mockTo, emit: mockEmit } as any;

            const mockSocket = { id: 'socket1', to: mockTo } as unknown as Socket;
            const payload = { player: { username: 'player1' } as Player, room: 'room1' };

            gateway.checkEndTurn(mockSocket, payload);

            expect(mockTo).toHaveBeenCalledWith('room1');
            expect(mockEmit).toHaveBeenCalledWith('endTurnChecking');
        });
    });

    describe('handleUpdatedBoard', () => {
        it('should update board using SharedDataService', () => {
            const mockSocket = {} as Socket;
            const payload = { room: 'room1', board: [[{} as Tiles]] };

            gateway.handleUpdatedBoard(mockSocket, payload);

            expect(sharedDataService.setBoard).toHaveBeenCalledWith(payload.board);
        });
    });

    describe('handleToggleDebugMode', () => {
        it('should update debugState and emit event', () => {
            const mockSocket = {} as Socket;
            const payload = { room: 'room1', status: true };

            gateway.handleToggleDebugMode(mockSocket, payload);

            expect(gateway.debugState.get('room1')).toBe(true);
            expect(mockServer.to).toHaveBeenCalledWith('room1');
            expect(mockServer.emit).toHaveBeenCalledWith('debugModeToggled', { status: true });
        });
    });
});
