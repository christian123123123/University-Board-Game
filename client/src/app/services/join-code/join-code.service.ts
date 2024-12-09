import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JoinCodeComponent } from '@app/components/join-code/join-code.component';

@Injectable({
    providedIn: 'root',
})
export class JoinCodeService {
    constructor(readonly snackBar: MatSnackBar) {}

    validateInput(event: KeyboardEvent): void {
        const key = event.key;
        if (!/^[0-9]$/.test(key)) {
            event.preventDefault();
        }
    }

    checkIfLobbyFull(component: JoinCodeComponent, currentPlayers: number): void {
        const MAX_PETITE = 2;
        const MAX_MEDIUM = 4;
        const MAX_LARGE = 6;
        if (
            (component.gameSize === 'petite' && currentPlayers >= MAX_PETITE) ||
            (component.gameSize === 'moyenne' && currentPlayers >= MAX_MEDIUM) ||
            (component.gameSize === 'grande' && currentPlayers >= MAX_LARGE)
        ) {
            component.isLobbyFull = true;
        } else {
            component.isLobbyFull = false;
        }
    }
}
