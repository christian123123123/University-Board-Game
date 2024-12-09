import { Tiles } from '@app/model/schema/tiles.schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class CreateGame {
    @ApiProperty({ example: 'Test' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Large' })
    @IsString()
    mapSize: string;

    @ApiProperty({ example: 'Normal' })
    @IsString()
    mode: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    visibility: boolean;

    @ApiProperty({ example: 'Description' })
    @IsString()
    description: string;

    @ApiProperty({ example: 'Board' })
    @IsArray()
    board: Tiles[][];
}
