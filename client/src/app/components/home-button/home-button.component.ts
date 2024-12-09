import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-home-button',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './home-button.component.html',
    styleUrl: './home-button.component.scss',
    encapsulation: ViewEncapsulation.None,
})
export class HomeButtonComponent {}
