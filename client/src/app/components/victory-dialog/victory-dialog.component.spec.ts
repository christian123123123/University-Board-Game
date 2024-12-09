import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VictoryDialogComponent } from './victory-dialog.component';

describe('VictoryDialogComponent', () => {
    let component: VictoryDialogComponent;
    let fixture: ComponentFixture<VictoryDialogComponent>;
    const mockDialogData = { title: 'Victory!', message: 'You have won the game!' };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VictoryDialogComponent],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: mockDialogData }],
        }).compileComponents();

        fixture = TestBed.createComponent(VictoryDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
