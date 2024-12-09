import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
    let service: RoomsService;

    beforeEach(() => {
        service = new RoomsService();
    });

    describe('#createRoom', () => {
        it('should add a new room to activeRooms and log creation', () => {
            const roomName = 'TestRoom';

            service.createRoom(roomName);

            expect(service.roomExists(roomName)).toBe(true);
        });

        it('should not add duplicate rooms', () => {
            const roomName = 'TestRoom';
            service.createRoom(roomName);
            service.createRoom(roomName);

            expect(service.getActiveRooms().size).toBe(1);
        });
    });

    describe('#roomExists', () => {
        it('should return true if the room exists', () => {
            const roomName = 'ExistingRoom';
            service.createRoom(roomName);

            expect(service.roomExists(roomName)).toBe(true);
        });

        it('should return false if the room does not exist', () => {
            expect(service.roomExists('NonExistentRoom')).toBe(false);
        });
    });

    describe('#removeRoom', () => {
        it('should remove a room from activeRooms and log removal', () => {
            const roomName = 'RoomToRemove';
            service.createRoom(roomName);

            service.removeRoom(roomName);

            expect(service.roomExists(roomName)).toBe(false);
        });

        it('should do nothing if the room does not exist', () => {
            const roomName = 'NonExistentRoom';
            const initialSize = service.getActiveRooms().size;

            service.removeRoom(roomName);

            expect(service.getActiveRooms().size).toBe(initialSize);
        });
    });

    describe('#getActiveRooms', () => {
        it('should return a Set of all active rooms', () => {
            const roomNames = ['Room1', 'Room2'];
            roomNames.forEach((room) => service.createRoom(room));

            const activeRooms = service.getActiveRooms();

            expect(activeRooms.size).toBe(roomNames.length);
            roomNames.forEach((room) => {
                expect(activeRooms.has(room)).toBe(true);
            });
        });
    });
});
