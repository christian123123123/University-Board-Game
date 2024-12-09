import { Injectable } from '@angular/core';
import { Player } from '@app/interfaces/Player';
import { MovementService } from '@app/services/match/movement/movement.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TurnSystemService {
    turnOrder: Player[] = [];
    roundOrder: Player[] = [];
    roundOrderSubject = new BehaviorSubject<Player[]>([]);
    turnOrderSubject = new BehaviorSubject<Player[]>([]);
    turnOrder$ = this.turnOrderSubject.asObservable();
    roundOrder$ = this.roundOrderSubject.asObservable();

    activeFighterSubject = new BehaviorSubject<Player | undefined>(undefined);
    activeFighter$ = this.activeFighterSubject.asObservable();
    activePlayerSubject = new BehaviorSubject<Player | null>(null);
    activePlayer$ = this.activePlayerSubject.asObservable();

    initialTurnOrderSet = false;
    turnStartTime: number | null = null;
    roundStartTime: number | null = null;
    turnDuration: number = 30;
    roundDuration: number = 5;
    turnTimeLeft: number = this.turnDuration;
    roundTimeLeft: number = this.roundDuration;
    turnTimeLeftSubject = new BehaviorSubject<number>(this.turnTimeLeft);
    roundTimeLeftSubject = new BehaviorSubject<number>(this.roundTimeLeft);
    turnTimeLeft$ = this.turnTimeLeftSubject.asObservable();
    roundTimeLeft$ = this.roundTimeLeftSubject.asObservable();

    notificationTimer: ReturnType<typeof setInterval>;
    _notificationTimeLeft = new BehaviorSubject<number>(3);
    notificationTimeLeft$ = this._notificationTimeLeft.asObservable();
    _showNotification = new BehaviorSubject<boolean>(true);
    showNotification$ = this._showNotification.asObservable();
    currentTurnIndex: number = 0;
    currentRoundIndex: number = 0;
    turnTimer: ReturnType<typeof setInterval>;
    roundTimer: ReturnType<typeof setInterval>;
    public actionUsed = false;
    isPaused = false;
    isCombatPaused = false;
    animationFrameId: number | null = null;

    actionsLefts = 1;
    actionsLeftsSubject = new BehaviorSubject<number>(this.actionsLefts);
    actionsLefts$ = this.actionsLeftsSubject.asObservable();

    remainingSpeed: number = 0;
    remainingSpeedSubject = new BehaviorSubject<number>(this.remainingSpeed);
    remainingSpeed$ = this.remainingSpeedSubject.asObservable();

    combatTimeLeft: number = 5;
    combatTimer: ReturnType<typeof setInterval>;
    combatTimeLeftSubject = new BehaviorSubject<number>(this.combatTimeLeft);
    combatTimeLeft$ = this.combatTimeLeftSubject.asObservable();

    constructor(
        readonly socketService: SocketService,
        readonly sharedService: SharedDataService,
        readonly movementService: MovementService,
    ) {}
    //waiting room
    initialize(players: Player[], forceReinitialize = false): void {
        if (!this.initialTurnOrderSet || forceReinitialize) {
            this.turnOrder = players;
            this.turnOrderSubject.next(this.turnOrder);
            this.initialTurnOrderSet = true;
        }
    }

    //combat (initialize and reorders the players properly)
    initializeCombat(players: Player[], room: string): void {
        this.roundOrder = players;
        this.roundOrderSubject.next(this.roundOrder);
        this.currentRoundIndex = 0;
    }

    // in game page and match board (if you can use the action button)
    canPerformAction(): boolean {
        return !this.actionUsed;
    }
    // in game page and match board (determines if action is used )
    useAction(): void {
        this.actionUsed = true;
    }
    resetAction(): void {
        this.actionUsed = false;
    }
    // in combat et game page (when players quits)
    removePlayerFromTurnOrder(username: string): void {
        const playerIndex = this.turnOrder.findIndex((player) => player.username === username);

        if (playerIndex !== -1) {
            this.turnOrder.splice(playerIndex, 1);

            if (this.currentTurnIndex >= this.turnOrder.length) {
                this.currentTurnIndex = 0;
            } else if (this.currentTurnIndex > playerIndex) {
                this.currentTurnIndex--;
            }
        }
    }
}
