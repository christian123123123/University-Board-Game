import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
@Injectable({
    providedIn: 'root',
})
export class SocketService {
    socket: Socket;
    public isConnected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    connect() {
        if (!this.socket || !this.socket.connected) {
            this.socket = io('http://ec2-35-182-90-158.ca-central-1.compute.amazonaws.com:3000/', { transports: ['websocket'] });

            this.socket.on('connect', () => {
                this.isConnected$.next(true);
            });
        }
    }

    connectNPC() {
        this.socket = io('http://ec2-35-182-90-158.ca-central-1.compute.amazonaws.com:3000/', { transports: ['websocket'] });
    }

    getSocketId(): string | null {
        return this.socket.id || null;
    }

    disconnect() {
        if (this.socket && this.socket.connected) {
            this.socket.disconnect();
            this.isConnected$.next(false);
        }
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    emit<T>(event: string, data?: T, callback?: Function): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }

    off(event: string): void {
        this.socket.off(event);
    }
}
