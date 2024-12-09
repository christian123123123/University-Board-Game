import { provideHttpClient } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '@app/services/socket/socket.service';
import { JournalComponent } from './journal-de-bord.component';
import { Player } from '@app/interfaces/Player';

describe('JournalComponent', () => {
    let component: JournalComponent;
    let fixture: ComponentFixture<JournalComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let routeStub: Partial<ActivatedRoute>;
    const mockPlayers: Player[] = [
        {
            username: 'Player1',
            character: {
                name: 'Warrior',
                image: 'path/to/warrior/image.png',
                face: 'path/to/warrior/face.png',
                body: 'path/to/warrior/body.png',
                stats: { health: 100, attack: 20, defense: 15, speed: 10 }, // Assuming Stats has these fields
                dice: 'd20',
                victories: 5,
                position: { row: 0, col: 1 },
                initialPosition: { row: 0, col: 0 },
                effects: ['Boost', 'Shield'],
                hasFlag: true,
            },
            isAdmin: true,
            inventory: ['Sword', 'Shield'],
            profile: 'path/to/player1.png',
        },
        {
            username: 'Player2',
            character: {
                name: 'Mage',
                image: 'path/to/mage/image.png',
                face: 'path/to/mage/face.png',
                body: 'path/to/mage/body.png',
                stats: { health: 80, attack: 30, defense: 10, speed: 12 },
                dice: 'd10',
                victories: 3,
                position: { row: 1, col: 2 },
                initialPosition: { row: 1, col: 1 },
            },
            isAdmin: false,
            inventory: ['Staff', null],
        },
    ];

    beforeEach(async () => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['someMethod']);
        routeStub = {};

        await TestBed.configureTestingModule({
            imports: [JournalComponent],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: ActivatedRoute, useValue: routeStub },
                { provide: ElementRef, useValue: { nativeElement: {} } },
                provideHttpClient(),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JournalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle showUserMessagesOnly when toggleUserMessages is called', () => {
        expect(component.showUserMessagesOnly).toBeFalse();

        component.toggleUserMessages();
        expect(component.showUserMessagesOnly).toBeTrue();

        component.toggleUserMessages();
        expect(component.showUserMessagesOnly).toBeFalse();
    });

    it('should initialize with correct default values', () => {
        expect(component.accessCode).toBe('');
        expect(component.inputMessage).toBe('');
        expect(component.messages).toEqual([]);
        expect(component.showUserMessagesOnly).toBeFalse();
        expect(component.welcomeMessage).toBe('');
    });

    it('should receive inputs correctly', () => {
        component.accessCode = 'testCode';
        component.welcomeMessage = 'Welcome!';
        component.currentRoute = '/test-route';
        component.roomJournal = [{ usersMentionned: [], text: 'Test Message' }];

        fixture.detectChanges();

        expect(component.accessCode).toBe('testCode');
        expect(component.welcomeMessage).toBe('Welcome!');
        expect(component.currentRoute).toBe('/test-route');
        expect(component.roomJournal).toEqual([{ usersMentionned: [], text: 'Test Message' }]);
    });

    it('should correctly determine if a user is mentioned in a message', () => {
        const myPlayer: Player = mockPlayers[0];
        const mentionedMessage = { 
            usersMentionned: [...mockPlayers], 
            text: 'Hello testUser!' 
        };
        const notMentionedMessage = { 
            usersMentionned: [mockPlayers[1]], 
            text: 'Hello anotherUser!' 
        };

        const isMentioned = component.isUserMentionned(mentionedMessage, myPlayer);
        expect(isMentioned).toBeTrue();

        const isNotMentioned = component.isUserMentionned(notMentionedMessage, myPlayer);
        expect(isNotMentioned).toBeFalse();
    });
});
