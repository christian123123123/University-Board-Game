import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { HomeButtonComponent } from '@app/components/home-button/home-button.component';

@Component({
    selector: 'app-create-page',
    standalone: true,
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
    imports: [RouterLink, GameListComponent, HomeButtonComponent],
    encapsulation: ViewEncapsulation.None,
})
export class CreatePageComponent {}
