import { TestBed } from '@angular/core/testing';
import { Character } from '@app/interfaces/Character';
import { Player } from '@app/interfaces/Player';
import { MovementService } from '@app/services/match/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { TurnSystemService } from './turn-system.service';

describe('TurnSystemService', () => {
    let service: TurnSystemService;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockSharedService: jasmine.SpyObj<SharedDataService>;
    let mockMovementService: jasmine.SpyObj<MovementService>;

    const MOCK_CHARACTER: Character = {
        name: 'Test Character',
        image: 'test-image.png',
        face: 'test-face.png',
        body: 'test-body.png',
        stats: {
            health: 100,
            speed: 10,
            attack: 15,
            defense: 5,
        },
        dice: '1d6',
        victories: 0,
        position: null,
        initialPosition: null,
    };

    const MOCK_PLAYERS: Player[] = [
        { username: 'Player1', character: MOCK_CHARACTER, isAdmin: true, inventory: [null, null] },
        { username: 'Player2', character: MOCK_CHARACTER, isAdmin: false, inventory: [null, null] },
    ];

    beforeEach(() => {
        // Correctly set up the spies with the method names to mock
        mockSocketService = jasmine.createSpyObj('SocketService', ['emit', 'on', 'off', 'disconnect']);
        mockSharedService = jasmine.createSpyObj('SharedDataService', ['setPlayer', 'getDebugModeStatus']);
        mockMovementService = jasmine.createSpyObj('MovementService', ['updatePlayerSpeed']);

        // Initialize the TestBed configuration only once
        TestBed.configureTestingModule({
            providers: [
                TurnSystemService,
                { provide: SocketService, useValue: mockSocketService },
                { provide: SharedDataService, useValue: mockSharedService },
                { provide: MovementService, useValue: mockMovementService },
            ],
        });

        service = TestBed.inject(TurnSystemService);
        service.initialize(MOCK_PLAYERS); // Initialize the service before each test
    });

    describe('TurnSystemService - initialize', () => {
        it('should reinitialize turnOrder if forceReinitialize is true', () => {
            const newPlayers: Player[] = [
                ...MOCK_PLAYERS,
                { username: 'Player3', character: MOCK_CHARACTER, isAdmin: false, inventory: [null, null] },
            ];
            service.initialize(newPlayers, true); // force reinitialize
            expect(service.turnOrder).toEqual(newPlayers); // check if turnOrder is reinitialized
        });

        it('should not reinitialize turnOrder if already initialized and forceReinitialize is false', () => {
            const newPlayers: Player[] = [
                ...MOCK_PLAYERS,
                { username: 'Player3', character: MOCK_CHARACTER, isAdmin: false, inventory: [null, null] },
            ];
            service.initialize(newPlayers); // no force reinitialize
            expect(service.turnOrder).toEqual(MOCK_PLAYERS); // check if turnOrder is unchanged
        });
    });

    describe('initializeCombat', () => {
        it('should set roundOrder and reset currentRoundIndex', () => {
            service.initializeCombat(MOCK_PLAYERS, 'Room1');
            expect(service.roundOrder).toEqual(MOCK_PLAYERS); // roundOrder should be set
            expect(service.currentRoundIndex).toBe(0); // currentRoundIndex should be reset
        });
    });

    describe('canPerformAction', () => {
        it('should return true if action is not used', () => {
            service.resetAction();
            expect(service.canPerformAction()).toBeTrue(); // check if action can be performed
        });

        it('should return false if action is already used', () => {
            service.useAction();
            expect(service.canPerformAction()).toBeFalse(); // check if action can't be performed after use
        });
    });

    describe('useAction', () => {
        it('should set actionUsed to true', () => {
            service.useAction();
            expect(service.actionUsed).toBeTrue(); // check if actionUsed is true
        });
    });

    describe('resetAction', () => {
        it('should reset actionUsed to false', () => {
            service.useAction();
            service.resetAction();
            expect(service.actionUsed).toBeFalse(); // check if actionUsed is reset to false
        });
    });

    describe('removePlayerFromTurnOrder', () => {
        beforeEach(() => {
            service.initialize(MOCK_PLAYERS); // Initialize with the mock players
        });

        it('should reset currentTurnIndex to 0 if it exceeds the turnOrder length', () => {
            service.currentTurnIndex = 2; // Set currentTurnIndex beyond the length of turnOrder
            service.removePlayerFromTurnOrder('Player2'); // Remove Player2
            expect(service.currentTurnIndex).toBe(0); // Check if currentTurnIndex is reset to 0
        });

        it('should decrement currentTurnIndex if the removed player is before the active turn', () => {
            service.currentTurnIndex = 1; // Set currentTurnIndex to 1 (after Player1)
            service.removePlayerFromTurnOrder('Player1'); // Remove Player1
            expect(service.currentTurnIndex).toBe(0); // Check if currentTurnIndex is decremented
        });

        it('should do nothing if the player is not found', () => {
            const initialTurnOrder = [...service.turnOrder]; // Store the initial turnOrder
            service.removePlayerFromTurnOrder('NonExistentPlayer'); // Attempt to remove a non-existent player
            expect(service.turnOrder).toEqual(initialTurnOrder); // Ensure the turnOrder is unchanged
        });
    });
});
