import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { Stats, STATS_SCHEMA } from './stats.schema';

@Schema()
export class Character extends Document {
    @ApiProperty({ example: 'Avatar', description: 'Name of the player' })
    @Prop({ required: true })
    name: string;

    @ApiProperty({ example: 'AvatarBody', description: 'Image of the players body' })
    @Prop({ required: true })
    image: string;

    @ApiProperty({ example: 'AvatarFace', description: 'Image of the players face' })
    @Prop({ required: true })
    face: string;

    @ApiProperty({ example: 'AvatarTop', description: 'Image of the players from top' })
    @Prop({ required: true })
    body: string;

    @ApiProperty({ type: Stats, description: 'The mode of the game' })
    @Prop({ type: STATS_SCHEMA, required: true })
    stats: Stats;

    @ApiProperty({ description: 'Dice used for the game' })
    @Prop({ required: true })
    dice: string;

    @ApiProperty({ description: 'Victories from combats' })
    @Prop({ required: true })
    victories: number;

    @ApiProperty({ description: 'Losses from combats' })
    @Prop({ required: true })
    losses: number;

    @ApiProperty({ description: 'Number of combats' })
    @Prop({ required: true })
    combats: number;

    @ApiProperty({ description: 'Number of escapes' })
    @Prop({ required: true })
    escapes: number;

    @ApiProperty({ description: 'Number of objects' })
    @Prop({ required: true })
    objectCount: number;

    @ApiProperty({ description: 'Number of tiles visited' })
    @Prop({ required: true })
    tilesVisited: { row: number; col: number }[];

    @ApiProperty({ description: 'points Taken' })
    @Prop({ required: true })
    pointsTaken: number;

    @ApiProperty({ description: 'points Lost' })
    @Prop({ required: true })
    pointsLost: number;

    @ApiProperty({ example: { row: 0, col: 0 } })
    @Prop({ required: true, type: { row: Number, col: Number } })
    position: { row: number; col: number };

    @ApiProperty({ example: 'assets/power-fruit.png' })
    @Prop({ required: false })
    effects: string[];

    @ApiProperty({ example: 'true' })
    @Prop({ required: false })
    hasFlag: boolean;
}

export const CHARACTER_SCHEMA = SchemaFactory.createForClass(Character);
