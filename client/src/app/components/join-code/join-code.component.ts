import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { CreationFormService } from '@app/services/create/creation-form.service';
import { GamesService } from '@app/services/games/games.service';
import { JoinCodeService } from '@app/services/join-code/join-code.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
@Component({
    selector: 'app-join-code',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './join-code.component.html',
    styleUrl: './join-code.component.scss',
})
export class JoinCodeComponent implements OnInit {
    accessCode: string = '';
    game: Game | null = null;
    gameId: string = '';
    gameSize: string | null = null;
    errorMessage: string | null = null;
    isLobbyFull: boolean = false;

    constructor(
        private dialogRef: MatDialogRef<JoinCodeComponent>,
        private creationFormService: CreationFormService,
        readonly gameService: GamesService,
        readonly joinCodeService: JoinCodeService,
        readonly socketService: SocketService,
        readonly sharedService: SharedDataService,
    ) {}

    ngOnInit(): void {
        this.socketService.connect();

        this.socketService.on(
            'checkRoomExistenceResponse',
            (response: { exists: boolean; accessible: boolean; playersInRoom: Player[]; game: Game }) => {
                if (response.exists && response.accessible) {
                    const game = response.game;
                    this.gameSize = game.mapSize;
                    this.joinCodeService.checkIfLobbyFull(this, response.playersInRoom.length);
                    this.sharedService.setPlayersInGame(response.playersInRoom);
                    if (this.isLobbyFull) {
                        this.errorMessage = 'Le salon est plein. Impossible de joindre.';
                    } else {
                        this.errorMessage = null;
                        this.sharedService.setAccessCode(this.accessCode);
                        this.dialogRef.close();
                        this.creationFormService.openCreationForm(game._id, true);
                    }
                } else if (response.exists) {
                    this.errorMessage = 'Ce salon est verrouillé.';
                } else {
                    this.errorMessage = 'Code invalide. Veuillez réessayer.';
                }
            },
        );
    }

    onSubmit(): void {
        this.socketService.emit('checkRoomExistence', { accessCode: this.accessCode });
    }

    onCancel(): void {
        this.dialogRef.close();
        this.socketService.disconnect();
    }
}
