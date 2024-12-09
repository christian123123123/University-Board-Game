import { Games, GamesDocument } from '@app/model/schema/games.schema';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GamesService {
    http: unknown;
    private readonly logger = new Logger(GamesService.name);
    constructor(@InjectModel(Games.name) private gamesModel: Model<Games>) {}
    async createGame(gameData: Partial<Games>): Promise<Games> {
        try {
            const createdGame = new this.gamesModel({
                ...gameData,
            });
            return await createdGame.save();
        } catch (error) {
            this.logger.error('Error creating game', error.stack);
            throw new InternalServerErrorException(`Failed to create game: ${error.message}`);
        }
    }

    async getGames(): Promise<GamesDocument[]> {
        try {
            return await this.gamesModel.find().exec();
        } catch (error) {
            throw new Error(`Failed to get the games from the db: ${error.message}`);
        }
    }

    async getGameById(gameId: string): Promise<Games> {
        try {
            return await this.gamesModel.findById(gameId).exec();
        } catch (error) {
            throw new Error(`Failed fetch the selected games details: ${error.message}`);
        }
    }

    async updateGameDetails(gameId: string, updatedGame: Partial<Games>): Promise<Games> {
        try {
            return await this.gamesModel.findByIdAndUpdate(gameId, updatedGame, { new: true }).exec();
        } catch (error) {
            throw new Error(`Failed to update the game: ${error.message}`);
        }
    }

    async deleteGame(gameId: string): Promise<void> {
        try {
            await this.gamesModel.findByIdAndDelete(gameId).exec();
        } catch (error) {
            throw new Error(`Failed to delete the game: ${error.message}`);
        }
    }

    async getGamesByAccessCode(accessCode: string): Promise<Games> {
        const game = await this.gamesModel.findOne({ accessCode }).exec();
        if (!game) {
            throw new NotFoundException(`Game with access code ${accessCode} not found`);
        }
        return game;
    }

    async updateGameAccessCode(gameId: string, accessCode: string): Promise<Games> {
        const updatedGame = await this.gamesModel.findByIdAndUpdate(gameId, { accessCode }, { new: true });
        if (!updatedGame) {
            throw new NotFoundException(`Game with ID ${gameId} not found`);
        }
        return updatedGame;
    }

    generateAccessCode(): string {
        const LENGTH = 4;
        const CHARS = '0123456789';
        let code = '';
        for (let i = 0; i < LENGTH; i++) {
            const RANDOMINDEX: number = Math.floor(Math.random() * CHARS.length);
            code += CHARS.charAt(RANDOMINDEX);
        }
        return code;
    }
}
