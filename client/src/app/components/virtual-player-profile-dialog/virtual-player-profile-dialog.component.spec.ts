import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { VirtualPlayerProfileDialogComponent } from './virtual-player-profile-dialog.component';

describe('VirtualPlayerProfileDialogComponent', () => {
    let component: VirtualPlayerProfileDialogComponent;
    let fixture: ComponentFixture<VirtualPlayerProfileDialogComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<VirtualPlayerProfileDialogComponent>>;

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [VirtualPlayerProfileDialogComponent],
            providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VirtualPlayerProfileDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('selectProfile', () => {
        it('should set selectedProfile when a profile is selected', () => {
            const profile = 'aggressive';
            component.selectProfile(profile);

            expect(component.selectedProfile).toBe(profile);
        });
    });

    describe('submitSelection', () => {
        it('should close the dialog with the selected profile after 300ms', (done) => {
            const profile = 'defensive';
            component.selectedProfile = profile;

            component.submitSelection();

            setTimeout(() => {
                expect(mockDialogRef.close).toHaveBeenCalledWith(profile);
                done();
            }, 300);
        });

        it('should not close the dialog if no profile is selected', () => {
            component.selectedProfile = null;

            component.submitSelection();

            expect(mockDialogRef.close).not.toHaveBeenCalled();
        });
    });
});
