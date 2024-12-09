import { CreateGame } from '@app/model/dto/course/createGame.dto';
import { Games, GamesDocument } from '@app/model/schema/games.schema';
import { GamesService } from '@app/services/games/games.service';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Games')
@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) {}
    @ApiOkResponse({
        description: 'Display all the games from the db in the list',
        type: Games,
    })
    @Get('/getGames')
    async getAllGames() {
        return this.gamesService.getGames();
    }

    @ApiOkResponse({
        description: 'Returns game by id',
        type: Games,
    })
    @Get('/:id')
    async getGame(@Param('id') gameId: string): Promise<Games> {
        const game = await this.gamesService.getGameById(gameId);
        if (!game) {
            throw new NotFoundException(`Game with ID ${gameId} not found.`);
        }
        return game;
    }

    @Get('/join/:accessCode')
    async joinGameByAccessCode(@Param('accessCode') accessCode: string) {
        const game = await this.gamesService.getGamesByAccessCode(accessCode);
        if (!game) {
            throw new NotFoundException(`Game with access code ${accessCode} not found.`);
        }
        return game;
    }

    @ApiOkResponse({
        description: 'Generate access code for the game',
        type: Games,
    })
    @Patch('/:id/generate-access-code')
    async generateAccessCode(@Param('id') gameId: string): Promise<Games> {
        const accessCode = this.gamesService.generateAccessCode();
        return this.gamesService.updateGameAccessCode(gameId, accessCode);
    }

    @ApiCreatedResponse({
        description: 'Create a game',
        type: Games,
    })
    @Post('/create')
    async create(@Body() createdGame: CreateGame) {
        return this.gamesService.createGame(createdGame);
    }

    @ApiOkResponse({
        description: 'Updates the game details',
        type: Games,
    })
    @Patch('/:id/update')
    async updateGame(@Param('id') gameId: string, @Body() updatedGame: GamesDocument) {
        return this.gamesService.updateGameDetails(gameId, updatedGame);
    }

    @ApiOkResponse({
        description: 'Deletes game',
        type: Games,
    })
    @Delete('/:id')
    async delete(@Param('id') gameId: string) {
        return this.gamesService.deleteGame(gameId);
    }
}
