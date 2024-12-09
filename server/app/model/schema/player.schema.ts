import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { Character, CHARACTER_SCHEMA } from './character.schema';

@Schema()
export class Player extends Document {
    @ApiProperty({ example: 'Alex', description: 'Name of the user' })
    @Prop({ required: true })
    username: string;

    @ApiProperty({ type: Character, description: 'The players character' })
    @Prop({ type: CHARACTER_SCHEMA, required: true })
    character: Character;

    @ApiProperty({ description: 'Determines if a player is the admin of the game' })
    @Prop({ required: true })
    isAdmin: boolean;

    @ApiProperty({ description: 'Determines if a player is a virtual player' })
    @Prop({ required: true })
    isVirtual: boolean;

    @ApiProperty({ description: 'The items the player holds' })
    @Prop({ required: true })
    inventory: string[];

    @ApiProperty({ example: 'Agressif', description: 'State of the virtual player' })
    @Prop({ required: true })
    profile: string;

    @ApiProperty({ example: '4', description: 'Remaining speed of the virtual player' })
    @Prop({ required: true })
    remainingSpeed: number;
}

export const PLAYER_SCHEMA = SchemaFactory.createForClass(Player);
