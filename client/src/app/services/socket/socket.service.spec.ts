import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';

describe('SocketService', () => {
    let service: SocketService;
    let mockSocket: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        mockSocket = jasmine.createSpyObj<Socket>('Socket', ['on', 'emit', 'disconnect', 'off', 'connect']);

        (window as any).io = jasmine.createSpy('io').and.returnValue(mockSocket);

        TestBed.configureTestingModule({
            providers: [SocketService, { provide: Socket, useValue: mockSocket }],
        });

        service = TestBed.inject(SocketService);
        service.socket = mockSocket;
        mockSocket.connected = false; // Simulate initial disconnected state
    });

    afterEach(() => {
        delete (window as any).io;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('#on', () => {
        it('should set up an event listener for the specified event', () => {
            const testEvent = 'testEvent';
            const testCallback = jasmine.createSpy('callback');

            service.on(testEvent, testCallback);
            expect(mockSocket.on).toHaveBeenCalledWith(testEvent, testCallback);
        });
    });

    describe('#emit', () => {
        it('should emit an event with data', () => {
            const testEvent = 'testEvent';
            const testData = { key: 'value' };

            service.emit(testEvent, testData);
            expect(mockSocket.emit).toHaveBeenCalledWith(testEvent, testData);
        });

        it('should emit an event with data and a callback', () => {
            const testEvent = 'testEvent';
            const testData = { key: 'value' };
            const testCallback = jasmine.createSpy('callback');

            service.emit(testEvent, testData, testCallback);
            expect(mockSocket.emit).toHaveBeenCalledWith(testEvent, testData, testCallback);
        });
    });

    describe('#off', () => {
        it('should remove an event listener for the specified event', () => {
            const testEvent = 'testEvent';

            service.off(testEvent);
            expect(mockSocket.off).toHaveBeenCalledWith(testEvent);
        });
    });

    describe('#connect', () => {
        it('should set isConnected$ to true when the socket connects', () => {
            // Ensure the socket is initially disconnected
            mockSocket.connected = false;

            const isConnectedSpy = spyOn(service.isConnected$, 'next'); // Spy on BehaviorSubject updates

            service.connect(); // Call the connect method

            // Simulate the "connect" event
            const connectCallback = mockSocket.on.calls.mostRecent()?.args[1];

            if (connectCallback) {
                connectCallback(); // Trigger the callback
                expect(isConnectedSpy).toHaveBeenCalledWith(true); // Validate BehaviorSubject update
            }
        });

        it('should not create a new socket if one is already connected', () => {
            mockSocket.connected = true; // Simulate an already connected socket

            service.connect();

            // Validate that io() was not called again
            expect((window as any).io).not.toHaveBeenCalled();
        });
    });

    it('should not reconnect if the socket is already connected', () => {
        // Set up an already connected socket
        service.socket = mockSocket;
        mockSocket.connected = true;

        // Call the connect method
        service.connect();

        // Verify that io was not called again
        expect((window as any).io).not.toHaveBeenCalled();

        // Verify that the socket remains unchanged
        expect(service.socket).toBe(mockSocket);
    });

    describe('#connectNPC', () => {
        it('should initialize the socket for NPC and log the socket ID', () => {
            const mockSocket = jasmine.createSpyObj<Socket>('Socket', ['on', 'emit', 'disconnect', 'off']);

            // Mock the io() function to return the mockSocket
            (window as any).io = jasmine.createSpy('io').and.returnValue(mockSocket);

            // Call connectNPC
            service.connectNPC();

            // Ensure io() was called with the correct parameters
            expect((window as any).io).toHaveBeenCalledWith('http://ec2-35-182-90-158.ca-central-1.compute.amazonaws.com:3000/', {
                transports: ['websocket'],
            });
        });
    });

    it('should return the socket id when the socket is connected', () => {
        // Setup mock socket with an id
        mockSocket.id = 'mock-socket-id';
        service.socket = mockSocket;

        // Call the method
        const socketId = service.getSocketId();

        // Assert that the socket ID is returned
        expect(socketId).toBe('mock-socket-id');
    });

    it('should return null when the socket is not connected', () => {
        // Setup mock socket without an id
        mockSocket.id = undefined;
        service.socket = mockSocket;

        // Call the method
        const socketId = service.getSocketId();

        // Assert that null is returned
        expect(socketId).toBeNull();
    });

    describe('#disconnect', () => {
        it('should disconnect the socket and update isConnected$ to false when the socket is connected', () => {
            // Set up the spy for the socket methods
            const mockSocket = jasmine.createSpyObj<Socket>('Socket', ['disconnect']);
            service.socket = mockSocket;

            // Spy on the BehaviorSubject's `next` method to track updates
            const isConnectedSpy = spyOn(service.isConnected$, 'next');

            // Simulate the socket being connected
            mockSocket.connected = true;

            // Call the disconnect method
            service.disconnect();

            // Check if the `disconnect` method on the socket was called
            expect(mockSocket.disconnect).toHaveBeenCalled();

            // Check if the `isConnected$` was updated to false
            expect(isConnectedSpy).toHaveBeenCalledWith(false);
        });

        it('should not attempt to disconnect and not update isConnected$ if the socket is not connected', () => {
            // Set up the spy for the socket methods
            const mockSocket = jasmine.createSpyObj<Socket>('Socket', ['disconnect']);
            service.socket = mockSocket;

            // Spy on the BehaviorSubject's `next` method
            const isConnectedSpy = spyOn(service.isConnected$, 'next');

            // Simulate the socket being disconnected
            mockSocket.connected = false;

            // Call the disconnect method
            service.disconnect();

            // Ensure that `disconnect` was not called since the socket is not connected
            expect(mockSocket.disconnect).not.toHaveBeenCalled();

            // Ensure that `isConnected$` was not updated
            expect(isConnectedSpy).not.toHaveBeenCalled();
        });
    });
});
