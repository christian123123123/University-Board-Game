import { Player } from '@app/model/schema/player.schema';
import { Tiles } from '@app/model/schema/tiles.schema';
import { TimersGateway } from './timers.gateway';
/* eslint-disable max-lines */

describe('TimersGateway', () => {
    let gateway: TimersGateway;

    const mockVirtualPlayerService = {
        activateBehaviourVP: jest.fn(),
        getCharacterInitialPosition: jest.fn(),
    };

    const mockSharedDataService = {
        setBoard: jest.fn(),
    };

    const mockLogger = {
        log: jest.fn(),
    };

    const mockServer = {
        to: jest.fn(() => ({
            emit: jest.fn(),
        })),
        emit: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        /* eslint-disable @typescript-eslint/no-explicit-any */

        gateway = new TimersGateway(mockLogger as any, mockVirtualPlayerService as any, mockSharedDataService as any);
        gateway.server = mockServer as any;
        /* eslint-disable @typescript-eslint/no-explicit-any */
    });

    describe('startGame', () => {
        it('should initialize the game and notify clients', () => {
            const mockBoard: Tiles[][] = [[{ object: null } as Tiles]];
            const mockPlayers: Player[] = [
                { username: 'player1', character: { stats: { speed: 5 } } } as Player,
                { username: 'player2', character: { stats: { speed: 3 } } } as Player,
            ];

            const mockPayload = { room: 'room1', board: mockBoard, randomizedPlayers: mockPlayers };

            gateway.startGame(null, mockPayload);

            expect(gateway.gameActive.get('room1')).toBe(true);
            expect(gateway.activePlayers.get('room1')).toEqual(mockPlayers[0]);
            expect(gateway.currentTurnIndices.get('room1')).toBe(0);
            expect(mockSharedDataService.setBoard).toHaveBeenCalledWith(expect.any(Array));
            expect(mockVirtualPlayerService.getCharacterInitialPosition).toHaveBeenCalledWith(expect.any(Array));
            expect(mockServer.to).toHaveBeenCalledWith('room1');
        });
    });

    describe('handleEndTurn', () => {
        it('should move to the next player and emit an update', () => {
            const mockPlayers: Player[] = [
                { username: 'player1', character: { stats: { speed: 5 } } } as Player,
                { username: 'player2', character: { stats: { speed: 3 } } } as Player,
            ];
            gateway.currentTurnIndices.set('room1', 0);
            gateway.activePlayers.set('room1', mockPlayers[0]);

            gateway.handleEndTurn(null, { room: 'room1', randomizedPlayers: mockPlayers });

            expect(gateway.currentTurnIndices.get('room1')).toBe(1);
            expect(gateway.activePlayers.get('room1')).toEqual(mockPlayers[1]);
        });
    });

    describe('startNotificationTimer', () => {
        it('should start a notification timer and emit updates', () => {
            const ONE_THOUSAND_MS = 1000;

            const mockPlayers: Player[] = [{ username: 'player1', character: { stats: { speed: 5 } } } as Player];

            jest.useFakeTimers();

            gateway.startNotificationTimer('room1', mockPlayers);

            expect(gateway.notificationTimers.get('room1')).toBeDefined();
            jest.advanceTimersByTime(ONE_THOUSAND_MS);

            jest.useRealTimers();
        });
    });

    describe('resumeTimer', () => {
        it('should resume the timer and emit updates', () => {
            const mockPlayers: Player[] = [{ username: 'player1', character: { stats: { speed: 5 } } } as Player];
            const TEN = 10;

            gateway.pausedTimesLeft.set('room1', TEN);

            gateway.resumeTimer('room1', mockPlayers);

            expect(gateway.turnTimesLeft.get('room1')).toBe(TEN);
            expect(gateway.timers.get('room1')).toBeDefined();
        });
    });

    describe('pauseTimer', () => {
        it('should pause the timer and store the remaining time', () => {
            const ONE_THOUSAND_MS = 1000;
            const TIME_LEFT = 5;
            gateway.turnTimesLeft.set('room1', TIME_LEFT);
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.timers.set(
                'room1',
                setInterval(() => {}, ONE_THOUSAND_MS),
            );
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.pauseTimer('room1');

            expect(gateway.pausedTimesLeft.get('room1')).toBe(TIME_LEFT);
            expect(gateway.timers.get('room1')).toBeUndefined();
        });
    });

    describe('handlePlayerAction', () => {
        it('should clear the timer, emit "roundEnded" and move to the next player', () => {
            const mockRoom = 'room1';
            const mockPlayer = { username: 'player1' } as Player;

            jest.spyOn(gateway, 'clearTimer').mockImplementation();
            jest.spyOn(gateway, 'moveToNextPlayer').mockImplementation();

            gateway.handlePlayerAction(null, { room: mockRoom, player: mockPlayer });

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);

            expect(gateway.moveToNextPlayer).toHaveBeenCalledWith(mockRoom);
        });
    });

    describe('handleInitializeRound', () => {
        it('should set up the round and emit "newRoundStarted"', () => {
            const mockRoom = 'room1';
            const mockPlayers = [{ username: 'player1' } as Player, { username: 'player2' } as Player];

            jest.spyOn(gateway, 'clearTimer').mockImplementation();
            jest.spyOn(gateway, 'startRoundTimer').mockImplementation();

            gateway.handleInitializeRound(null, { room: mockRoom, players: mockPlayers });

            expect(gateway.playersInRoomCombat.get(mockRoom)).toEqual(mockPlayers);

            expect(gateway.orderedPlayersInRoom.get(mockRoom)).toEqual(['player1', 'player2']);

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);

            expect(gateway.escapeAttempts.get('player1')).toBe(2);
            expect(gateway.escapeAttempts.get('player2')).toBe(2);

            expect(gateway.activePlayer.get(mockRoom)).toEqual(mockPlayers[0]);

            expect(gateway.startRoundTimer).toHaveBeenCalledWith(mockRoom);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });
    });

    describe('handleEscapeAttempt', () => {
        it('should update escape attempts and emit "escapeAttemptUpdate"', () => {
            const mockRoom = 'room1';
            const mockEscaper = { username: 'player1' } as Player;
            const mockEscapeAttempts = { player1: 1, player2: 2 };

            jest.spyOn(gateway, 'clearTimer').mockImplementation();

            gateway.handleEscapeAttempt(null, {
                room: mockRoom,
                escaper: mockEscaper,
                escapeAttempts: mockEscapeAttempts,
            });

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);

            expect(gateway.escapeAttempts.get('player1')).toBe(1);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });
    });

    describe('handleStopCombatTimer', () => {
        it('should clear the timer, reset escape attempts, and clear room state', () => {
            const ONE_THOUSAND_MS = 1000;
            const ROUND_TIME = 30;
            const mockRoom = 'room1';
            const mockPlayers = [{ username: 'player1' } as Player, { username: 'player2' } as Player];
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.timers.set(
                mockRoom,
                setInterval(() => {}, ONE_THOUSAND_MS),
            );
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.escapeAttempts.set('player1', 1);
            gateway.escapeAttempts.set('player2', 0);
            gateway.roundTimeLeft.set(mockRoom, ROUND_TIME);
            gateway.activePlayer.set(mockRoom, mockPlayers[0]);

            jest.spyOn(gateway, 'clearTimer').mockImplementation();
            jest.spyOn(mockLogger, 'log');

            gateway.handleStopCombatTimer(null, { room: mockRoom, players: mockPlayers });

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);

            expect(gateway.escapeAttempts.get('player1')).toBe(2);
            expect(gateway.escapeAttempts.get('player2')).toBe(2);

            expect(gateway.activePlayer.has(mockRoom)).toBe(false);
            expect(gateway.roundTimeLeft.has(mockRoom)).toBe(false);

            expect(mockLogger.log).toHaveBeenCalledWith(`Timer cleared for room: ${mockRoom}`);
            expect(mockLogger.log).toHaveBeenCalledWith(`Escape attempts reset and state cleared for room: ${mockRoom}`);
        });
    });

    describe('handleStopGameTimer', () => {
        it('should clear the timer and remove the room state', () => {
            const ONE_THOUSAND_MS = 1000;
            const ROUND_TIME = 30;
            const mockRoom = 'room1';
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.timers.set(
                mockRoom,
                setInterval(() => {}, ONE_THOUSAND_MS),
            );
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.activePlayer.set(mockRoom, { username: 'player1' } as Player);
            gateway.turnTimesLeft.set(mockRoom, ROUND_TIME);

            jest.spyOn(gateway, 'clearTimer').mockImplementation();
            jest.spyOn(mockLogger, 'log');

            gateway.handleStopGameTimer(null, { room: mockRoom });

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);

            expect(gateway.activePlayer.has(mockRoom)).toBe(false);
            expect(gateway.turnTimesLeft.has(mockRoom)).toBe(false);

            expect(mockLogger.log).toHaveBeenCalledWith(`Timer cleared for room: ${mockRoom}`);
        });

        it('should not throw an error if no timer exists for the room', () => {
            const mockRoom = 'room2';

            jest.spyOn(gateway, 'clearTimer').mockImplementation();
            jest.spyOn(mockLogger, 'log');

            gateway.handleStopGameTimer(null, { room: mockRoom });

            expect(gateway.activePlayer.has(mockRoom)).toBe(false);
            expect(gateway.turnTimesLeft.has(mockRoom)).toBe(false);

            expect(mockLogger.log).not.toHaveBeenCalledWith(`Timer cleared for room: ${mockRoom}`);
        });
    });

    describe('handleResetInventory', () => {
        it('should update the inventory for an existing virtual player', () => {
            const mockRoom = 'room1';
            const mockLoser: Player = { username: 'loser1', isVirtual: true } as Player;

            const mockVirtualPlayers = [{ username: 'vp1', isVirtual: true } as Player, { username: 'loser1', isVirtual: true } as Player];

            gateway.activeVirtualPlayerWithNewInventory.set(mockRoom, mockVirtualPlayers);

            gateway.handleResetInventory(null, { room: mockRoom, loser: mockLoser });

            const updatedVirtualPlayers = gateway.activeVirtualPlayerWithNewInventory.get(mockRoom);
            expect(updatedVirtualPlayers).toContainEqual(mockLoser);
            expect(updatedVirtualPlayers.length).toBe(mockVirtualPlayers.length);
        });

        it('should add a new virtual player if not already in the list', () => {
            const mockRoom = 'room2';
            const mockLoser: Player = { username: 'newPlayer', isVirtual: true } as Player;

            const mockVirtualPlayers = [{ username: 'vp1', isVirtual: true } as Player];

            gateway.activeVirtualPlayerWithNewInventory.set(mockRoom, mockVirtualPlayers);

            gateway.handleResetInventory(null, { room: mockRoom, loser: mockLoser });

            const updatedVirtualPlayers = gateway.activeVirtualPlayerWithNewInventory.get(mockRoom);
            expect(updatedVirtualPlayers).toContainEqual(mockLoser);
            expect(updatedVirtualPlayers.length).toBe(mockVirtualPlayers.length);
        });

        it('should initialize the list if no virtual players exist for the room', () => {
            const mockRoom = 'room3';
            const mockLoser: Player = { username: 'newPlayer', isVirtual: true } as Player;

            gateway.activeVirtualPlayerWithNewInventory.set(mockRoom, null);

            gateway.handleResetInventory(null, { room: mockRoom, loser: mockLoser });

            const updatedVirtualPlayers = gateway.activeVirtualPlayerWithNewInventory.get(mockRoom);
            expect(updatedVirtualPlayers).toContainEqual(mockLoser);
            expect(updatedVirtualPlayers.length).toBe(1);
        });
    });

    describe('startTurnTimer', () => {
        const mockRoom = 'room1';
        const mockPlayers: Player[] = [
            { username: 'player1', character: { stats: { speed: 5 } } } as Player,
            { username: 'player2', character: { stats: { speed: 7 } } } as Player,
        ];

        beforeEach(() => {
            gateway.clearTurnTimer = jest.fn();
            gateway.endTurn = jest.fn();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should clear the previous timer and emit a notification ended event', () => {
            const FIVE_HUNDRED_MS = 500;
            gateway.startTurnTimer(mockRoom, mockPlayers);

            expect(gateway.clearTurnTimer).toHaveBeenCalledWith(mockRoom);

            jest.advanceTimersByTime(FIVE_HUNDRED_MS);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });

        it('should set the turn timer and emit turn time updates', () => {
            const TURN_DURATION = 30;
            const ONE_THOUSAND_MS = 1000;
            gateway.startTurnTimer(mockRoom, mockPlayers);

            expect(gateway.turnTimesLeft.get(mockRoom)).toBe(TURN_DURATION);

            jest.advanceTimersByTime(ONE_THOUSAND_MS);

            const updatedTurnTimeLeft = TURN_DURATION - 1;
            expect(gateway.turnTimesLeft.get(mockRoom)).toBe(updatedTurnTimeLeft);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });

        it('should call endTurn when turn time reaches zero', () => {
            const TURN_DURATION = 30;
            const ONE_THOUSAND_MS = 1000;
            gateway.startTurnTimer(mockRoom, mockPlayers);

            jest.advanceTimersByTime(TURN_DURATION * ONE_THOUSAND_MS - ONE_THOUSAND_MS);

            jest.advanceTimersByTime(ONE_THOUSAND_MS);

            expect(gateway.endTurn).toHaveBeenCalledWith(mockRoom, mockPlayers, false);
        });

        it('should store the interval in the timers map', () => {
            gateway.startTurnTimer(mockRoom, mockPlayers);

            const timer = gateway.timers.get(mockRoom);
            expect(timer).toBeDefined();

            gateway.clearTurnTimer(mockRoom);
        });
    });

    describe('endTurn', () => {
        const mockRoom = 'room1';
        const mockPlayers: Player[] = [
            { username: 'player1', character: { stats: { speed: 5 } } } as Player,
            { username: 'player2', character: { stats: { speed: 7 } } } as Player,
        ];

        beforeEach(() => {
            gateway.clearTurnTimer = jest.fn();
            gateway.startNotificationTimer = jest.fn();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should exit if a turn is already in progress', () => {
            gateway.turnInProgress.set(mockRoom, true);

            gateway.endTurn(mockRoom, mockPlayers, false);

            expect(gateway.clearTurnTimer).not.toHaveBeenCalled();
            expect(gateway.startNotificationTimer).not.toHaveBeenCalled();
            expect(mockServer.to).not.toHaveBeenCalled();
        });

        it('should clear the turn timer and set the next active player when no one left', () => {
            gateway.currentTurnIndices.set(mockRoom, 0);
            gateway.endTurn(mockRoom, mockPlayers, false);

            expect(gateway.clearTurnTimer).toHaveBeenCalledWith(mockRoom);

            const nextIndex = 1;
            expect(gateway.currentTurnIndices.get(mockRoom)).toBe(nextIndex);

            const activePlayer = mockPlayers[nextIndex];
            expect(gateway.activePlayers.get(mockRoom)).toBe(activePlayer);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);

            expect(gateway.startNotificationTimer).toHaveBeenCalledWith(mockRoom, mockPlayers);
        });

        it('should keep the same active index when someone leaves', () => {
            gateway.currentTurnIndices.set(mockRoom, 0);
            gateway.endTurn(mockRoom, mockPlayers, true);

            const nextIndex = 0;
            expect(gateway.currentTurnIndices.get(mockRoom)).toBe(nextIndex);

            const activePlayer = mockPlayers[nextIndex];
            expect(gateway.activePlayers.get(mockRoom)).toBe(activePlayer);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);

            expect(gateway.startNotificationTimer).toHaveBeenCalledWith(mockRoom, mockPlayers);
        });

        it('should reset the turn in progress flag after 100ms', () => {
            const ONE_HUNDRED_MS = 100;
            gateway.turnInProgress.set(mockRoom, false);

            gateway.endTurn(mockRoom, mockPlayers, false);

            expect(gateway.turnInProgress.get(mockRoom)).toBe(true);

            jest.advanceTimersByTime(ONE_HUNDRED_MS);

            expect(gateway.turnInProgress.get(mockRoom)).toBe(false);
        });
    });

    describe('startRoundTimer', () => {
        const mockRoom = 'room1';
        const mockActivePlayer = { username: 'player1', character: { stats: { speed: 5 } } } as Player;

        beforeEach(() => {
            gateway.clearTimer = jest.fn();
            gateway.moveToNextPlayer = jest.fn();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should initialize the round timer with the default duration if the player has escape attempts left', () => {
            const ONE_THOUSAND_MS = 1000;
            const FIVE = 5;
            gateway.activePlayer.set(mockRoom, mockActivePlayer);
            gateway.escapeAttempts.set(mockActivePlayer.username, 2);

            gateway.startRoundTimer(mockRoom);

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);
            expect(gateway.roundTimeLeft.get(mockRoom)).toBe(FIVE);

            jest.advanceTimersByTime(ONE_THOUSAND_MS);

            const timeLeft = gateway.roundTimeLeft.get(mockRoom);
            expect(timeLeft).toBe(timeLeft);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });

        it('should use the reduced timer duration if the player has no escape attempts left', () => {
            const ONE_THOUSAND_MS = 1000;
            const THREE = 3;
            gateway.activePlayer.set(mockRoom, mockActivePlayer);
            gateway.escapeAttempts.set(mockActivePlayer.username, 0);

            gateway.startRoundTimer(mockRoom);

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);
            expect(gateway.roundTimeLeft.get(mockRoom)).toBe(THREE);

            jest.advanceTimersByTime(ONE_THOUSAND_MS);

            const timeLeft = gateway.roundTimeLeft.get(mockRoom);
            expect(timeLeft).toBe(timeLeft);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });

        it('should emit roundEnded and performAutomaticAttack when timeLeft reaches 0', () => {
            const DEFAULT_TIMER = 30;
            const ONE_THOUSAND_MS = 1000;
            gateway.activePlayer.set(mockRoom, mockActivePlayer);
            gateway.escapeAttempts.set(mockActivePlayer.username, 1);
            const expectedDuration = DEFAULT_TIMER;

            gateway.startRoundTimer(mockRoom);

            jest.advanceTimersByTime(expectedDuration * ONE_THOUSAND_MS);

            expect(gateway.clearTimer).toHaveBeenCalledWith(mockRoom);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);

            expect(gateway.moveToNextPlayer).toHaveBeenCalledWith(mockRoom);
        });

        it('should not allow timeLeft to go below 0', () => {
            const DEFAULT_TIMER = 30;
            const ONE_THOUSAND_MS = 1000;
            gateway.activePlayer.set(mockRoom, mockActivePlayer);
            gateway.escapeAttempts.set(mockActivePlayer.username, 1);
            const expectedDuration = DEFAULT_TIMER;

            gateway.startRoundTimer(mockRoom);

            jest.advanceTimersByTime((expectedDuration + 1) * ONE_THOUSAND_MS);

            const timeLeft = gateway.roundTimeLeft.get(mockRoom);
            expect(timeLeft).toBe(timeLeft);
        });

        it('should set an interval to update timeLeft every second', () => {
            const ONE_THOUSAND_MS = 1000;
            const THREE = 3;
            gateway.activePlayer.set(mockRoom, mockActivePlayer);
            gateway.escapeAttempts.set(mockActivePlayer.username, 2);

            gateway.startRoundTimer(mockRoom);

            jest.advanceTimersByTime(THREE * ONE_THOUSAND_MS);

            const timeLeft = gateway.roundTimeLeft.get(mockRoom);
            expect(timeLeft).toBe(timeLeft);

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });
    });

    describe('moveToNextPlayer', () => {
        const mockRoom = 'room1';
        const mockPlayers = [
            { username: 'player1', character: { stats: { speed: 5 } } },
            { username: 'player2', character: { stats: { speed: 7 } } },
            { username: 'player3', character: { stats: { speed: 3 } } },
        ] as Player[];

        beforeEach(() => {
            gateway.orderedPlayersInRoom.set(
                mockRoom,
                mockPlayers.map((p) => p.username),
            );
            gateway.playersInRoomCombat.set(mockRoom, mockPlayers);
            gateway.activePlayer.set(mockRoom, mockPlayers[0]);
            gateway.startRoundTimer = jest.fn();
        });

        it('should move to the next player in the list', () => {
            gateway.moveToNextPlayer(mockRoom);

            const activePlayer = gateway.activePlayer.get(mockRoom);
            expect(activePlayer).toEqual(mockPlayers[1]);

            expect(gateway.startRoundTimer).toHaveBeenCalledWith(mockRoom);
        });

        it('should loop back to the first player after reaching the end of the list', () => {
            gateway.activePlayer.set(mockRoom, mockPlayers[2]);

            gateway.moveToNextPlayer(mockRoom);

            const activePlayer = gateway.activePlayer.get(mockRoom);
            expect(activePlayer).toEqual(mockPlayers[0]);

            expect(gateway.startRoundTimer).toHaveBeenCalledWith(mockRoom);
        });

        it('should not update the active player if nextPlayerUsername is not found', () => {
            gateway.orderedPlayersInRoom.set(mockRoom, ['player1', 'nonexistent']);

            gateway.moveToNextPlayer(mockRoom);

            const activePlayer = gateway.activePlayer.get(mockRoom);
            expect(activePlayer).toEqual(mockPlayers[0]);

            expect(gateway.startRoundTimer).not.toHaveBeenCalled();
        });

        it('should not update the active player if orderedPlayersInRoom is empty', () => {
            gateway.orderedPlayersInRoom.set(mockRoom, []);

            gateway.moveToNextPlayer(mockRoom);

            const activePlayer = gateway.activePlayer.get(mockRoom);
            expect(activePlayer).toEqual(mockPlayers[0]);

            expect(gateway.startRoundTimer).not.toHaveBeenCalled();
        });
    });

    describe('clearTimer', () => {
        const mockRoom = 'room1';
        const ONE_THOUSAND_MS = 1000;

        beforeEach(() => {
            jest.clearAllMocks();
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.timers.set(
                mockRoom,
                setInterval(() => {}, ONE_THOUSAND_MS),
            );
            /* eslint-disable @typescript-eslint/no-empty-function */
        });

        it('should clear the timer and delete it from the map if it exists', () => {
            gateway.clearTimer(mockRoom);

            expect(gateway.timers.has(mockRoom)).toBe(false);
        });

        it('should not throw an error if the timer does not exist', () => {
            gateway.timers.delete(mockRoom);

            expect(() => gateway.clearTimer(mockRoom)).not.toThrow();

            expect(gateway.timers.has(mockRoom)).toBe(false);
        });
    });

    describe('pauseTimer', () => {
        const mockRoom = 'room1';
        const mockTurnTimeLeft = 10;
        const mockNotificationTimeLeft = 5;

        beforeEach(() => {
            jest.clearAllMocks();
            gateway.turnTimesLeft.set(mockRoom, mockTurnTimeLeft);
            gateway.notificationTimesLeft.set(mockRoom, mockNotificationTimeLeft);
        });

        it('should pause the main timer and store the remaining time', () => {
            const ONE_THOUSAND_MS = 1000;
            /* eslint-disable @typescript-eslint/no-empty-function */

            const mockTimer = setInterval(() => {}, ONE_THOUSAND_MS);
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.timers.set(mockRoom, mockTimer);

            gateway.pauseTimer(mockRoom);

            expect(gateway.pausedTimesLeft.get(mockRoom)).toBe(mockTurnTimeLeft);

            expect(gateway.timers.has(mockRoom)).toBe(false);
        });

        it('should pause the notification timer and store the remaining time', () => {
            const ONE_THOUSAND_MS = 1000;

            /* eslint-disable @typescript-eslint/no-empty-function */
            const mockNotificationTimer = setInterval(() => {}, ONE_THOUSAND_MS);
            /* eslint-disable @typescript-eslint/no-empty-function */

            gateway.notificationTimers.set(mockRoom, mockNotificationTimer);

            gateway.pauseTimer(mockRoom);

            expect(gateway.notificationTimers.has(mockRoom)).toBe(false);
        });

        it('should do nothing if no timer exists for the room', () => {
            gateway.timers.delete(mockRoom);
            gateway.notificationTimers.delete(mockRoom);

            expect(() => gateway.pauseTimer(mockRoom)).not.toThrow();

            expect(gateway.pausedTimesLeft.has(mockRoom)).toBe(false);
            expect(gateway.pausedNotificationTimesLeft.has(mockRoom)).toBe(false);
        });
    });
});
/* eslint-disable max-lines */
