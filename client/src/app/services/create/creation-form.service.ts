import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CreationFormComponent } from '@app/components/creation-form/creation-form.component';

@Injectable({
    providedIn: 'root',
})
export class CreationFormService {
    constructor(
        readonly dialog: MatDialog,
        readonly router: Router,
    ) {}

    openCreationForm(gameId: string, isJoining: boolean) {
        this.dialog.open(CreationFormComponent, {
            data: { gameId, isJoining },
        });
    }
}
