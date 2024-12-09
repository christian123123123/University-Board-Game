import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CombatGateway } from './gateways/combat/combat.gateway';
import { ItemsGateway } from './gateways/items/items.gateway';
import { MatchBoardGateway } from './gateways/match-board/match-board.gateway';
import { TimersGateway } from './gateways/timers/timers.gateway';
import { GamesModule } from './modules/games/games.module';
import { SharedModule } from './modules/games/shared.module';

import { InventoryService } from './services/inventory/inventory.service';
import { MovementService } from './services/movement/movement.service';
import { RoomsService } from './services/rooms/rooms.service';
import { TurnSystemService } from './services/turn-system/turn-system.service';
import { UsersService } from './services/users/users.service';
import { VirtualPlayerService } from './services/virtual-player/games/virtual-player.service';

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), MongooseModule.forRoot(process.env.DATABASE_CONNECTION_STRING), GamesModule, SharedModule],
    controllers: [],
    providers: [
        ChatGateway,

        Logger,
        UsersService,
        RoomsService,
        TimersGateway,
        CombatGateway,
        MatchBoardGateway,
        ItemsGateway,
        VirtualPlayerService,
        TurnSystemService,
        InventoryService,
        MovementService,
    ],
})
export class AppModule {}
