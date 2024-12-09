import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CHARACTERS } from '@app/components/characters-board/constant-characters-board';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { VirtualPlayerProfileDialogComponent } from '@app/components/virtual-player-profile-dialog/virtual-player-profile-dialog.component';
import { Character } from '@app/interfaces/Character';
import { Game } from '@app/interfaces/Game';
import { Match } from '@app/interfaces/Match';
import { Player } from '@app/interfaces/Player';
import { Tiles } from '@app/interfaces/Tiles';
import { browserRefresh } from '@app/pages/app/app.component';
import { BoardService } from '@app/services/edit/board/board.service';
import { TurnSystemService } from '@app/services/game-page/turn-system.service';
import { GamesService } from '@app/services/games/games.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { WaitingRoomService } from '@app/services/waiting-room/waiting-room.service';

@Component({
    selector: 'app-waiting-room-page',
    standalone: true,
    imports: [CommonModule, ChatBoxComponent],
    templateUrl: './waiting-room-page.component.html',
    styleUrl: './waiting-room-page.component.scss',
})
export class WaitingRoomPageComponent implements OnInit, OnDestroy {
    accessCode: string = '';
    matchId: string | null = null;
    match: Match | null = null;
    game: Game | null = null;
    gameId: string = '';
    gameSize: string | null = null;
    player: Player;
    currentPlayer: Player | undefined = undefined;
    welcomeMessage: string = '';
    roomUsers: { [room: string]: Player[] } = {};
    isAdmin: boolean = false;
    isAccessible: boolean = false;
    chatRoomHistory: { user: string; text: string; time: Date }[] = [];

    @Input() selectedCharacter: Character;
    username: string = '';
    bonusAppliedState = { health: false, speed: false };
    diceAssignedState = { attack: false, defense: false };
    names: string[] = ['Bot1', 'Bot2', 'Bot3', 'Bot4', 'Bot5', 'Bot6', 'Bot7', 'Bot8', 'Bot9', 'Bot10'];
    stats: number;

    constructor(
        readonly socketService: SocketService,
        readonly snackBar: MatSnackBar,
        readonly router: Router,
        readonly gameService: GamesService,
        readonly waitingRoomService: WaitingRoomService,
        readonly boardService: BoardService,
        readonly sharedService: SharedDataService,
        readonly turnSystemService: TurnSystemService,
        readonly dialog: MatDialog,
    ) {}

    ngOnInit(): void {
        this.socketService.connect();

        if (browserRefresh) {
            this.router.navigate(['/home']);
            return;
        }
        this.player = this.sharedService.getPlayer();
        this.isAdmin = this.player.isAdmin;
        this.accessCode = this.sharedService.getAccessCode();
        if (this.isAdmin) {
            this.game = this.sharedService.getGame();
            this.gameSize = this.game.mapSize;
        } else {
            this.game = null;
        }
        this.setupListeners();
    }

    ngOnDestroy(): void {
        this.socketService.off('joinRoom');
        this.socketService.off('roomData');
        this.socketService.off('adminLeft');
        this.socketService.off('kick');
    }

    setupListeners(): void {
        this.socketService.off('joinRoom');
        this.socketService.off('roomData');
        this.socketService.off('adminLeft');
        this.socketService.off('kick');
        this.socketService.emit(
            'joinRoom',
            { room: this.accessCode, player: this.player, game: this.game },
            (res: { welcomeMessageFromServer: string; chatHistory: { user: string; text: string; time: Date }[]; gameMap: Game }) => {
                this.welcomeMessage = res.welcomeMessageFromServer;
                this.chatRoomHistory = res.chatHistory;
                this.game = res.gameMap;
                this.sharedService.setGame(this.game);
            },
        );

        this.socketService.on('roomData', (res: { currentRoom: string; players: Player[]; accessibility: boolean }) => {
            this.roomUsers[res.currentRoom] = res.players;
            if (this.waitingRoomService.isLobbyFull(this)) {
                this.isAccessible = false;
            } else {
                this.isAccessible = res.accessibility;
            }
        });

        this.socketService.on('accessibilityToggled', (res: { accessibility: boolean }) => {
            this.isAccessible = res.accessibility;
        });

        this.socketService.on('kick', (data: { player: Player }) => {
            if (data.player.username === this.player.username) {
                this.socketService.disconnect();
                this.router.navigate(['/home']);
                this.snackBar.open("Vous avez ete foutu dehors! Si j'etais vous...", 'Close', {
                    duration: 5000,
                    verticalPosition: 'top',
                    horizontalPosition: 'center',
                });
                this.sharedService.resetSharedServices();
            }
        });

        this.socketService.on('adminLeft', () => {
            this.socketService.disconnect();
            this.router.navigate(['/home']);
            this.snackBar.open("L'organisateur de la partie a quitter la chambre!", 'Close', {
                duration: 5000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
            });
            this.sharedService.resetSharedServices();
        });

        this.socketService.on('gameStarted', (res: { room: string; board: Tiles[][]; randomizedPlayers: Player[]; firstActivePlayer: Player }) => {
            this.sharedService.setBoard(res.board);
            this.sharedService.setPlayersInGame(res.randomizedPlayers);
            this.sharedService.setActivePlayer(res.firstActivePlayer);
            this.router.navigate(['/game']);
        });
    }
    openProfileDialog(): void {
        const profileDialog = this.dialog.open(VirtualPlayerProfileDialogComponent);

        profileDialog.afterClosed().subscribe((profile) => {
            if (!profile) {
                return;
            }
            const virtualPlayer = this.virtualPlayer();
            virtualPlayer.profile = profile;
            const updatedVirtualPlayer = virtualPlayer;
            // this.socketService.connectNPC();
            this.socketService.emit('joinRoomVP', { room: this.accessCode, player: updatedVirtualPlayer });
        });
    }

    virtualPlayer(): Player {
        this.username = this.generateUniqueUsername();
        this.selectedCharacter = this.generateUniqueCharacter();
        this.randomizeHealthAndSpeed();
        this.randomizeDice();
        return {
            username: this.username,
            character: this.selectedCharacter,
            isAdmin: false,
            isVirtual: true,
            inventory: [null, null],
        };
    }
    generateUniqueUsername(): string {
        let username: string;
        do {
            username = this.names[Math.floor(Math.random() * this.names.length)];
        } while (this.roomUsers[this.accessCode].some((player) => player.username === username));
        return username;
    }
    generateUniqueCharacter(): Character {
        let randomCharacter: Character;
        do {
            randomCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        } while (this.roomUsers[this.accessCode].some((player) => player.character.name === randomCharacter.name));
        return randomCharacter;
    }
    randomizeHealthAndSpeed(): void {
        if (Math.random() < 0.5) {
            this.selectedCharacter.stats.health = 6;
            this.selectedCharacter.stats.speed = 4;
        } else {
            this.selectedCharacter.stats.health = 4;
            this.selectedCharacter.stats.speed = 6;
        }
    }
    randomizeDice(): void {
        if (Math.random() < 0.5) {
            this.selectedCharacter.dice = 'attack';
        } else {
            this.selectedCharacter.dice = 'defense';
        }
    }
}
