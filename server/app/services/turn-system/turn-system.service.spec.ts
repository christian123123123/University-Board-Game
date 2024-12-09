import { MovementService } from '@app/services/movement/movement.service';
import { TurnSystemService } from './turn-system.service';

describe('TurnSystemService', () => {
    let service: TurnSystemService;
    let mockMovementService: MovementService;

    beforeEach(() => {
        mockMovementService = {} as MovementService;
        service = new TurnSystemService(mockMovementService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('canPerformAction', () => {
        it('should return true if action has not been used', () => {
            service.actionUsed = false;
            expect(service.canPerformAction()).toBe(true);
        });

        it('should return false if action has been used', () => {
            service.actionUsed = true;
            expect(service.canPerformAction()).toBe(false);
        });
    });

    describe('useAction', () => {
        it('should set actionUsed to true', () => {
            service.actionUsed = false;
            service.useAction();
            expect(service.actionUsed).toBe(true);
        });
    });
});
