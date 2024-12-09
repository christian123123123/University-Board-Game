import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CombatComponent } from '@app/components/combat/combat.component';
import { MatchBoardComponent } from '@app/components/match-board/match-board.component';
import { Player } from '@app/interfaces/Player';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { ActionService } from '@app/services/match/action/action.service';
import { SocketService } from '@app/services/socket/socket.service';

describe('ActionService', () => {
    let service: ActionService;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let mockMatchBoardComponent: jasmine.SpyObj<MatchBoardComponent>;

    beforeEach(() => {
        const dialogMock = jasmine.createSpyObj('MatDialog', ['open'], ['afterClosed']);
        const turnSystemServiceMock = jasmine.createSpyObj('TurnSystemService', ['someMethod']);
        const socketServiceMock = jasmine.createSpyObj('SocketService', ['emit']); // Include 'emit' here
        mockMatchBoardComponent = jasmine.createSpyObj('MatchBoardComponent', ['someMethod']);
        mockMatchBoardComponent.playersVictories = new Map(); // Mocking the playersVictories map
        TestBed.configureTestingModule({
            providers: [
                ActionService,
                { provide: MatDialog, useValue: dialogMock },
                { provide: TurnSystemService, useValue: turnSystemServiceMock },
                { provide: SocketService, useValue: socketServiceMock },
            ],
        });

        service = TestBed.inject(ActionService);
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set players', () => {
        const players: Player[] = [
            {
                username: 'player1',
                inventory: [null, null],
                character: {
                    body: 'avatar1',
                    name: 'Player One',
                    image: 'image1.png',
                    face: 'face1.png',
                    dice: 'defense',
                    victories: 0,
                    position: { row: 0, col: 0 },
                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                    initialPosition: { row: 0, col: 0 },
                },
                isAdmin: false,
            },
        ];
        service.setPlayers(players);
        expect(service.players).toEqual(players);
    });

    it('should set active player', () => {
        const activePlayer: Player = {
            username: 'player1',
            inventory: [null, null],
            character: {
                body: 'avatar1',
                name: 'Player One',
                image: 'image1.png',
                face: 'face1.png',
                dice: 'defense',
                victories: 0,
                position: { row: 0, col: 0 },
                stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                initialPosition: { row: 0, col: 0 },
            },
            isAdmin: false,
        };
        service.setActivePlayer(activePlayer);
        expect(service.activePlayer).toEqual(activePlayer);
    });

    it('should open attack dialog with correct data', () => {
        const attackedPlayer: Player = {
            username: 'attackedPlayer',
            inventory: [null, null],
            character: {
                body: 'avatar2',
                name: 'Player One',
                image: 'image1.png',
                face: 'face1.png',
                dice: 'defense',
                victories: 0,
                position: { row: 0, col: 0 },
                stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                initialPosition: { row: 0, col: 0 },
            },
            isAdmin: false,
        };
        const attackingPlayer: Player = {
            username: 'attackingPlayer',
            inventory: [null, null],
            character: {
                body: 'avatar1',
                name: 'Player One',
                image: 'image1.png',
                face: 'face1.png',
                dice: 'defense',
                victories: 0,
                position: { row: 0, col: 0 },
                stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                initialPosition: { row: 0, col: 0 },
            },
            isAdmin: true,
        };
        const playersInOrder: Player[] = [attackingPlayer, attackedPlayer];

        // Create a mock for afterClosed observable
        const mockAfterClosed = jasmine.createSpyObj('afterClosed', ['subscribe']);

        // Simulate afterClosed callback
        mockAfterClosed.subscribe.and.callFake((cb: (result: any) => void) => {
            cb({ winner: attackingPlayer, loser: attackedPlayer });
        });

        // Create a mock MatDialogRef with the afterClosed method
        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockDialogRef.afterClosed.and.returnValue(mockAfterClosed);

        // Ensure MatDialog.open returns the mock MatDialogRef
        dialogSpy.open.and.returnValue(mockDialogRef);

        // Call the method under test
        service.openAttackDialog(mockMatchBoardComponent, attackedPlayer, attackedPlayer, attackingPlayer, attackingPlayer, playersInOrder);

        // Verify MatDialog.open was called with the correct component and data
        expect(dialogSpy.open).toHaveBeenCalledWith(CombatComponent, {
            data: {
                victimPlayerAfterDice: attackedPlayer,
                victimPlayerBeforeDice: attackedPlayer,
                fightStarterAfterDice: attackingPlayer,
                fightStarterBeforeDice: attackingPlayer,
                playersInOrder: playersInOrder,
            },
        });

        // Verify afterClosed.subscribe was called
        expect(mockAfterClosed.subscribe).toHaveBeenCalled();
    });

    it('should return a player by avatar', () => {
        const players: Player[] = [
            {
                username: 'player1',
                inventory: [null, null],
                character: {
                    body: 'avatar1',
                    name: 'Player One',
                    image: 'image1.png',
                    face: 'face1.png',
                    dice: 'defense',
                    victories: 0,
                    position: { row: 0, col: 0 },
                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                    initialPosition: { row: 0, col: 0 },
                },
                isAdmin: false,
            },
            {
                username: 'player2',
                inventory: [null, null],
                character: {
                    body: 'avatar2',
                    name: 'Player One',
                    image: 'image1.png',
                    face: 'face1.png',
                    dice: 'defense',
                    victories: 0,
                    position: { row: 0, col: 0 },
                    initialPosition: { row: 0, col: 0 },

                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                },
                isAdmin: false,
            },
        ];
        service.setPlayers(players);

        const result = service.getPlayerByAvatar('avatar1');
        expect(result).toEqual(players[0]);
    });

    it('should return undefined if player with avatar is not found', () => {
        const players: Player[] = [
            {
                username: 'player1',
                inventory: [null, null],
                character: {
                    body: 'avatar1',
                    name: 'Player One',
                    image: 'image1.png',
                    face: 'face1.png',
                    dice: 'defense',
                    victories: 0,
                    position: { row: 0, col: 0 },
                    initialPosition: { row: 0, col: 0 },
                    stats: { health: 100, attack: 10, defense: 5, speed: 3 },
                },
                isAdmin: false,
            },
        ];
        service.setPlayers(players);

        const result = service.getPlayerByAvatar('avatar3');
        expect(result).toBeUndefined();
    });

    it('should handle dialog close with winner and loser correctly', () => {
        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        const mockAfterClosed = jasmine.createSpyObj('afterClosed', ['subscribe']);
        mockDialogRef.afterClosed.and.returnValue(mockAfterClosed);

        dialogSpy.open.and.returnValue(mockDialogRef);

        const mockComponent = jasmine.createSpyObj('MatchBoardComponent', [], {
            playersVictories: new Map<string, number>(),
        });

        const winner: Player = {
            username: 'WinnerPlayer',
            isAdmin: false,
            inventory: [null, null],
            character: {
                name: 'Winner Character',
                body: 'winner-avatar',
                image: 'winner-image.png',
                face: 'winner-face.png',
                dice: '1d6',
                victories: 0,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
                stats: { health: 100, attack: 20, defense: 10, speed: 5 },
            },
        };

        const loser: Player = {
            username: 'LoserPlayer',
            isAdmin: false,
            inventory: [null, null],
            character: {
                name: 'Loser Character',
                body: 'loser-avatar',
                image: 'loser-image.png',
                face: 'loser-face.png',
                dice: '1d6',
                victories: 0,
                position: { row: 1, col: 1 },
                initialPosition: { row: 1, col: 1 },
                stats: { health: 100, attack: 10, defense: 5, speed: 3 },
            },
        };

        mockAfterClosed.subscribe.and.callFake((callback: any) => {
            callback({ winner, loser });
        });

        const mockRoom = 'TestRoom';
        spyOn(service.sharedService, 'getAccessCode').and.returnValue(mockRoom);

        // Since the `emit` method is already mocked in `SocketService`, there's no need to spy on it again.
        // Ensure `emit` is properly mocked in `beforeEach` with `jasmine.createSpyObj`.
        service.openAttackDialog(mockComponent, loser, loser, winner, winner, [winner, loser]);

        expect(mockComponent.playersVictories.get(winner.username)).toBe(1);
        expect(service.socketService.emit).toHaveBeenCalledWith('victoryUpdate', {
            room: mockRoom,
            winner: { username: winner.username, isVirtual: winner.isVirtual },
            loser: loser.username,
            isFlagHome: false,
        });
    });

    it('should handle dialog close with winner only correctly', () => {
        const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        const mockAfterClosed = jasmine.createSpyObj('afterClosed', ['subscribe']);
        mockDialogRef.afterClosed.and.returnValue(mockAfterClosed);

        dialogSpy.open.and.returnValue(mockDialogRef);

        const mockComponent = jasmine.createSpyObj('MatchBoardComponent', [], {
            playersVictories: new Map<string, number>(),
        });

        const winner: Player = {
            username: 'WinnerPlayer',
            isAdmin: false,
            inventory: [null, null],
            character: {
                name: 'Winner Character',
                body: 'winner-avatar',
                image: 'winner-image.png',
                face: 'winner-face.png',
                dice: '1d6',
                victories: 0,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
                stats: { health: 100, attack: 20, defense: 10, speed: 5 },
            },
        };

        mockAfterClosed.subscribe.and.callFake((callback: any) => {
            callback({ winner, loser: undefined });
        });

        const mockRoom = 'TestRoom';
        spyOn(service.sharedService, 'getAccessCode').and.returnValue(mockRoom);

        // Do not use spyOn for emit again; it’s already a spy created in beforeEach
        service.openAttackDialog(mockComponent, winner, winner, winner, winner, [winner]);

        expect(mockComponent.playersVictories.get(winner.username)).toBe(1);
        expect(service.socketService.emit).toHaveBeenCalledWith('victoryUpdate', {
            room: mockRoom,
            winner: { username: winner.username, isVirtual: winner.isVirtual },
            loser: '',
            isFlagHome: false,
        });
    });
});
