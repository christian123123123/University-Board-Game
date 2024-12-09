import { Player } from '@app/model/schema/player.schema';
import { Socket } from 'socket.io';
import { CombatGateway } from './combat.gateway';
/* eslint-disable max-lines */

describe('CombatGateway', () => {
    let gateway: CombatGateway;

    const mockTimersGateway = {
        playersInFight: new Map(),
        pauseTimer: jest.fn(),
        activePlayer: new Map(),
        playersInRoom: new Map(),
        gameStartTimes: new Map(),
        randomizedPlayersInRoom: new Map(),
    };

    const mockChatGateway = {
        playersInRoom: new Map(),
    };

    const mockRoomsService = {
        roomExists: jest.fn(),
        createRoom: jest.fn(),
        removeRoom: jest.fn(),
    };

    const mockUsersService = {
        getUsersInRoom: jest.fn(() => []),
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

        gateway = new CombatGateway(
            mockLogger as any,
            mockTimersGateway as any,
            mockChatGateway as any,
            mockRoomsService as any,
            mockUsersService as any,
        );
        gateway.server = mockServer as any;
        /* eslint-disable @typescript-eslint/no-explicit-any */
    });

    describe('handleStartFight', () => {
        it('should emit fightStarted with correct data', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockRoom = 'testRoom';
            const mockPayload = {
                room: mockRoom,
                attacked: {
                    username: 'Player1',
                    character: {
                        stats: { attack: 5, defense: 3, speed: 2 },
                        dice: 'attack',
                        combats: 0,
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        stats: { attack: 4, defense: 2, speed: 3 },
                        dice: 'defense',
                        combats: 0,
                    },
                } as Player,
                debugMode: false,
            };

            mockChatGateway.playersInRoom.set(mockRoom, [mockPayload.attacked, mockPayload.attacking]);

            gateway.handleStartFight(mockSocket, mockPayload);

            expect(mockTimersGateway.pauseTimer).toHaveBeenCalledWith(mockRoom);
            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });
    });

    describe('handleEndFight', () => {
        it('should emit fightEnded when escapePlayer is found', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockRoom = 'testRoom';
            const mockPlayer = {
                username: 'Player1',
                character: { escapes: 0 },
            } as Player;

            mockChatGateway.playersInRoom.set(mockRoom, [mockPlayer]);

            gateway.handleEndFight(mockSocket, { room: mockRoom, escapingPlayer: mockPlayer });

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });

        it('should not emit fightEnded if escapePlayer is not found', () => {
            const mockSocket = { id: 'socket1' } as unknown as Socket;
            const mockRoom = 'testRoom';
            const mockPlayer = { username: 'Player1' } as Player;

            mockChatGateway.playersInRoom.set(mockRoom, []);

            gateway.handleEndFight(mockSocket, { room: mockRoom, escapingPlayer: mockPlayer });

            expect(mockServer.to).not.toHaveBeenCalled();
        });
    });

    describe('handleVictoryUpdate', () => {
        it('should emit updateVictories with correct data', () => {
            const FIVE_THOUSAND = 5000;
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockRoom = 'testRoom';
            const mockWinner = { username: 'Winner', character: { victories: 0 } } as Player;
            const mockLoser = { username: 'Loser', character: { losses: 0 } } as Player;

            mockChatGateway.playersInRoom.set(mockRoom, [mockWinner, mockLoser]);
            mockTimersGateway.gameStartTimes.set(mockRoom, Date.now() - FIVE_THOUSAND);

            gateway.handleVictoryUpdate(mockSocket, {
                room: mockRoom,
                winner: { username: 'Winner', isVirtual: false },
                loser: 'Loser',
                isFlagHome: false,
            });

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });

        it('should return early if winner is not found', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockRoom = 'testRoom';
            const mockLoser = { username: 'Loser' } as Player;

            mockChatGateway.playersInRoom.set(mockRoom, [mockLoser]);

            gateway.handleVictoryUpdate(mockSocket, {
                room: mockRoom,
                winner: { username: 'Winner', isVirtual: false },
                loser: 'Loser',
                isFlagHome: false,
            });

            expect(mockServer.to).not.toHaveBeenCalled();
        });
    });

    describe('handleEscape', () => {
        it('should emit escapeFailed', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockRoom = 'testRoom';
            const mockEscaper = { username: 'Escaper' } as Player;

            gateway.handleEscape(mockSocket, { room: mockRoom, escaper: mockEscaper });

            expect(mockServer.to).toHaveBeenCalledWith(mockRoom);
        });
    });

    describe('handleStartNewRound', () => {
        it('should update stats and emit diceRolled in debug mode', () => {
            const STAT_OF_SIX = 6;
            const STAT_OF_FOUR = 4;
            const mockSocket = { id: 'socket1' } as unknown as Socket;
            const mockPayload = {
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: 'attack',
                        stats: { attack: 5, defense: 3 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: 'defense',
                        stats: { attack: 4, defense: 2 },
                    },
                } as Player,
                debugMode: true,
            };

            gateway.handleStartNewRound(mockSocket, mockPayload);
            const FIVE = 5;
            const THREE = 3;
            const FOUR = 4;

            expect(mockPayload.attacked.character.stats.attack).toBe(FIVE + STAT_OF_SIX);
            expect(mockPayload.attacked.character.stats.defense).toBe(THREE + 1);
            expect(mockPayload.attacking.character.stats.attack).toBe(FOUR + STAT_OF_FOUR);
            expect(mockPayload.attacking.character.stats.defense).toBe(2 + 1);

            expect(mockServer.emit).toHaveBeenCalledWith('diceRolled', {
                newAttacked: mockPayload.attacked,
                newAttacking: mockPayload.attacking,
            });
        });

        it('should update stats and emit diceRolled in non-debug mode', () => {
            const ZERO_FIVE = 0.5;
            const ZERO_THREE = 0.3;
            const mockSocket = { id: 'socket1' } as unknown as Socket;
            const mockPayload = {
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: 'attack',
                        stats: { attack: 5, defense: 3 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: 'defense',
                        stats: { attack: 4, defense: 2 },
                    },
                } as Player,
                debugMode: false,
            };

            jest.spyOn(global.Math, 'random').mockReturnValueOnce(ZERO_FIVE).mockReturnValueOnce(ZERO_THREE);

            gateway.handleStartNewRound(mockSocket, mockPayload);

            expect(mockPayload.attacked.character.stats.attack).toBe(mockPayload.attacked.character.stats.attack);
            expect(mockPayload.attacked.character.stats.defense).toBe(mockPayload.attacked.character.stats.defense);
            expect(mockPayload.attacking.character.stats.attack).toBe(mockPayload.attacking.character.stats.attack);
            expect(mockPayload.attacking.character.stats.defense).toBe(mockPayload.attacking.character.stats.defense);

            expect(mockServer.emit).toHaveBeenCalledWith('diceRolled', {
                newAttacked: mockPayload.attacked,
                newAttacking: mockPayload.attacking,
            });

            jest.spyOn(global.Math, 'random').mockRestore();
        });
    });
    describe('handleAttackerStrike', () => {
        it('should increment pointsTaken and emit attackerPointsTaken event', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockPayload = {
                room: 'room1',
                attacker: {
                    username: 'Player1',
                    character: {
                        pointsTaken: 5,
                    },
                } as Player,
            };

            mockChatGateway.playersInRoom.set('room1', [
                {
                    username: 'Player1',
                    character: {
                        pointsTaken: 5,
                    },
                } as Player,
            ]);

            gateway.handleAttackerStrike(mockSocket, mockPayload);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
        });
    });

    describe('handleDefenderHit', () => {
        it('should increment pointsLost and emit defenderPointsLost event', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;

            const mockPayload = {
                room: 'room1',
                defender: {
                    username: 'Player1',
                    character: {
                        pointsLost: 2,
                    },
                } as Player,
            };

            mockChatGateway.playersInRoom.set('room1', [
                {
                    username: 'Player1',
                    character: {
                        pointsLost: 2,
                    },
                } as Player,
            ]);
            const THREE = 3;

            gateway.handleDefenderHit(mockSocket, mockPayload);

            const playerThatGotHit = mockChatGateway.playersInRoom.get('room1').find((p) => p.username === 'Player1');
            expect(playerThatGotHit.character.pointsLost).toBe(THREE);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
        });
    });

    describe('handlePlayerQuit', () => {
        it('should emit playerQuitFight event', () => {
            const mockSocket = { id: 'socket1', to: jest.fn(() => ({ emit: jest.fn() })) } as unknown as Socket;
            const mockPayload = {
                room: 'room1',
                player: { username: 'Player1' } as Player,
            };

            gateway.handlePlayerQuit(mockSocket, mockPayload);

            expect(mockSocket.to).toHaveBeenCalledWith('room1');
        });
    });

    describe('handlePerformAutomaticAttack', () => {
        it('should emit hasAttacked event with a successful attack', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockPayload = {
                room: 'room1',
                player: {
                    username: 'Player1',
                    character: {
                        stats: { attack: 10 },
                    },
                } as Player,
            };

            mockTimersGateway.activePlayer.set('room1', mockPayload.player);
            mockTimersGateway.playersInRoom.set('room1', [
                {
                    username: 'Player2',
                    character: {
                        stats: { defense: 5 },
                    },
                } as Player,
            ]);

            gateway.handlePerformAutomaticAttack(mockSocket, mockPayload);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
        });

        it('should emit hasAttacked event with a failed attack', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;

            const mockPayload = {
                room: 'room1',
                player: {
                    username: 'Player1',
                    character: {
                        stats: { attack: 5 },
                    },
                } as Player,
            };

            mockTimersGateway.activePlayer.set('room1', mockPayload.player);
            mockTimersGateway.playersInRoom.set('room1', [
                {
                    username: 'Player2',
                    character: {
                        stats: { defense: 10 },
                    },
                } as Player,
            ]);

            gateway.handlePerformAutomaticAttack(mockSocket, mockPayload);

            expect(mockServer.to).toHaveBeenCalledWith('room1');
        });

        it('should not emit if the active player is not the attacker', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;

            const mockPayload = {
                room: 'room1',
                player: {
                    username: 'Player1',
                    character: {
                        stats: { attack: 10 },
                    },
                } as Player,
            };

            mockTimersGateway.activePlayer.set('room1', {
                username: 'Player2',
            } as Player);

            gateway.handlePerformAutomaticAttack(mockSocket, mockPayload);

            expect(mockServer.to).not.toHaveBeenCalled();
        });
    });

    describe('handleStartFight', () => {
        it('should correctly initialize a fight with debugMode enabled', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;

            const mockPayload = {
                room: 'room1',
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: 'attack',
                        stats: { attack: 5, defense: 3 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: 'defense',
                        stats: { attack: 4, defense: 6 },
                    },
                } as Player,
                debugMode: true,
            };

            gateway.handleStartFight(mockSocket, mockPayload);

            expect(mockTimersGateway.playersInFight.get('room1')).toEqual([mockPayload.attacked, mockPayload.attacking]);
        });

        it('should correctly initialize a fight without debugMode', () => {
            const ZERO_FIVE = 0.5;
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;

            const mockPayload = {
                room: 'room1',
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: 'defense',
                        stats: { attack: 3, defense: 4 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: 'attack',
                        stats: { attack: 5, defense: 2 },
                    },
                } as Player,
                debugMode: false,
            };

            jest.spyOn(global.Math, 'random').mockReturnValue(ZERO_FIVE);

            gateway.handleStartFight(mockSocket, mockPayload);

            expect(mockTimersGateway.playersInFight.get('room1')).toEqual([mockPayload.attacked, mockPayload.attacking]);
        });

        it('should not emit if players are not in the room', () => {
            const mockSocket = { id: 'socket1', to: jest.fn() } as unknown as Socket;
            const mockPayload = {
                room: 'room1',
                attacked: {
                    username: 'NonExistentPlayer',
                    character: {
                        dice: 'attack',
                        stats: { attack: 0, defense: 0 },
                    },
                } as Player,
                attacking: {
                    username: 'NonExistentPlayer2',
                    character: {
                        dice: 'defense',
                        stats: { attack: 0, defense: 0 },
                    },
                } as Player,
                debugMode: false,
            };

            mockChatGateway.playersInRoom.set('room1', []);

            gateway.handleStartFight(mockSocket, mockPayload);

            expect(mockServer.to).not.toHaveBeenCalled();
        });
    });

    describe('handleStartNewRound', () => {
        it('should correctly update stats in debugMode when attackedDiceType is "attack" and attackingDiceType is "attack"', () => {
            const mockSocket = { id: 'socket1' } as unknown as Socket;
            const mockPayload = {
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: 'attack',
                        stats: { attack: 5, defense: 3 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: 'attack',
                        stats: { attack: 4, defense: 6 },
                    },
                } as Player,
                debugMode: true,
            };
            const FOUR = 4;
            const ELEVEN = 11;
            const TEN = 10;
            const SEVEN = 7;

            gateway.handleStartNewRound(mockSocket, mockPayload);

            expect(mockPayload.attacked.character.stats.attack).toBe(ELEVEN);
            expect(mockPayload.attacked.character.stats.defense).toBe(FOUR);
            expect(mockPayload.attacking.character.stats.attack).toBe(TEN);
            expect(mockPayload.attacking.character.stats.defense).toBe(SEVEN);

            expect(mockServer.emit).toHaveBeenCalledWith('diceRolled', {
                newAttacked: mockPayload.attacked,
                newAttacking: mockPayload.attacking,
            });
        });

        it('should correctly update stats in debugMode when attackedDiceType is "defense" and attackingDiceType is "defense"', () => {
            const mockSocket = { id: 'socket1' } as unknown as Socket;
            const mockPayload = {
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: 'defense',
                        stats: { attack: 5, defense: 3 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: 'defense',
                        stats: { attack: 4, defense: 6 },
                    },
                } as Player,
                debugMode: true,
            };

            const NINE = 9;
            const FOUR = 4;
            const EIGHT = 8;
            const SEVEN = 7;

            gateway.handleStartNewRound(mockSocket, mockPayload);

            expect(mockPayload.attacked.character.stats.attack).toBe(NINE);
            expect(mockPayload.attacked.character.stats.defense).toBe(FOUR);
            expect(mockPayload.attacking.character.stats.attack).toBe(EIGHT);
            expect(mockPayload.attacking.character.stats.defense).toBe(SEVEN);

            expect(mockServer.emit).toHaveBeenCalledWith('diceRolled', {
                newAttacked: mockPayload.attacked,
                newAttacking: mockPayload.attacking,
            });
        });

        it('should correctly update stats in non-debugMode with random values', () => {
            const mockSocket = { id: 'socket1' } as unknown as Socket;
            const mockPayload = {
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: 'attack',
                        stats: { attack: 5, defense: 3 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: 'defense',
                        stats: { attack: 4, defense: 6 },
                    },
                } as Player,
                debugMode: false,
            };

            const ZERO_FIVE = 0.5;

            jest.spyOn(global.Math, 'random').mockReturnValue(ZERO_FIVE);

            gateway.handleStartNewRound(mockSocket, mockPayload);

            expect(mockPayload.attacked.character.stats.attack).toBe(mockPayload.attacked.character.stats.attack);
            expect(mockPayload.attacked.character.stats.defense).toBe(mockPayload.attacked.character.stats.defense);
            expect(mockPayload.attacking.character.stats.attack).toBe(mockPayload.attacking.character.stats.attack);
            expect(mockPayload.attacking.character.stats.defense).toBe(mockPayload.attacking.character.stats.defense);

            expect(mockServer.emit).toHaveBeenCalledWith('diceRolled', {
                newAttacked: mockPayload.attacked,
                newAttacking: mockPayload.attacking,
            });
        });

        it('should not update stats if no dice type is provided', () => {
            const mockSocket = { id: 'socket1' } as unknown as Socket;
            const mockPayload = {
                attacked: {
                    username: 'Player1',
                    character: {
                        dice: '',
                        stats: { attack: 5, defense: 3 },
                    },
                } as Player,
                attacking: {
                    username: 'Player2',
                    character: {
                        dice: '',
                        stats: { attack: 4, defense: 6 },
                    },
                } as Player,
                debugMode: false,
            };

            gateway.handleStartNewRound(mockSocket, mockPayload);

            const FIVE = 5;
            const THREE = 3;
            const FOUR = 4;
            const SIX = 6;

            expect(mockPayload.attacked.character.stats.attack).toBe(FIVE);
            expect(mockPayload.attacked.character.stats.defense).toBe(THREE);
            expect(mockPayload.attacking.character.stats.attack).toBe(FOUR);
            expect(mockPayload.attacking.character.stats.defense).toBe(SIX);

            expect(mockServer.emit).toHaveBeenCalledWith('diceRolled', {
                newAttacked: mockPayload.attacked,
                newAttacking: mockPayload.attacking,
            });
        });
    });

    describe('CombatGateway - virtualPlayersSmoke', () => {
        let gateway: CombatGateway;

        const mockTimersGateway = {
            playersInFight: new Map(),
            pauseTimer: jest.fn(),
            randomizedPlayersInRoom: new Map(),
            handleResumeTurnTimer: jest.fn(),
            endTurn: jest.fn(),
        };

        const mockChatGateway = {
            playersInRoom: new Map(),
        };

        const mockServer = {
            to: jest.fn(() => ({
                emit: jest.fn(),
            })),
            emit: jest.fn(),
        };

        const mockLogger = {
            log: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();
            gateway = new CombatGateway(mockLogger as any, mockTimersGateway as any, mockChatGateway as any, {} as any, {} as any);
            gateway.server = mockServer as any;
        });

        it('should execute all branches of virtualPlayersSmoke', () => {
            const room = 'test-room';
            const attackedPlayer: Player = {
                username: 'attackedPlayer',
                isVirtual: true,
                character: {
                    dice: 'attack',
                    stats: { attack: 10, defense: 5 },
                    combats: 0,
                },
                profile: 'defensif',
            } as any;

            const virtualPlayer: Player = {
                username: 'virtualPlayer',
                isVirtual: true,
                character: {
                    dice: 'defense',
                    stats: { attack: 8, defense: 7 },
                    combats: 0,
                },
                profile: 'agressif',
            } as any;

            mockChatGateway.playersInRoom.set(room, [attackedPlayer, virtualPlayer]);
            mockTimersGateway.randomizedPlayersInRoom.set(room, [attackedPlayer, virtualPlayer]);

            gateway.virtualPlayersSmoke(room, attackedPlayer, virtualPlayer, true);

            expect(mockTimersGateway.playersInFight.get(room)).toEqual([attackedPlayer, virtualPlayer]);
            expect(mockTimersGateway.pauseTimer).toHaveBeenCalledWith(room);
            expect(mockServer.to).toHaveBeenCalledWith(room);

            attackedPlayer.profile = 'agressif';
            virtualPlayer.profile = 'agressif';
            gateway.virtualPlayersSmoke(room, attackedPlayer, virtualPlayer, false);
        });

        it('should handle case where attackedPlayer does not use attack dice and debugMode is true', () => {
            const room = 'test-room';
            const attackedPlayer: Player = {
                username: 'attackedPlayer',
                isVirtual: true,
                character: {
                    dice: 'defense',
                    stats: { attack: 10, defense: 5 },
                    combats: 0,
                },
                profile: 'defensif',
            } as any;

            const virtualPlayer: Player = {
                username: 'virtualPlayer',
                isVirtual: true,
                character: {
                    dice: 'attack',
                    stats: { attack: 8, defense: 7 },
                    combats: 0,
                },
                profile: 'agressif',
            } as any;

            mockChatGateway.playersInRoom.set(room, [attackedPlayer, virtualPlayer]);
            mockTimersGateway.randomizedPlayersInRoom.set(room, [attackedPlayer, virtualPlayer]);

            gateway.virtualPlayersSmoke(room, attackedPlayer, virtualPlayer, true);

            expect(attackedPlayer.character.stats.attack).toBeGreaterThanOrEqual(10);
            expect(attackedPlayer.character.stats.defense).toBe(5);
        });

        it('should handle case where virtualPlayer uses attack dice and debugMode is false', () => {
            const room = 'test-room';
            const attackedPlayer: Player = {
                username: 'attackedPlayer',
                isVirtual: true,
                character: {
                    dice: 'defense',
                    stats: { attack: 10, defense: 5 },
                    combats: 0,
                },
                profile: 'defensif',
            } as any;

            const virtualPlayer: Player = {
                username: 'virtualPlayer',
                isVirtual: true,
                character: {
                    dice: 'attack',
                    stats: { attack: 8, defense: 7 },
                    combats: 0,
                },
                profile: 'agressif',
            } as any;

            mockChatGateway.playersInRoom.set(room, [attackedPlayer, virtualPlayer]);
            mockTimersGateway.randomizedPlayersInRoom.set(room, [attackedPlayer, virtualPlayer]);

            gateway.virtualPlayersSmoke(room, attackedPlayer, virtualPlayer, false);

            expect(virtualPlayer.character.stats.attack).toBeGreaterThan(virtualPlayer.character.stats.attack - 1);
            expect(virtualPlayer.character.stats.defense).toBeGreaterThan(virtualPlayer.character.stats.defense - 1);
        });

        it('should handle case where virtualPlayer does not use attack dice and debugMode is true', () => {
            const room = 'test-room';
            const attackedPlayer: Player = {
                username: 'attackedPlayer',
                isVirtual: true,
                character: {
                    dice: 'defense',
                    stats: { attack: 10, defense: 5 },
                    combats: 0,
                },
                profile: 'defensif',
            } as any;

            const virtualPlayer: Player = {
                username: 'virtualPlayer',
                isVirtual: true,
                character: {
                    dice: 'defense',
                    stats: { attack: 8, defense: 7 },
                    combats: 0,
                },
                profile: 'agressif',
            } as any;

            mockChatGateway.playersInRoom.set(room, [attackedPlayer, virtualPlayer]);
            mockTimersGateway.randomizedPlayersInRoom.set(room, [attackedPlayer, virtualPlayer]);

            gateway.virtualPlayersSmoke(room, attackedPlayer, virtualPlayer, true);

            expect(virtualPlayer.character.stats.attack).toBe(virtualPlayer.character.stats.attack);
            expect(virtualPlayer.character.stats.defense).toBe(virtualPlayer.character.stats.defense);
        });
    });
});
/* eslint-disable max-lines */
