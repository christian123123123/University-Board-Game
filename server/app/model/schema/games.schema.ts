import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';
import { Tiles } from './tiles.schema';

export type GamesDocument = HydratedDocument<Games>;

@Schema({ timestamps: true, collection: 'Games' })
export class Games extends Document {
    @ApiProperty({ example: 'Test', description: 'The title of the game' })
    @Prop({ required: true })
    title: string;

    @ApiProperty({ example: 'Large', description: 'The size of the game map' })
    @Prop({ required: true })
    mapSize: string;

    @ApiProperty({ example: 'Normal', description: 'The mode of the game' })
    @Prop({ required: true })
    mode: string;

    @ApiProperty({ example: true, description: 'Visibility status of the game' })
    @Prop({ required: true })
    visibility: boolean;

    @ApiProperty({ example: 'Description', description: 'The description of the game' })
    @Prop({ required: true })
    description: string;

    @ApiProperty({ example: 'Board', description: 'board details' })
    @Prop({ require: true })
    board: Tiles[][];

    @ApiProperty({ example: '2024-09-20T12:34:56Z', description: 'Last updated timestamp', type: Date })
    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}

export const GAMES_SCHEMA = SchemaFactory.createForClass(Games);
