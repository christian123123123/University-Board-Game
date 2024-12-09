import { GamesController } from '@app/controllers/games/games.controller';
import { Games, GAMES_SCHEMA } from '@app/model/schema/games.schema';
import { GamesService } from '@app/services/games/games.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [MongooseModule.forFeature([{ name: Games.name, schema: GAMES_SCHEMA }])],
    controllers: [GamesController],
    providers: [GamesService],
})
export class GamesModule {}
