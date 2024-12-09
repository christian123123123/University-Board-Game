import { Games } from '@app/model/schema/games.schema';
import { GamesService } from '@app/services/games/games.service';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';

describe('GamesController', () => {
    let controller: GamesController;
    let gamesService: jest.Mocked<GamesService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GamesController],
            providers: [
                {
                    provide: GamesService,
                    useValue: {
                        getGames: jest.fn(),
                        getGameById: jest.fn(),
                        getGamesByAccessCode: jest.fn(),
                        generateAccessCode: jest.fn(),
                        updateGameAccessCode: jest.fn(),
                        createGame: jest.fn(),
                        updateGameDetails: jest.fn(),
                        deleteGame: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<GamesController>(GamesController);
        gamesService = module.get<GamesService, jest.Mocked<GamesService>>(GamesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAllGames', () => {
        it('should throw NotFoundException if game not found', async () => {
            gamesService.getGameById.mockResolvedValue(null);

            await expect(controller.getGame('gameId')).rejects.toThrow(NotFoundException);
            expect(gamesService.getGameById).toHaveBeenCalledWith('gameId');
        });
    });

    describe('joinGameByAccessCode', () => {
        it('should return a game by access code', async () => {
            const mockGame = {} as Games;
            gamesService.getGamesByAccessCode.mockResolvedValue(mockGame);

            const result = await controller.joinGameByAccessCode('accessCode');
            expect(result).toEqual(mockGame);
            expect(gamesService.getGamesByAccessCode).toHaveBeenCalledWith('accessCode');
        });

        it('should throw NotFoundException if game not found by access code', async () => {
            gamesService.getGamesByAccessCode.mockResolvedValue(null);

            await expect(controller.joinGameByAccessCode('accessCode')).rejects.toThrow(NotFoundException);
            expect(gamesService.getGamesByAccessCode).toHaveBeenCalledWith('accessCode');
        });
    });

    describe('generateAccessCode', () => {
        it('should generate and update the access code for a game', async () => {
            const mockGame = {} as Games;
            gamesService.generateAccessCode.mockReturnValue('1234');
            gamesService.updateGameAccessCode.mockResolvedValue(mockGame);

            const result = await controller.generateAccessCode('gameId');
            expect(result).toEqual(mockGame);
            expect(gamesService.generateAccessCode).toHaveBeenCalled();
            expect(gamesService.updateGameAccessCode).toHaveBeenCalledWith('gameId', '1234');
        });
    });
    describe('delete', () => {
        it('should delete a game', async () => {
            gamesService.deleteGame.mockResolvedValue(undefined);

            await controller.delete('gameId');
            expect(gamesService.deleteGame).toHaveBeenCalledWith('gameId');
        });
    });
});
