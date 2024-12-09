import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema()
export class Stats extends Document {
    @ApiProperty({ example: '5', description: 'Players health' })
    @Prop({ required: true })
    health: number;

    @ApiProperty({ example: '5', description: 'Players speed' })
    @Prop({ required: true })
    speed: number;

    @ApiProperty({ example: '5', description: 'Players attack rating' })
    @Prop({ required: true })
    attack: number;

    @ApiProperty({ example: '5', description: 'Players defense rating' })
    @Prop({ required: true })
    defense: number;
}

export const STATS_SCHEMA = SchemaFactory.createForClass(Stats);
