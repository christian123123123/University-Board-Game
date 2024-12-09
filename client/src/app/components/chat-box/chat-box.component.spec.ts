import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Character } from '@app/interfaces/Character';
import { Player } from '@app/interfaces/Player';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatBoxComponent } from './chat-box.component';

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let socketService: jasmine.SpyObj<SocketService>;

    const MOCK_CHARACTER: Character = {
        name: '',
        face: '',
        image: '',
        body: '',
        dice: '',
        stats: { attack: 0, defense: 0, health: 0, speed: 0 },
        disabled: false,
        victories: 0,
        position: { row: 0, col: 0 },
        initialPosition: { row: 0, col: 0 },
    };
    const MOCK_PLAYER: Player = { username: 'test1', isAdmin: true, character: { ...MOCK_CHARACTER }, inventory: ['', ''] };

    beforeEach(async () => {
        socketService = jasmine.createSpyObj('SocketService', ['on', 'off', 'emit']);

        await TestBed.configureTestingModule({
            imports: [ChatBoxComponent],
            providers: [provideRouter([]), { provide: SocketService, useValue: socketService }],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
        component.player = { ...MOCK_PLAYER };
        component.accessCode = 'testAccessCode';
        component.roomHistory = [
            { user: 'user1', text: 'Hello', time: new Date() },
            { user: 'user2', text: 'Hi there', time: new Date() },
        ];
        component.messagesContainer = {
            nativeElement: { scrollTop: 0, scrollHeight: 100 },
        } as ElementRef;

        fixture.detectChanges();
    });

    describe('ngAfterViewedCheck', () => {
        it('should scroll to bottom when shouldScroll is true in ngAfterViewChecked', () => {
            spyOn(component, 'scrollToBottom');
            component.shouldScroll = true;
            component.ngAfterViewChecked();
            expect(component.scrollToBottom).toHaveBeenCalled();
            expect(component.shouldScroll).toBeFalse();
        });
        it('should call scrollToBottom when shouldScroll is true', () => {
            spyOn(component, 'scrollToBottom');
            component.shouldScroll = true;
            component.ngAfterViewChecked();
            expect(component.scrollToBottom).toHaveBeenCalled();
            expect(component.shouldScroll).toBe(false);
        });
    });

    describe('scrollToBottom', () => {
        it('should scroll messagesContainer to the bottom', () => {
            const MAX_SCROLL_HEIGHT = 526;
            component.messagesContainer = {
                nativeElement: {
                    scrollTop: 0,
                    scrollHeight: MAX_SCROLL_HEIGHT,
                },
            } as ElementRef;

            component.scrollToBottom();
            expect(component.messagesContainer.nativeElement.scrollTop).toBe(MAX_SCROLL_HEIGHT);
        });
    });

    describe('setupListeners()', () => {
        it('should call setupListeners on ngOnInit', () => {
            spyOn(component, 'setupListeners');
            component.ngOnInit();
            expect(component.setupListeners).toHaveBeenCalled();
        });

        it('should subscribe to socket events in setupListeners', () => {
            component.setupListeners();
            expect(socketService.off).toHaveBeenCalledWith('roomMessage');
            expect(socketService.off).toHaveBeenCalledWith('messageFromServer');
            expect(socketService.on).toHaveBeenCalledWith('roomMessage', jasmine.any(Function));
            expect(socketService.on).toHaveBeenCalledWith('messageFromServer', jasmine.any(Function));
            expect(socketService.on).toHaveBeenCalledWith('clock', jasmine.any(Function));
        });

        it('should push a new message when roomMessage event is triggered', () => {
            const sampleMessage = { username: 'User1', message: 'Test message' };
            const initialMessageCount = component.messages.length;

            socketService.on.calls.argsFor(0)[1](sampleMessage);

            expect(component.messages.length).toBe(initialMessageCount + 1);
            expect(component.messages[initialMessageCount].text).toBe('Test message');
        });

        it('should push server message on messageFromServer event', () => {
            const serverMessage = 'Server announcement';
            const initialMessageCount = component.messages.length;

            socketService.on.calls.argsFor(1)[1](serverMessage);

            expect(component.messages.length).toBe(initialMessageCount + 1);
            expect(component.messages[initialMessageCount].text).toBe(serverMessage);
            expect(component.messages[initialMessageCount].user).toBe('server');
        });

        it('should handle clock event to update serverClock', () => {
            const testTime = new Date('2024-11-04T10:00:00Z');

            socketService.on.calls.argsFor(2)[1](testTime);

            expect(component.serverClock).toBe(testTime);
        });
    });
    describe('sendMessage', () => {
        it('should emit a message when inputMessage is non-empty', () => {
            component.inputMessage = 'Hello, world!';
            component.sendMessage();

            expect(socketService.emit).toHaveBeenCalledWith('sendMessage', {
                username: component.player.username,
                room: component.accessCode,
                message: 'Hello, world!',
                time: component.serverClock,
            });
            expect(component.inputMessage).toBe('');
            expect(component.shouldScroll).toBeTrue();
        });

        it('should not emit a message when inputMessage is empty', () => {
            component.inputMessage = '   ';
            component.sendMessage();

            expect(socketService.emit).not.toHaveBeenCalled();
            expect(component.inputMessage).toBe('   ');
            expect(component.shouldScroll).toBeFalse();
        });
    });
});
