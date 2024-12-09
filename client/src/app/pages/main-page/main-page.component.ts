import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { JoinCodeComponent } from '@app/components/join-code/join-code.component';

@Component({
    selector: 'app-main-page',
    standalone: true,
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink],
})
export class MainPageComponent {
    readonly title: string = 'ROAD TO GLORY';
    constructor(public dialog: MatDialog) {}

    joinButton(): void {
        this.dialog.open(JoinCodeComponent);
    }
}
