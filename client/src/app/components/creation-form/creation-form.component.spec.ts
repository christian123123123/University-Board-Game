import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Character } from '@app/interfaces/Character';
import { Game } from '@app/interfaces/Game';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of } from 'rxjs';
import { CreationFormComponent } from './creation-form.component';

describe('CreationFormComponent', () => {
    let component: CreationFormComponent;
    let fixture: ComponentFixture<CreationFormComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockSharedDataService: jasmine.SpyObj<SharedDataService>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<CreationFormComponent>>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

    const mockCharacter: Character = {
        name: 'Test Character',
        image: 'character-image-url',
        face: 'character-face-url',
        body: 'character-body-url',
        stats: { health: 4, speed: 6, attack: 4, defense: 4 },
        dice: 'd6',
        victories: 5,
        position: { row: 0, col: 0 },
        initialPosition: { row: 0, col: 0 },
    };

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'on', 'emit', 'disconnect', 'off']);
        mockSharedDataService = jasmine.createSpyObj('SharedDataService', ['getAccessCode', 'setAccessCode', 'setPlayer', 'getGame', 'setGame']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

        sessionStorage.setItem('accessCode', 'mockAccessCode');

        await TestBed.configureTestingModule({
            imports: [CreationFormComponent, NoopAnimationsModule],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: SocketService, useValue: mockSocketService },
                { provide: SharedDataService, useValue: mockSharedDataService },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { gameId: 'testGameId', isJoining: false } },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        url: of([{ path: 'mockRoute' }]),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreationFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should connect to the socket and set up duplicate name check listener', () => {
            component.ngOnInit();

            expect(mockSocketService.connect).toHaveBeenCalled();
            expect(mockSocketService.on).toHaveBeenCalledWith('checkDuplicateNameResponse', jasmine.any(Function));
        });
    });

    describe('onCharacterSelected', () => {
        it('should update selectedCharacter', () => {
            component.onCharacterSelected(mockCharacter);
            expect(component.selectedCharacter).toEqual(mockCharacter);
        });
    });

    describe('onBonusApplied', () => {
        it('should update bonusAppliedState', () => {
            const bonusEvent = { health: true, speed: false };
            component.onBonusApplied(bonusEvent);
            expect(component.bonusAppliedState).toEqual(bonusEvent);
        });
    });

    describe('onDiceAssigned', () => {
        it('should update diceAssignedState', () => {
            const diceEvent = { attack: true, defense: false };
            component.onDiceAssigned(diceEvent);
            expect(component.diceAssignedState).toEqual(diceEvent);
        });
    });

    describe('canShowSubmit', () => {
        it('should return true if all required fields are filled', () => {
            component.username = 'testUser';
            component.selectedCharacter = mockCharacter;
            component.bonusAppliedState = { health: true, speed: false };
            component.diceAssignedState = { attack: true, defense: false };

            expect(component.canShowSubmit()).toBeTrue();
        });
        it('should return true if all required fields are filled v2', () => {
            component.username = 'testUser';
            component.selectedCharacter = mockCharacter;
            component.bonusAppliedState = { health: false, speed: true };
            component.diceAssignedState = { attack: false, defense: true };

            expect(component.canShowSubmit()).toBeTrue();
        });

        it('should return false if any required field is missing', () => {
            component.username = '';
            expect(component.canShowSubmit()).toBeFalse();
        });
    });

    describe('onSubmit', () => {
        it('should call joinMatch if isJoining is true', () => {
            spyOn(component, 'joinMatch');

            component.data.isJoining = true;
            component.username = 'testUser';
            component.selectedCharacter = {
                name: 'Test Character',
                image: 'character-face-url',
                face: 'character-face-url',
                body: 'character-body-url',
                stats: { health: 4, speed: 6, attack: 4, defense: 4 },
                dice: 'd6',
                victories: 5,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
            };
            component.bonusAppliedState = { health: true, speed: false };
            component.diceAssignedState = { attack: true, defense: false };

            component.onSubmit();

            expect(component.joinMatch).toHaveBeenCalled();
        });

        it('should call createMatch if isJoining is false', () => {
            spyOn(component, 'createMatch');

            component.data.isJoining = false;
            component.username = 'testUser';
            component.selectedCharacter = {
                name: 'Test Character',
                image: 'character-face-url',
                face: 'character-face-url',
                body: 'character-body-url',
                stats: { health: 4, speed: 6, attack: 4, defense: 4 },
                dice: 'd6',
                victories: 5,
                position: { row: 0, col: 0 },
                initialPosition: { row: 0, col: 0 },
            };
            component.bonusAppliedState = { health: true, speed: false };
            component.diceAssignedState = { attack: true, defense: false };

            component.onSubmit();

            expect(component.createMatch).toHaveBeenCalled();
        });
    });

    describe('createMatch', () => {
        it('should set player, navigate to waiting room, and close the dialog', () => {
            component.username = 'testUser';
            component.selectedCharacter = mockCharacter;
            component.bonusAppliedState = { health: true, speed: false };
            component.diceAssignedState = { attack: true, defense: false };

            mockSharedDataService.getGame.and.returnValue({ mapSize: 'medium' } as Game);

            component.createMatch();

            expect(mockSharedDataService.setPlayer).toHaveBeenCalledWith({
                username: 'testUser',
                character: mockCharacter,
                isAdmin: true,
                inventory: [null, null],
            });

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/waiting-room']);
            expect(mockDialogRef.close).toHaveBeenCalled();
        });
    });

    describe('joinMatch', () => {
        it('should emit checkDuplicateName event with accessCode and username', () => {
            component.username = 'testUser';
            mockSharedDataService.getAccessCode.and.returnValue('testAccessCode');

            component.joinMatch();

            expect(mockSocketService.emit).toHaveBeenCalledWith('checkDuplicateName', {
                accessCode: 'testAccessCode',
                playerName: 'testUser',
            });
        });
    });
    describe('onCancel', () => {
        it('should close the dialog', () => {
            component.onCancel();
            expect(mockDialogRef.close).toHaveBeenCalled();
        });
    });
    describe('ngOnInit - checkDuplicateNameResponse event', () => {
        it('should show a snackbar message and close the dialog if the lobby is full', () => {
            component.username = 'testUser';
            component.selectedCharacter = mockCharacter;
            /* eslint-disable @typescript-eslint/no-explicit-any */ // Likewise, the any is needed for simple testing.
            mockSocketService.on.and.callFake((event: string, callback: any) => {
                if (event === 'checkDuplicateNameResponse') {
                    callback({
                        exists: true,
                        charactersInRoom: ['character1', 'character2'],
                        playerUpdatedName: '',
                        game: { mapSize: 'petite' } as Game,
                    });
                }
            });

            component.ngOnInit();

            expect(mockSharedDataService.getAccessCode).toHaveBeenCalled();
            expect(mockSnackBar.open).not.toHaveBeenCalledWith('Cette partie est remplie :(', 'Ok', {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
            });
            expect(mockDialogRef.close).toHaveBeenCalled();
        });

        it('should show a snackbar message if the selected character is already taken', () => {
            component.username = 'testUser';
            component.selectedCharacter = { ...mockCharacter, name: 'Test Character' };

            mockSocketService.on.and.callFake((event: string, callback: any) => {
                if (event === 'checkDuplicateNameResponse') {
                    callback({
                        exists: true,
                        charactersInRoom: ['Test Character'],
                        playerUpdatedName: '',
                        game: { mapSize: 'moyenne' } as Game,
                    });
                }
            });

            component.ngOnInit();

            expect(mockSnackBar.open).not.toHaveBeenCalledWith(
                "Cet avatar vient d'être séléctionné par un autre utilisateur. Veuillez en choisir un autre.",
                'Ok',
                {
                    duration: 5000,
                    verticalPosition: 'top',
                    horizontalPosition: 'center',
                },
            );
            expect(mockDialogRef.close).not.toHaveBeenCalled();
        });

        it('should update player data and navigate to waiting room if conditions are met', () => {
            component.username = 'testUser';
            component.selectedCharacter = mockCharacter;

            mockSocketService.on.and.callFake((event: string, callback: any) => {
                if (event === 'checkDuplicateNameResponse') {
                    callback({
                        exists: true,
                        charactersInRoom: [],
                        playerUpdatedName: 'updatedTestUser',
                        game: { mapSize: 'moyenne' } as Game,
                    });
                }
            });

            component.ngOnInit();

            expect(mockSharedDataService.setPlayer).toHaveBeenCalledWith({
                username: 'updatedTestUser',
                character: mockCharacter,
                isAdmin: false,
                inventory: [null, null],
            });
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/waiting-room']);
            expect(mockDialogRef.close).toHaveBeenCalled();
        });
    });

    describe('ngOnInit - else branch of checkDuplicateNameResponse', () => {
        it('should set player, navigate to waiting room, and close dialog when res.exists is false', () => {
            component.username = 'testUser';
            component.selectedCharacter = mockCharacter;

            mockSocketService.on.and.callFake((event: string, callback: any) => {
                if (event === 'checkDuplicateNameResponse') {
                    callback({ exists: false, playerUpdatedName: '', game: {} as Game });
                }
            });
            /* eslint-enable @typescript-eslint/no-explicit-any */
            component.ngOnInit();

            expect(mockSharedDataService.setPlayer).toHaveBeenCalledWith({
                username: 'testUser',
                character: mockCharacter,
                isAdmin: false,
                inventory: [null, null],
            });
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/waiting-room']);
            expect(mockDialogRef.close).toHaveBeenCalled();
        });
    });
});
