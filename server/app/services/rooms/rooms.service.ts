import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomsService {
    private activeRooms: Set<string> = new Set();

    createRoom(room: string): void {
        this.activeRooms.add(room);
    }

    roomExists(room: string): boolean {
        return this.activeRooms.has(room);
    }

    removeRoom(room: string): void {
        this.activeRooms.delete(room);
    }

    getActiveRooms(): Set<string> {
        return this.activeRooms;
    }
}
