import { Tiles } from '@app/model/schema/tiles.schema';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SharedDataService {
    private board: Tiles[][];

    setBoard(gameBoard: Tiles[][]) {
        this.board = gameBoard;
    }

    getBoard(): Tiles[][] {
        return this.board;
    }
}
