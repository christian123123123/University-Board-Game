import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EndGameDialogComponent } from './end-game-dialog.component';

describe('EndGameDialogComponent', () => {
    let component: EndGameDialogComponent;

    const mockDialogData = {
        title: 'Game Over',
        message: 'Player 1 wins!',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [EndGameDialogComponent],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: mockDialogData }],
        });

        component = TestBed.createComponent(EndGameDialogComponent).componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should have correct title and message from MAT_DIALOG_DATA', () => {
        expect(component.data.title).toBe('Game Over');
        expect(component.data.message).toBe('Player 1 wins!');
    });
});
