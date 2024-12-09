import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { WaitingRoomPageComponent } from '@app/pages/waiting-room-page/waiting-room-page.component';

@Component({
    selector: 'app-virtual-player-profile-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './virtual-player-profile-dialog.component.html',
    styleUrl: './virtual-player-profile-dialog.component.scss',
})
export class VirtualPlayerProfileDialogComponent {
    selectedProfile: string | null = null;
    @ViewChild(WaitingRoomPageComponent) waitingRoom: WaitingRoomPageComponent;

    constructor(public dialogRef: MatDialogRef<VirtualPlayerProfileDialogComponent>) {}

    selectProfile(profile: string) {
        this.selectedProfile = profile;
    }

    submitSelection() {
        if (this.selectedProfile) {
            setTimeout(() => {
                this.dialogRef.close(this.selectedProfile);
            }, 300);
        }
    }
}
