import { MovementService } from '@app/services/movement/movement.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TurnSystemService {
    actionUsed = false;

    constructor(readonly movementService: MovementService) {}
    canPerformAction(): boolean {
        return !this.actionUsed;
    }
    useAction(): void {
        this.actionUsed = true;
    }
}
