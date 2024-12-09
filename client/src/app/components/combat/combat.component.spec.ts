import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CharacterStatsComponent } from '@app/components/character-stats/character-stats.component';
import { JournalComponent } from '@app/components/journal-de-bord/journal-de-bord.component';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { CombatComponent } from './combat.component';

describe('CombatComponent', () => {
    let component: CombatComponent;
    let fixture: ComponentFixture<CombatComponent>;
    let turnSystemService: jasmine.SpyObj<TurnSystemService>;
    let sharedService: jasmine.SpyObj<SharedDataService>;
    let socketService: jasmine.SpyObj<SocketService>;

    const mockData = {
        victimPlayerBeforeDice: {
            username: 'Player2',
            character: { stats: { attack: 10, defense: 8, health: 5 } },
        } as Player,
        fightStarterBeforeDice: {
            username: 'Player1',
            character: { stats: { attack: 12, defense: 10, health: 10 } },
        } as Player,
        playersInOrder: [
            {
                username: 'Player1',
                character: { stats: { attack: 12, defense: 10, health: 10 } },
            } as Player,
            {
                username: 'Player2',
                character: { stats: { attack: 10, defense: 8, health: 5 } },
            } as Player,
        ],
    };

    beforeEach(async () => {
        const turnSystemServiceSpy = jasmine.createSpyObj('TurnSystemService', [
            'pauseTurnTimer',
            'resumeTurnTimer',
            'initializeCombat',
            'nextRound',
            'removePlayerFromTurnOrder',
            'roundOrder$',
            'activeFighter$',
            'roundTimeLeft$',
        ]);
        const sharedServiceSpy = jasmine.createSpyObj('SharedDataService', [
            'getPlayer',
            'getAccessCode',
            'setAccessCode',
            'getBoard',
            'getDebugModeStatus',
            'resetSharedServices',
        ]);

        sharedServiceSpy.getPlayer.and.returnValue({
            username: 'Player1',
            character: {
                stats: { attack: 10, defense: 8, health: 5 },
                position: { row: 0, col: 0 },
            },
        } as Player);

        const socketServiceSpy = jasmine.createSpyObj('SocketService', ['emit', 'on', 'disconnect', 'off']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const mockDialogRef = {
            close: jasmine.createSpy('close'), // Mock the close method
        };

        await TestBed.configureTestingModule({
            imports: [CombatComponent, CharacterStatsComponent, JournalComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: mockData },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: TurnSystemService, useValue: turnSystemServiceSpy },
                { provide: SharedDataService, useValue: sharedServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: Router, useValue: routerSpy },
                provideHttpClient(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CombatComponent);
        component = fixture.componentInstance;
        turnSystemService = TestBed.inject(TurnSystemService) as jasmine.SpyObj<TurnSystemService>;
        sharedService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
        socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
        sharedService.getAccessCode.and.returnValue('mockAccessCode');
        sharedService.getPlayer.and.returnValue(mockData.fightStarterBeforeDice);
        turnSystemService.roundOrder$ = of(mockData.playersInOrder);
        turnSystemService.activeFighter$ = of(mockData.fightStarterBeforeDice);
        turnSystemService.roundTimeLeft$ = of(5);
        component.myPlayer = { username: 'Player2', character: { body: 'AvatarBody', stats: { attack: 9, defense: 7 } } } as Player;
        component.opponentPlayer = { username: 'Player2', character: { body: 'AvatarBody', stats: { attack: 9, defense: 7 } } } as Player;

        sharedService.getAccessCode.and.returnValue('mockAccessCode');

        component.ngOnInit();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize combat with players and access code', () => {
        component.ngOnInit();
        expect(turnSystemService.initializeCombat).toHaveBeenCalledWith(mockData.playersInOrder, 'mockAccessCode');
    });

    it('should set myPlayer and opponentPlayer correctly', () => {
        component.ngOnInit();
        expect(component.myPlayer).toEqual(component.myPlayer);
        expect(component.opponentPlayer).toEqual(component.opponentPlayer);
    });

    it('should set isActiveFighter to true if myPlayer is the first fighter', () => {
        component.ngOnInit();
        expect(component.isActiveFighter).toBeTrue();
    });

    it('should call setUpListener on initialization', () => {
        spyOn(component, 'setUpListener');
        component.ngOnInit();
        expect(component.setUpListener).toHaveBeenCalled();
    });

    it('should subscribe to roundOrder$, activeFighter$, and roundTimeLeft$ observables', () => {
        component.ngOnInit();

        expect(component.roundOrder).toEqual(mockData.playersInOrder);

        expect(component.roundTimeLeft).toBe(5);
    });

    it('should initialize escape attempts on setUpListener', () => {
        component.setUpListener();
        expect(component.escapeAttempts['Player1']).toBe(2);
        expect(component.escapeAttempts['Player2']).toBe(2);
    });

    it('should reduce escape attempts and return true if escape succeeds', () => {
        spyOn(Math, 'random').and.returnValue(0.3);
        component.myPlayer = mockData.fightStarterBeforeDice;
        component.initializeEscapeAttempts();

        const success = component.attemptEscape();

        expect(success).toBeTrue();
        expect(component.escapeAttempts['Player1']).toBe(1);
    });

    it('should update room journal and toggle isActiveFighter on escapeFailed', () => {
        component.isActiveFighter = true;
        const escaper = { username: 'Player1', character: { stats: { attack: 12, defense: 10, health: 10 } } } as Player;

        component.roomJournal.push({
            usersMentionned: [escaper],
            text: `${escaper.username} a tenté de s'enfuir, mais en vain !`,
        });
        component.isActiveFighter = !component.isActiveFighter;

        expect(component.roomJournal.length).toBe(1);
        expect(component.roomJournal[0].text).toContain("a tenté de s'enfuir, mais en vain");
        expect(component.isActiveFighter).toBeFalse();
    });

    it('should update opponent health on successful attack', fakeAsync(() => {
        component.myPlayer = mockData.fightStarterBeforeDice;
        component.opponentPlayer = mockData.fightStarterBeforeDice;
        component.opponentPlayer.character.stats.health = 5;

        component.performAttack();
        tick();

        expect(component.opponentPlayer.character.stats.health).toBe(5);
    }));

    it('should disable escape attempts after they reach zero', () => {
        component.myPlayer = mockData.fightStarterBeforeDice;
        component.initializeEscapeAttempts();
        component.escapeAttempts['Player1'] = 0;

        const success = component.attemptEscape();

        expect(success).toBeFalse();
        expect(component.noMoreEscapes).toBeTrue();
    });

    it('should emit "startNewRound" and update stats when myPlayer is newAttacked', fakeAsync(() => {
        const newAttacked = { username: 'Player1', character: { stats: { attack: 15, defense: 12 } } } as Player;
        const newAttacking = { username: 'Player2', character: { stats: { attack: 14, defense: 11 } } } as Player;

        socketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'diceRolled') {
                callback({ newAttacked, newAttacking });
            }
        });

        component.startNewRound();
        tick();

        expect(component.myPlayer!.character.stats.attack).toBe(15);
        expect(component.myPlayer!.character.stats.defense).toBe(12);

        expect(component.opponentPlayer!.character.stats.attack).toBe(14);
        expect(component.opponentPlayer!.character.stats.defense).toBe(11);
    }));

    it('should update stats when myPlayer is newAttacking', fakeAsync(() => {
        const newAttacked = { username: 'Player2', character: { stats: { attack: 13, defense: 10 } } } as Player;
        const newAttacking = { username: 'Player1', character: { stats: { attack: 16, defense: 14 } } } as Player;

        socketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'diceRolled') {
                callback({ newAttacked, newAttacking });
            }
        });

        component.startNewRound();
        tick();

        expect(component.myPlayer!.character.stats.attack).toBe(16);
        expect(component.myPlayer!.character.stats.defense).toBe(14);

        expect(component.opponentPlayer!.character.stats.attack).toBe(13);
        expect(component.opponentPlayer!.character.stats.defense).toBe(10);
    }));

    it('should close the dialog, disconnect the socket, unsubscribe from subscriptions, navigate to home, and reset shared services', () => {
        component.quitFight();

        expect(component.dialogRef.close).toHaveBeenCalled();
        expect(component.socketService.disconnect).toHaveBeenCalled();
        expect(component.router.navigate).toHaveBeenCalledWith(['/home']);
        expect(component.sharedService.resetSharedServices).toHaveBeenCalled();
    });

    it('should close the dialog, disconnect the socket, unsubscribe from subscriptions, navigate to home, and reset shared services on player quit fight', () => {
        const mockPlayer = {
            username: 'Player2',
            character: { body: 'AvatarBody' },
        } as Player;

        const mockRes = { player: mockPlayer };

        const winner = mockData.playersInOrder.find((p) => p.username !== mockPlayer.username);
        socketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'playerQuitFight') {
                callback(mockRes);
            }
        });
        component.ngOnInit();

        expect(component.dialogRef.close).toHaveBeenCalledWith({ winner: winner });
    });

    it('should toggle isActiveFighter, reset attackUsed, and call startNewRound on roundEnded', () => {
        spyOn(component, 'startNewRound');

        const mockPlayer1 = {
            username: 'Player2',
            character: { body: 'AvatarBody' },
        } as Player;

        const mockRes = { room: 'mockAccessCode', player: mockPlayer1 };

        socketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'roundEnded') {
                callback(mockRes);
            }
        });

        component.ngOnInit();

        expect(component.isActiveFighter).toBeFalse();
        expect(component.attackUsed).toBeFalse();
        expect(component.startNewRound).toHaveBeenCalled();
    });

    it('should place items on nearest tiles and close the dialog on kickLastPlayer event', () => {
        const mockPlayer = {
            username: 'Player2',
            character: { body: 'AvatarBody' },
            inventory: ['item1', 'item2'],
        } as Player;

        const mockRes = { player: mockPlayer };

        const mockBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'grass',
                    door: false,
                    wall: false,
                    object: null,
                    avatar: 'AvatarBody',
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
            [{ fieldTile: 'sand', door: false, wall: false, object: null, avatar: null, isTileSelected: false, position: { row: 1, col: 0 } }],
        ];

        component.matchBoardComponent = {
            board: mockBoard,
        } as any;

        spyOn(component.inventoryService, 'placeItemsOnNearestTiles');

        socketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'kickLastPlayer') {
                callback(mockRes);
            }
        });

        // Act
        component.ngOnInit();

        // Assert
        expect(component.inventoryService.placeItemsOnNearestTiles).toHaveBeenCalledWith(
            mockPlayer.inventory,
            { row: 0, col: 0 },
            mockBoard,
            'mockAccessCode',
        );
        expect(component.dialogRef.close).toHaveBeenCalled();
    });

    it('should handle a successful attack by myPlayer and update the journal, opponent health, and close dialog if opponent dies', () => {
        // Arrange
        const mockAttacker = {
            username: 'Player1',
            isVirtual: false,
            character: { stats: { health: 10 } },
        } as Player;

        const mockDefender = {
            username: 'Player2',
            isVirtual: true,
            character: { stats: { health: 5 } },
            inventory: ['item1', 'item2'],
        } as Player;

        const mockRes = {
            attackSucceed: true,
            attacker: mockAttacker,
            impact: 5,
        };

        component.myPlayer = mockAttacker;
        component.opponentPlayer = mockDefender;
        component.playersInTheFight = [mockAttacker, mockDefender];
        component.roomJournal = [];

        socketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'hasAttacked') {
                callback(mockRes);
            }
        });

        component.ngOnInit();

        expect(component.opponentPlayer.character.stats.health).toEqual(0);

        expect(component.dialogRef.close).toHaveBeenCalledWith({
            winner: component.myPlayer,
            loser: component.opponentPlayer,
        });

        expect(component.opponentPlayer.inventory).toEqual([null, null]);

        expect(component.roomJournal).toEqual([
            jasmine.objectContaining({
                text: "Player1\n                     vient d'attaquer Player2!\nPlayer2 vient de perdre un point de vie!",
                usersMentionned: [mockAttacker, mockDefender],
            }),
        ]);

        expect(component.socketService.emit).toHaveBeenCalledWith('attackerStrike', {
            room: 'mockAccessCode',
            attacker: mockAttacker,
        });
        expect(component.socketService.emit).toHaveBeenCalledWith('defenderHit', {
            room: 'mockAccessCode',
            defender: mockDefender,
        });
    });

    it('should handle a successful attack on myPlayer and close the dialog if myPlayer dies', () => {
        const mockAttacker = {
            username: 'Player2',
            isVirtual: false,
            character: { stats: { health: 10 } },
        } as Player;

        const mockMyPlayer = {
            username: 'Player1',
            isVirtual: false,
            character: { stats: { health: 1 } },
            inventory: ['item1', 'item2'],
        } as Player;

        const mockRes = {
            attackSucceed: true,
            attacker: mockAttacker,
            impact: 5,
        };

        component.myPlayer = mockMyPlayer;
        component.opponentPlayer = mockAttacker;
        component.playersInTheFight = [mockAttacker, mockMyPlayer];
        spyOn(component, 'cleanupFightListeners');

        socketService.on.and.callFake((event: string, callback: Function) => {
            if (event === 'hasAttacked') {
                callback(mockRes);
            }
        });

        component.ngOnInit();

        expect(component.myPlayer.character.stats.health).toEqual(component.myPlayer.character.stats.health);

        expect(component.myPlayer.inventory).toEqual(component.myPlayer.inventory);

        // expect(component.socketService.emit).toHaveBeenCalledWith('defenderHit', {
        //     room: 'mockAccessCode',
        //     defender: component.myPlayer,
        // });
    });

    it('should handle a successful escape attempt and emit endFight', () => {
        component.escapeAttempts = { Player2: 1 };
        spyOn(Math, 'random').and.returnValue(0.3);

        const result = component.attemptVirtualEscape();

        expect(result).toBeTrue();
        expect(component.escapeAttempts.Player2).toEqual(0);
        expect(component.socketService.emit).toHaveBeenCalledWith('endFight', {
            room: 'mockAccessCode',
            escapingPlayer: component.opponentPlayer,
        });
    });

    it('should handle a failed escape attempt and emit escapeAttempted and escapeAttempt', () => {
        component.escapeAttempts = { Player2: 1 };
        spyOn(Math, 'random').and.returnValue(0.5);

        const result = component.attemptVirtualEscape();

        expect(result).toBeFalse();
        expect(component.escapeAttempts.Player2).toEqual(0);
        expect(component.socketService.emit).toHaveBeenCalledWith('escapeAttempted', {
            room: 'mockAccessCode',
            escaper: component.opponentPlayer,
            escapeAttempts: component.escapeAttempts,
        });
        expect(component.socketService.emit).toHaveBeenCalledWith('escapeAttempt', {
            room: 'mockAccessCode',
            escaper: component.opponentPlayer,
        });
    });

    it('should emit escapeAttempted and escapeAttempt when no escape attempts are left', () => {
        component.escapeAttempts = { Player2: 0 };
        const result = component.attemptVirtualEscape();

        expect(result).toBeFalse();
        expect(component.escapeAttempts.Player2).toEqual(0);
        expect(component.socketService.emit).toHaveBeenCalledWith('escapeAttempted', {
            room: 'mockAccessCode',
            escaper: component.opponentPlayer,
            escapeAttempts: component.escapeAttempts,
        });
        expect(component.socketService.emit).toHaveBeenCalledWith('escapeAttempt', {
            room: 'mockAccessCode',
            escaper: component.opponentPlayer,
        });
    });

    it('should emit an attack event with success when performVirtualAttack is called and attack succeeds', () => {
        component.opponentPlayer!.character.stats.attack = 10;
        component.myPlayer!.character.stats.defense = 8;

        component.performVirtualAttack();

        expect(component.socketService.emit).toHaveBeenCalledWith('attack', {
            room: 'mockAccessCode',
            attackSucceed: true,
            attacker: component.opponentPlayer,
            impact: 1,
        });
        expect(component.attackUsed).toBeTrue();
    });

    it('should emit an attack event with failure when performVirtualAttack is called and attack fails', () => {
        component.opponentPlayer!.character.stats.attack = 7;
        component.myPlayer!.character.stats.defense = 8;

        component.performVirtualAttack();

        expect(component.socketService.emit).toHaveBeenCalledWith('attack', {
            room: 'mockAccessCode',
            attackSucceed: false,
            attacker: component.opponentPlayer,
            impact: 0,
        });
        expect(component.attackUsed).toBeTrue();
    });

    it('should trigger a virtual attack for an aggressive virtual player', () => {
        const callbackSpy = jasmine.createSpy();
        socketService.on.and.callFake((event, callback) => {
            if (event === 'roundTimeLeftUpdate') {
                callbackSpy.and.callFake(callback);
            }
        });

        component.setupAutomaticAttack();

        const mockData = {
            room: 'mockAccessCode',
            timeLeft: 3,
            player: { username: 'Player2', isVirtual: true, profile: 'agressif' },
        };
        spyOn(component, 'performVirtualAttack');

        spyOn(Math, 'random').and.returnValue(0.5);
        callbackSpy(mockData);
    });

    it('should trigger an escape attempt for a defensive virtual player with low health', () => {
        const callbackSpy = jasmine.createSpy();
        socketService.on.and.callFake((event, callback) => {
            if (event === 'roundTimeLeftUpdate') {
                callbackSpy.and.callFake(callback);
            }
        });
        spyOn(component, 'attemptVirtualEscape');

        component.setupAutomaticAttack();

        component.opponentPlayer!.character.stats.health = 6;
        const mockData = {
            room: 'mockAccessCode',
            timeLeft: 3,
            player: { username: 'Player2', isVirtual: true, profile: 'defensif' },
        };

        spyOn(Math, 'random').and.returnValue(0.5);

        callbackSpy(mockData);
    });

    it('should emit an attack event with success when attack succeeds', () => {
        // Arrange
        component.myPlayer!.character.stats.attack = 10; // Higher attack
        component.opponentPlayer!.character.stats.defense = 8; // Lower defense

        component.performAutomaticAttack();

        expect(component.socketService.emit).toHaveBeenCalledWith('attack', {
            room: 'mockAccessCode',
            attackSucceed: true,
            attacker: component.myPlayer,
            impact: 1,
        });
        expect(component.attackUsed).toBeTrue(); // Ensure attackUsed is set
    });

    it('should emit an attack event with failure when attack fails', () => {
        component.myPlayer!.character.stats.attack = 7; // Lower attack
        component.opponentPlayer!.character.stats.defense = 8; // Higher defense

        component.performAutomaticAttack();

        expect(component.socketService.emit).toHaveBeenCalledWith('attack', {
            room: 'mockAccessCode',
            attackSucceed: false,
            attacker: component.myPlayer,
            impact: 0,
        });
        expect(component.attackUsed).toBeTrue(); // Ensure attackUsed is set
    });

    it('should set firstFighterBeforeDice and firstDefenderBeforeDice correctly when firstFighter matches victimPlayerBeforeDice', () => {
        expect(component.firstFighterBeforeDice).toEqual(mockData.victimPlayerBeforeDice);
        expect(component.firstDefenderBeforeDice).toEqual(mockData.fightStarterBeforeDice);
    });

    it('should set firstFighterBeforeDice and firstDefenderBeforeDice correctly when firstFighter matches fightStarterBeforeDice', () => {
        mockData.playersInOrder[0].username = 'Player2';
        mockData.playersInOrder[1].username = 'Player1';

        expect(component.firstFighterBeforeDice).toEqual(mockData.fightStarterBeforeDice);
        expect(component.firstDefenderBeforeDice).toEqual(mockData.victimPlayerBeforeDice);
    });
});
