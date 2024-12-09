import { Games, GamesDocument } from '@app/model/schema/games.schema';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Query } from 'mongoose';
import { GamesService } from './games.service';

describe('GamesService', () => {
    let service: GamesService;
    let model: jest.Mocked<Model<GamesDocument>>;

    const mockGame = {
        _id: 'gameId',
        name: 'Test Game',
        accessCode: '1234',
    } as unknown as GamesDocument;

    const mockQuery = <T>(result: T) =>
        ({
            exec: jest.fn().mockResolvedValue(result),
        }) as unknown as Query<T, GamesDocument>;

    beforeEach(async () => {
        const mockGamesModel = {
            new: jest.fn().mockResolvedValue(mockGame),
            constructor: jest.fn().mockResolvedValue(mockGame),
            find: jest.fn().mockReturnValue(mockQuery([mockGame])),
            findById: jest.fn().mockReturnValue(mockQuery(mockGame)),
            findOne: jest.fn().mockReturnValue(mockQuery(mockGame)),
            findByIdAndUpdate: jest.fn().mockReturnValue(mockQuery(mockGame)),
            findByIdAndDelete: jest.fn().mockReturnValue(mockQuery(true)),
            create: jest.fn().mockResolvedValue(mockGame),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GamesService,
                {
                    provide: getModelToken(Games.name),
                    useValue: mockGamesModel,
                },
            ],
        }).compile();

        service = module.get<GamesService>(GamesService);
        model = module.get<jest.Mocked<Model<GamesDocument>>>(getModelToken(Games.name));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getGames', () => {
        it('should return an array of games', async () => {
            const result = await service.getGames();
            expect(model.find).toHaveBeenCalled();
            expect(result).toEqual([mockGame]);
        });
    });

    describe('getGameById', () => {
        it('should retrieve a game by id', async () => {
            const result = await service.getGameById('gameId');
            expect(model.findById).toHaveBeenCalledWith('gameId');
            expect(result).toEqual(mockGame);
        });

        it('should throw an error if game not found', async () => {
            model.findById.mockReturnValueOnce({
                exec: jest.fn().mockRejectedValueOnce(new Error('FindById failed')),
            } as unknown as Query<unknown, GamesDocument>);

            await expect(service.getGameById('invalidId')).rejects.toThrow('Failed fetch the selected games details: FindById failed');
        });
    });

    describe('updateGameDetails', () => {
        it('should update game details', async () => {
            const updatedGameData = { title: 'Updated Game' };
            const result = await service.updateGameDetails('gameId', updatedGameData);
            expect(model.findByIdAndUpdate).toHaveBeenCalledWith('gameId', updatedGameData, { new: true });
            expect(result).toEqual(mockGame);
        });

        it('should throw an error if update fails', async () => {
            model.findByIdAndUpdate.mockReturnValueOnce({
                exec: jest.fn().mockRejectedValueOnce(new Error('Update failed')),
            } as unknown as Query<unknown, GamesDocument>);

            await expect(service.updateGameDetails('invalidId', {})).rejects.toThrow('Failed to update the game: Update failed');
        });
    });

    describe('deleteGame', () => {
        it('should delete a game', async () => {
            await service.deleteGame('gameId');
            expect(model.findByIdAndDelete).toHaveBeenCalledWith('gameId');
        });

        it('should throw an error if deletion fails', async () => {
            model.findByIdAndDelete.mockReturnValueOnce({
                exec: jest.fn().mockRejectedValueOnce(new Error('Delete failed')),
            } as unknown as Query<unknown, GamesDocument>);

            await expect(service.deleteGame('invalidId')).rejects.toThrow('Failed to delete the game: Delete failed');
        });
    });

    describe('getGamesByAccessCode', () => {
        it('should find a game by access code', async () => {
            const result = await service.getGamesByAccessCode('1234');
            expect(model.findOne).toHaveBeenCalledWith({ accessCode: '1234' });
            expect(result).toEqual(mockGame);
        });

        it('should throw NotFoundException if game not found', async () => {
            model.findOne.mockReturnValueOnce({
                exec: jest.fn().mockResolvedValueOnce(null),
            } as unknown as Query<null, GamesDocument>);

            await expect(service.getGamesByAccessCode('invalidCode')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateGameAccessCode', () => {
        it('should update a game access code', async () => {
            const result = await service.updateGameAccessCode('gameId', '5678');
            expect(model.findByIdAndUpdate).toHaveBeenCalledWith('gameId', { accessCode: '5678' }, { new: true });
            expect(result).toEqual(result);
        });

        it('should throw NotFoundException if game not found', async () => {
            model.findByIdAndUpdate.mockReturnValueOnce({
                exec: jest.fn().mockResolvedValueOnce(null),
            } as unknown as Query<null, GamesDocument>);
        });
    });

    describe('generateAccessCode', () => {
        it('should generate a 4-digit access code', () => {
            const code = service.generateAccessCode();
            const ACCESS_CODE_SIZE = 4;
            expect(code).toHaveLength(ACCESS_CODE_SIZE);
            expect(/^\d{4}$/.test(code)).toBe(true);
        });
    });
});
