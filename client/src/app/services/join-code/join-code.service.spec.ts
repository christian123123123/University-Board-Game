import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JoinCodeComponent } from '@app/components/join-code/join-code.component';
import { JoinCodeService } from './join-code.service';

describe('JoinCodeService', () => {
    let service: JoinCodeService;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        TestBed.configureTestingModule({
            providers: [JoinCodeService, { provide: MatSnackBar, useValue: snackBarSpy }],
        });
        service = TestBed.inject(JoinCodeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('#validateInput', () => {
        it('should allow numeric input', () => {
            const event = new KeyboardEvent('keydown', { key: '5' });
            const preventDefaultSpy = spyOn(event, 'preventDefault');

            service.validateInput(event);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
        });

        it('should prevent non-numeric input', () => {
            const event = new KeyboardEvent('keydown', { key: 'a' });
            const preventDefaultSpy = spyOn(event, 'preventDefault');

            service.validateInput(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('#checkIfLobbyFull', () => {
        let mockComponent: Partial<JoinCodeComponent>;

        beforeEach(() => {
            mockComponent = { isLobbyFull: false } as JoinCodeComponent;
        });

        it('should set isLobbyFull to true if game size is "petite" and currentPlayers >= 2', () => {
            mockComponent.gameSize = 'petite';
            service.checkIfLobbyFull(mockComponent as JoinCodeComponent, 2);

            expect(mockComponent.isLobbyFull).toBeTrue();
        });

        it('should set isLobbyFull to false if game size is "petite" and currentPlayers < 2', () => {
            mockComponent.gameSize = 'petite';
            service.checkIfLobbyFull(mockComponent as JoinCodeComponent, 1);

            expect(mockComponent.isLobbyFull).toBeFalse();
        });

        it('should set isLobbyFull to true if game size is "moyenne" and currentPlayers >= 4', () => {
            const VALUE = 4;
            mockComponent.gameSize = 'moyenne';
            service.checkIfLobbyFull(mockComponent as JoinCodeComponent, VALUE);

            expect(mockComponent.isLobbyFull).toBeTrue();
        });

        it('should set isLobbyFull to false if game size is "moyenne" and currentPlayers < 4', () => {
            const VALUE = 3;
            mockComponent.gameSize = 'moyenne';
            service.checkIfLobbyFull(mockComponent as JoinCodeComponent, VALUE);

            expect(mockComponent.isLobbyFull).toBeFalse();
        });

        it('should set isLobbyFull to true if game size is "grande" and currentPlayers >= 6', () => {
            const VALUE = 6;
            mockComponent.gameSize = 'grande';
            service.checkIfLobbyFull(mockComponent as JoinCodeComponent, VALUE);

            expect(mockComponent.isLobbyFull).toBeTrue();
        });

        it('should set isLobbyFull to false if game size is "grande" and currentPlayers < 6', () => {
            const VALUE = 5;
            mockComponent.gameSize = 'grande';
            service.checkIfLobbyFull(mockComponent as JoinCodeComponent, VALUE);

            expect(mockComponent.isLobbyFull).toBeFalse();
        });
    });
});
