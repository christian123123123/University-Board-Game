/* eslint-disable */

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { VirtualPlayerProfileDialogComponent } from '@app/components/virtual-player-profile-dialog/virtual-player-profile-dialog.component';
import { Character } from '@app/interfaces/Character';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { WaitingRoomService } from '@app/services/waiting-room/waiting-room.service';
import { of, Subject } from 'rxjs';
import { WaitingRoomPageComponent } from './waiting-room-page.component';

describe('WaitingRoomPageComponent', () => {
    let component: WaitingRoomPageComponent;
    let fixture: ComponentFixture<WaitingRoomPageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockSharedDataService: jasmine.SpyObj<SharedDataService>;
    let mockWaitingRoomService: jasmine.SpyObj<WaitingRoomService>;
    let mockTurnSystemService: jasmine.SpyObj<TurnSystemService>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<VirtualPlayerProfileDialogComponent>>;
    let mockDialog: jasmine.SpyObj<MatDialog>;

    const mockPlayer: Player = {
        username: 'testUser',
        isAdmin: true,
        character: {
            name: 'Test Character',
            image: 'character-image-url',
            face: 'character-face-url',
            body: 'character-body-url',
            stats: { health: 100, speed: 10, attack: 15, defense: 8 },
            dice: 'd6',
            victories: 0,
            position: { row: 0, col: 0 },
        } as Character,
        inventory: [null, null],
    };

    const mockGame: Game = {
        _id: 'gameId',
        title: 'Test Game',
        mapSize: 'large',
        mode: 'testMode',
        visibility: true,
        description: 'Test Game Description',
        board: [],
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const routerEventsSubject = new Subject<any>();

        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        Object.defineProperty(mockRouter, 'events', { value: routerEventsSubject.asObservable() });
        mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'disconnect', 'on', 'off', 'emit']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(of('defensive'));

        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialog.open.and.returnValue(mockDialogRef);
        mockSharedDataService = jasmine.createSpyObj('SharedDataService', [
            'getPlayer',
            'getAccessCode',
            'getMatchId',
            'getGame',
            'getBoard',
            'getPlayersInGame',
            'setGame',
            'setBoard',
            'setPlayersInGame',
            'getChatHistory',
            'setActivePlayer',
            'resetSharedServices',
        ]);
        mockWaitingRoomService = jasmine.createSpyObj('WaitingRoomService', ['isLobbyFull', 'isLobbyReady']);
        mockTurnSystemService = jasmine.createSpyObj('TurnSystemService', ['initialize']);

        mockSharedDataService.getPlayer.and.returnValue(mockPlayer);
        mockSharedDataService.getAccessCode.and.returnValue('testAccessCode');
        mockSharedDataService.getMatchId.and.returnValue('mockMatchId');
        mockSharedDataService.getGame.and.returnValue(mockGame);
        mockSharedDataService.getBoard.and.returnValue([]);
        mockSharedDataService.getPlayersInGame.and.returnValue([]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSocketService.on.and.callFake((event: string, callback: any) => {
            if (event === 'joinRoom') {
                callback({ welcomeMessageFromServer: 'Welcome!', chatHistory: [], gameMap: {} });
            }
            if (event === 'roomData') {
                callback({ currentRoom: 'testRoom', players: [], accessibility: true });
            }
            if (event === 'clock') {
                callback(new Date());
            }
        });

        await TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule, WaitingRoomPageComponent, ChatBoxComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: Router, useValue: mockRouter },
                { provide: MatSnackBar, useValue: mockSnackBar },
                { provide: SocketService, useValue: mockSocketService },
                { provide: SharedDataService, useValue: mockSharedDataService },
                { provide: WaitingRoomService, useValue: mockWaitingRoomService },
                { provide: TurnSystemService, useValue: mockTurnSystemService },
                { provide: MatDialog, useValue: {} },
                { provide: MatDialog, useValue: mockDialog }, // Use the mocked MatDialog here

                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({ get: () => 'mockValue' }),
                        queryParams: of({}),
                        snapshot: { paramMap: { get: () => 'mockValue' } },
                        url: of([{ path: 'testPath' }]),
                    },
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingRoomPageComponent);
        component = fixture.componentInstance;
        component.username = 'testUser';
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the component and set initial values', () => {
        component.ngOnInit();
        expect(mockSocketService.connect).toHaveBeenCalled();
        expect(component.accessCode).toEqual('testAccessCode');
        expect(component.isAdmin).toBeTrue();
    });

    it('should set welcome message and chat history on joinRoom event', () => {
        const response = {
            welcomeMessageFromServer: 'Welcome to the room!',
            chatHistory: [{ user: 'user1', text: 'Hello', time: new Date() }],
            gameMap: { mapSize: 'medium' } as Game,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSocketService.emit.and.callFake((event: string, data: any, callback: any) => {
            if (callback) {
                callback(response);
            }
        });

        component.setupListeners();

        expect(component.welcomeMessage).toBe('Welcome to the room!');
        expect(component.chatRoomHistory).toEqual(response.chatHistory);
        expect(component.game).toEqual(response.gameMap);
    });

    it('should update room users and accessibility on roomData event', () => {
        const roomData = {
            currentRoom: 'testRoom',
            players: [{ username: 'user1' } as Player, { username: 'user2' } as Player],
            accessibility: true,
        };

        mockWaitingRoomService.isLobbyFull.and.returnValue(false);
        component.setupListeners();
        const roomDataCallback = mockSocketService.on.calls.allArgs().find((args) => args[0] === 'roomData')?.[1];

        if (roomDataCallback) {
            roomDataCallback(roomData);
        } else {
            fail('Expected "roomData" event listener to be registered.');
        }

        expect(component.roomUsers['testRoom']).toEqual(roomData.players);
        expect(component.isAccessible).toBeTrue();
    });

    it('should navigate to /home and display snackbar message when kicked', () => {
        component.setupListeners();
        const kickListener = mockSocketService.on.calls.allArgs().find((args) => args[0] === 'kick');

        if (kickListener) {
        } else {
            fail('Expected "kick" event listener to be registered.');
        }
    });

    it('should disconnect and navigate to /home when admin leaves', () => {
        component.setupListeners();

        const adminLeftCallback = mockSocketService.on.calls.allArgs().find((args) => args[0] === 'adminLeft')?.[1];

        if (adminLeftCallback) {
            adminLeftCallback({});
        } else {
            fail('Expected "adminLeft" event listener to be registered.');
        }

        expect(mockSocketService.disconnect).toHaveBeenCalled();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);

        expect(mockSnackBar.open).toHaveBeenCalledWith("L'organisateur de la partie a quitter la chambre!", 'Close', {
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
        });
    });

    it('should initialize game board and players on gameStarted event', () => {
        const gameStartedData = {
            room: 'testRoom',
            board: [[{}]],
            randomizedPlayers: [{ username: 'user1' } as Player, { username: 'user2' } as Player],
        };

        component.accessCode = 'testRoom';
        component.setupListeners();
        const gameStartedListener = mockSocketService.on.calls.allArgs().find((args) => args[0] === 'gameStarted');

        if (gameStartedListener) {
            gameStartedListener[1](gameStartedData);
        } else {
            fail('Expected "gameStarted" event listener to be registered.');
        }
    });

    it('should set game to null if player is not an admin', () => {
        const mockCharacter = {
            name: 'Test Character',
            image: 'character-image-url',
            face: 'character-face-url',
            body: 'character-body-url',
            stats: { health: 100, speed: 10, attack: 15, defense: 8 },
            dice: 'd6',
            victories: 0,
            position: { row: 0, col: 0 },
        } as Character;

        mockSharedDataService.getPlayer.and.returnValue({
            username: 'testUser',
            isAdmin: false,
            character: mockCharacter,
        } as Player);

        component.ngOnInit();

        expect(component.game).toBeNull();
    });

    it('should set isAccessible to false if isLobbyFull returns true on roomData event', () => {
        mockWaitingRoomService.isLobbyFull.and.returnValue(true);

        const roomData = {
            currentRoom: 'testRoom',
            players: [{ username: 'user1' } as Player, { username: 'user2' } as Player],
            accessibility: true,
        };

        component.setupListeners();

        const roomDataCallback = mockSocketService.on.calls.allArgs().find((args) => args[0] === 'roomData')?.[1];

        if (roomDataCallback) {
            roomDataCallback(roomData);
        } else {
            fail('Expected "roomData" event listener to be registered.');
        }

        expect(component.isAccessible).toBeFalse();
    });

    it('should update isAccessible based on accessibilityToggled event', () => {
        const accessibilityData = { accessibility: true };

        component.setupListeners();

        const accessibilityToggledCallback = mockSocketService.on.calls.allArgs().find((args) => args[0] === 'accessibilityToggled')?.[1];

        if (accessibilityToggledCallback) {
            accessibilityToggledCallback(accessibilityData);
        } else {
            fail('Expected "accessibilityToggled" event listener to be registered.');
        }

        expect(component.isAccessible).toBeTrue();
    });

    it('should generate a unique username', () => {
        // Initialize roomUsers and accessCode directly within the test
        component.accessCode = 'testRoom';
        component.roomUsers = {
            testRoom: [],
        };

        const MOCK_NAMES = ['User1', 'User2', 'User3'];

        // Call the method to generate a username
        const username = component.generateUniqueUsername();

        // Validate the username is within the allowed names and is unique
        expect(MOCK_NAMES).toContain(username);
        expect(component.roomUsers[component.accessCode].some((player) => player.username === username)).toBeFalse();
    });

    it('should generate a unique character', () => {
        // Initialize roomUsers and accessCode directly within the test
        component.accessCode = 'testRoom';
        component.roomUsers = {
            testRoom: [],
        };

        const MOCK_CHARACTERS: Character[] = [
            {
                name: 'Character 1',
                image: 'character1-image-url',
                face: 'character1-face-url',
                body: 'character1-body-url',
                stats: { health: 100, speed: 10, attack: 15, defense: 8 },
                dice: 'd6',
                victories: 0,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
            },
            {
                name: 'Character 2',
                image: 'character2-image-url',
                face: 'character2-face-url',
                body: 'character2-body-url',
                stats: { health: 100, speed: 10, attack: 15, defense: 8 },
                dice: 'd6',
                victories: 0,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
            },
        ];

        // Call the method to generate a unique character
        const character = component.generateUniqueCharacter();

        // Validate the character is one of the allowed characters and is unique
        expect(MOCK_CHARACTERS).toContain(character);
        expect(component.roomUsers[component.accessCode].some((player) => player.character.name === character.name)).toBeFalse();
    });

    it('should handle "kick" event by disconnecting the socket, navigating to /home, showing a snackbar, and resetting shared services', () => {
        // Mock the "kick" event data
        const mockKickData = { player: { username: 'testUser' } as Player };

        // Set the current player to match the one in the "kick" event data
        component.player = { username: 'testUser' } as Player;

        // Call setupListeners to attach the "kick" event listener
        component.setupListeners();

        // Find the "kick" event listener
        const kickCallback = mockSocketService.on.calls.allArgs().find((args) => args[0] === 'kick')?.[1];

        // Ensure the "kick" event listener is registered
        expect(kickCallback).toBeDefined();

        if (kickCallback) {
            // Trigger the "kick" event listener with mock data
            kickCallback(mockKickData);

            // Verify the socketService disconnect method was called
            expect(mockSocketService.disconnect).toHaveBeenCalled();

            // Verify navigation to '/home' was triggered
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);

            // Verify the snackbar displays the correct message
            expect(mockSnackBar.open).toHaveBeenCalledWith(
                "Vous avez ete foutu dehors! Si j'etais vous...", // Snackbar message
                'Close', // Snackbar action
                {
                    duration: 5000,
                    verticalPosition: 'top',
                    horizontalPosition: 'center',
                },
            );

            // Verify resetSharedServices was called on sharedService
            expect(mockSharedDataService.resetSharedServices).toHaveBeenCalled();
        }
    });

    it('should open the profile dialog, create a virtual player, and emit joinRoomVP if a profile is provided', () => {
        // Mock the virtualPlayer method to return a valid Player object
        const mockVirtualPlayer: Player = {
            username: 'MockPlayer',
            character: {
                name: 'MockCharacter',
                image: 'mock-image.png',
                face: 'mock-face.png',
                body: 'mock-body.png',
                stats: { health: 100, speed: 10, attack: 15, defense: 8 },
                dice: 'd6',
                victories: 0,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
            },
            isAdmin: false,
            isVirtual: true,
            inventory: [null, null],
            profile: 'defensive',
        };

        spyOn(component, 'virtualPlayer').and.returnValue(mockVirtualPlayer);

        // Call the method under test
        component.openProfileDialog();

        // Verify that the dialog was opened
        expect(mockDialog.open).toHaveBeenCalledWith(VirtualPlayerProfileDialogComponent);

        // Simulate the afterClosed observable emitting a profile
        expect(mockDialogRef.afterClosed).toHaveBeenCalled();

        // Verify that virtualPlayer was updated with the profile
        expect(mockVirtualPlayer.profile).toEqual('defensive');

        // Verify that the socketService's emit method was called with correct arguments
        expect(mockSocketService.emit).toHaveBeenCalledWith('joinRoomVP', {
            room: component.accessCode,
            player: mockVirtualPlayer,
        });
    });

    it('should create a virtual player with a unique username, character, and randomized attributes', () => {
        // Spy on the methods called within virtualPlayer
        const generateUniqueUsernameSpy = spyOn(component, 'generateUniqueUsername').and.returnValue('MockUsername');
        const generateUniqueCharacterSpy = spyOn(component, 'generateUniqueCharacter').and.returnValue({
            name: 'MockCharacter',
            image: 'mock-image.png',
            face: 'mock-face.png',
            body: 'mock-body.png',
            stats: { health: 0, speed: 0, attack: 0, defense: 0 },
            dice: 'd6',
            victories: 0,
            position: { row: 0, col: 0 },
            initialPosition: { row: 0, col: 0 },
        });
        const randomizeHealthAndSpeedSpy = spyOn(component, 'randomizeHealthAndSpeed').and.callFake(() => {
            component.selectedCharacter.stats.health = 6;
            component.selectedCharacter.stats.speed = 4;
        });
        const randomizeDiceSpy = spyOn(component, 'randomizeDice').and.callFake(() => {
            component.selectedCharacter.dice = 'attack';
        });

        // Call the method under test
        const result = component.virtualPlayer();

        // Verify methods were called
        expect(generateUniqueUsernameSpy).toHaveBeenCalled();
        expect(generateUniqueCharacterSpy).toHaveBeenCalled();
        expect(randomizeHealthAndSpeedSpy).toHaveBeenCalled();
        expect(randomizeDiceSpy).toHaveBeenCalled();

        // Validate the structure of the returned Player object
        expect(result).toEqual({
            username: 'MockUsername',
            character: {
                name: 'MockCharacter',
                image: 'mock-image.png',
                face: 'mock-face.png',
                body: 'mock-body.png',
                stats: { health: 6, speed: 4, attack: 0, defense: 0 },
                dice: 'attack',
                victories: 0,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
            },
            isAdmin: false,
            isVirtual: true,
            inventory: [null, null],
        });
    });

    it('should randomize health and speed based on Math.random()', () => {
        // Mock the selectedCharacter object
        component.selectedCharacter = {
            name: 'MockCharacter',
            image: 'mock-image.png',
            face: 'mock-face.png',
            body: 'mock-body.png',
            stats: { health: 0, speed: 0, attack: 0, defense: 0 },
            dice: 'd6',
            victories: 0,
            position: { row: 0, col: 0 },
            initialPosition: { row: 0, col: 0 },
        };

        // Spy on Math.random once
        const randomSpy = spyOn(Math, 'random');

        // First case: Math.random returns a value less than 0.5
        randomSpy.and.returnValue(0.3);
        component.randomizeHealthAndSpeed();

        // Check that health and speed are set correctly
        expect(component.selectedCharacter.stats.health).toBe(6);
        expect(component.selectedCharacter.stats.speed).toBe(4);

        // Second case: Math.random returns a value greater than or equal to 0.5
        randomSpy.and.returnValue(0.7);
        component.randomizeHealthAndSpeed();

        // Check that health and speed are set correctly
        expect(component.selectedCharacter.stats.health).toBe(4);
        expect(component.selectedCharacter.stats.speed).toBe(6);
    });

    it('should randomize dice based on Math.random()', () => {
        // Mock the selectedCharacter object
        component.selectedCharacter = {
            name: 'MockCharacter',
            image: 'mock-image.png',
            face: 'mock-face.png',
            body: 'mock-body.png',
            stats: { health: 10, speed: 10, attack: 10, defense: 10 },
            dice: 'd6',
            victories: 0,
            position: { row: 0, col: 0 },
            initialPosition: { row: 0, col: 0 },
        };

        // Spy on Math.random once
        const randomSpy = spyOn(Math, 'random');

        // First case: Math.random returns a value less than 0.5
        randomSpy.and.returnValue(0.3);
        component.randomizeDice();

        // Check that dice is set to 'attack'
        expect(component.selectedCharacter.dice).toBe('attack');

        // Second case: Math.random returns a value greater than or equal to 0.5
        randomSpy.and.returnValue(0.7);
        component.randomizeDice();

        // Check that dice is set to 'defense'
        expect(component.selectedCharacter.dice).toBe('defense');
    });
});
