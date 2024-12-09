import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';

export type TilesDocument = HydratedDocument<Tiles>;

@Schema({ timestamps: true })
export class Tiles extends Document {
    @ApiProperty({ example: 'moon' })
    @Prop({ required: false, default: '' })
    fieldTile: string;

    @ApiProperty({ example: 'apple' })
    @Prop({ required: false, default: '' })
    object: string;

    @ApiProperty({ example: 'avatar' })
    @Prop({ required: false, default: '' })
    avatar: string;

    @ApiProperty({ example: false })
    @Prop({ required: false, default: false })
    door: boolean;

    @ApiProperty({ example: false })
    @Prop({ required: false, default: false })
    wall: boolean;

    @ApiProperty({ example: true })
    @Prop({ required: false, default: false })
    isTileSelected: boolean;

    @ApiProperty({ example: { row: 0, col: 0 } })
    @Prop({ required: false, type: { row: Number, col: Number } })
    position: { row: number; col: number };
}

export const TILES_SCHEMA = SchemaFactory.createForClass(Tiles);
