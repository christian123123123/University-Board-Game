import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CreationFormComponent } from '@app/components/creation-form/creation-form.component';
import { CreationFormService } from './creation-form.service';

describe('CreationFormService', () => {
    let service: CreationFormService;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        const dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            providers: [
                CreationFormService,
                { provide: MatDialog, useValue: dialogMock },
                { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
            ],
        });

        service = TestBed.inject(CreationFormService);
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    });

    it('should open the CreationFormComponent dialog with the correct data when isJoining is true', () => {
        const gameId = 'testGameId';
        const isJoining = true;

        service.openCreationForm(gameId, isJoining);

        expect(dialogSpy.open).toHaveBeenCalledWith(CreationFormComponent, {
            data: { gameId, isJoining },
        });
    });

    it('should open the CreationFormComponent dialog with the correct data when isJoining is false', () => {
        const gameId = 'testGameId';
        const isJoining = false;

        service.openCreationForm(gameId, isJoining);

        expect(dialogSpy.open).toHaveBeenCalledWith(CreationFormComponent, {
            data: { gameId, isJoining },
        });
    });
});
