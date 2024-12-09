import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-new-title-dialog',
    standalone: true,
    imports: [
        MatDialogModule,
        FormsModule, // Import FormsModule for ngModel
        MatFormFieldModule, // Material Form Field
        MatInputModule, // Material Input
        MatButtonModule, // Material Buttons
    ],
    templateUrl: './new-title-dialog.component.html',
    styleUrl: './new-title-dialog.component.scss',
})
export class NewTitleDialogComponent {
    constructor(@Inject(MAT_DIALOG_DATA) public data: { newTitle: string }) {}
}
