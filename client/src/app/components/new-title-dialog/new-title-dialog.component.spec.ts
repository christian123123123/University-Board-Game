import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NewTitleDialogComponent } from './new-title-dialog.component';

describe('NewTitleDialogComponent', () => {
    let component: NewTitleDialogComponent;
    let fixture: ComponentFixture<NewTitleDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NewTitleDialogComponent, NoopAnimationsModule],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: { newTitle: 'Test Title' }, // Mocked dialog data
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NewTitleDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(); // Trigger change detection
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with the provided dialog data', () => {
        expect(component.data.newTitle).toBe('Test Title');
    });
});
