import { GamesController } from '@app/controllers/games/games.controller';
import { Games, GAMES_SCHEMA } from '@app/model/schema/games.schema';
import { GamesService } from '@app/services/games/games.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { GamesModule } from './games.module';

describe('GamesModule', () => {
    let module: TestingModule;
    let gamesService: GamesService;
    let gamesController: GamesController;
    let gamesModel: Model<Games>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [MongooseModule.forFeature([{ name: Games.name, schema: GAMES_SCHEMA }]), GamesModule],
        })
            .overrideProvider(getModelToken(Games.name))
            .useValue(jest.fn())
            .compile();

        gamesService = module.get<GamesService>(GamesService);
        gamesController = module.get<GamesController>(GamesController);
        gamesModel = module.get<Model<Games>>(getModelToken(Games.name));
    });

    it('should import the module successfully', async () => {
        expect(module).toBeDefined();
    });

    it('should have the GamesService', () => {
        expect(gamesService).toBeDefined();
    });

    it('should have the GamesController', () => {
        expect(gamesController).toBeDefined();
    });

    it('should have the Games model injected', () => {
        expect(gamesModel).toBeDefined();
    });
});
