import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CharacterBonusComponent } from '@app/components/character-bonus/character-bonus.component';
import { CharacterStatsComponent } from '@app/components/character-stats/character-stats.component';
import { CharactersBoardComponent } from '@app/components/characters-board/characters-board.component';
import { Character } from '@app/interfaces/Character';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';

@Component({
    selector: 'app-creation-form',
    standalone: true,
    imports: [CharactersBoardComponent, FormsModule, CharacterStatsComponent, CharacterBonusComponent, CommonModule],
    templateUrl: './creation-form.component.html',
    styleUrl: './creation-form.component.scss',
})
export class CreationFormComponent implements OnInit {
    @Input() selectedCharacter: Character;
    gameId: string;
    username: string = '';
    bonusAppliedState = { health: false, speed: false };
    diceAssignedState = { attack: false, defense: false };
    charactersFaces: string[] = [];
    accessCode: string | null = null;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { gameId: string; isJoining: boolean },
        readonly dialogRef: MatDialogRef<CreationFormComponent>,
        readonly router: Router,
        readonly socketService: SocketService,
        readonly sharedService: SharedDataService,
        readonly snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.socketService.connect();

        this.socketService.on(
            'checkDuplicateNameResponse',
            (res: { exists: boolean; charactersInRoom: string[]; playerUpdatedName: string; game: Game }) => {
                const playerData = {
                    username: this.username,
                    character: this.selectedCharacter,
                    isAdmin: false,
                    inventory: [null, null] as [string | null, string | null],
                };
                const accessCode = this.sharedService.getAccessCode();
                this.sharedService.setAccessCode(accessCode);
                if (res.exists) {
                    if (this.isLobbyFull(res.charactersInRoom, res.game.mapSize)) {
                        this.snackBar.open('Cette partie est remplie :(', 'Ok', {
                            duration: 3000,
                            verticalPosition: 'top',
                            horizontalPosition: 'center',
                        });
                        this.dialogRef.close();
                        return;
                    }
                    if (res.charactersInRoom.includes(this.selectedCharacter.name)) {
                        this.snackBar.open("Cet avatar vient d'être séléctionné par un autre utilisateur. Veuillez en choisir un autre.", 'Ok', {
                            duration: 5000,
                            verticalPosition: 'top',
                            horizontalPosition: 'center',
                        });
                        return;
                    }
                    playerData.username = res.playerUpdatedName;
                    this.sharedService.setPlayer(playerData);
                    this.router.navigate(['/waiting-room']);
                    this.dialogRef.close();
                } else {
                    this.sharedService.setPlayer(playerData);
                    this.router.navigate(['/waiting-room']);
                    this.dialogRef.close();
                }
            },
        );
    }

    onCharacterSelected(character: Character): void {
        this.selectedCharacter = { ...character };
    }

    onBonusApplied(event: { health: boolean; speed: boolean }): void {
        this.bonusAppliedState = event;
    }

    onDiceAssigned(event: { attack: boolean; defense: boolean }): void {
        this.diceAssignedState = event;
    }

    canShowSubmit(): boolean {
        return (
            !!this.username &&
            !!this.selectedCharacter &&
            (this.bonusAppliedState.health || this.bonusAppliedState.speed) &&
            (this.diceAssignedState.attack || this.diceAssignedState.defense)
        );
    }

    onSubmit(): void {
        if (this.canShowSubmit()) {
            if (this.data.isJoining) {
                this.joinMatch();
            } else {
                this.createMatch();
            }
        }
    }

    isLobbyFull(players: string[], gameSize: string): boolean {
        const PETITE_MAX = 2;
        const MEDIUM_MAX = 4;
        const LARGE_MAX = 6;
        const playersCount = players.length || 0;

        if (
            (gameSize === 'petite' && playersCount === PETITE_MAX) ||
            (gameSize === 'moyenne' && playersCount === MEDIUM_MAX) ||
            (gameSize === 'grande' && playersCount === LARGE_MAX)
        ) {
            return true;
        }
        return false;
    }

    createMatch(): void {
        if (this.canShowSubmit()) {
            const player: Player = { username: this.username, character: this.selectedCharacter, isAdmin: true, inventory: [null, null] };
            this.router.navigate(['/waiting-room']);
            this.sharedService.setPlayer(player);
            const game = this.sharedService.getGame();
            this.sharedService.setGame(game);
            const accessCode = this.generateAccessCode();
            this.sharedService.setAccessCode(accessCode);
            this.dialogRef.close();
        }
    }

    joinMatch(): void {
        const accessCode = this.sharedService.getAccessCode();
        this.socketService.emit('checkDuplicateName', { accessCode, playerName: this.username });
    }

    onCancel(): void {
        this.dialogRef.close();
        this.socketService.disconnect();
    }

    private generateAccessCode(): string {
        const LENGTH = 4;
        const CHARS = '0123456789';
        let code = '';
        for (let i = 0; i < LENGTH; i++) {
            const RANDOMINDEX: number = Math.floor(Math.random() * CHARS.length);
            code += CHARS.charAt(RANDOMINDEX);
        }
        return code;
    }
}
