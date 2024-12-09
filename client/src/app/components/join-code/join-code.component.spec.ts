import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Game } from '@app/interfaces/Game';
import { Player } from '@app/interfaces/Player';
import { CreationFormService } from '@app/services/create/creation-form.service';
import { GamesService } from '@app/services/games/games.service';
import { JoinCodeService } from '@app/services/join-code/join-code.service';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { JoinCodeComponent } from './join-code.component';

describe('JoinCodeComponent', () => {
    let component: JoinCodeComponent;
    let fixture: ComponentFixture<JoinCodeComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<JoinCodeComponent>>;
    let mockCreationFormService: jasmine.SpyObj<CreationFormService>;
    let mockGameService: jasmine.SpyObj<GamesService>;
    let mockJoinCodeService: jasmine.SpyObj<JoinCodeService>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockSharedDataService: jasmine.SpyObj<SharedDataService>;

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockCreationFormService = jasmine.createSpyObj('CreationFormService', ['openCreationForm']);
        mockGameService = jasmine.createSpyObj('GamesService', ['dummyMethod']);
        mockJoinCodeService = jasmine.createSpyObj('JoinCodeService', ['checkIfLobbyFull']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'on', 'emit', 'disconnect']);
        mockSharedDataService = jasmine.createSpyObj('SharedDataService', ['setPlayersInGame', 'setAccessCode']);

        await TestBed.configureTestingModule({
            imports: [FormsModule, JoinCodeComponent],
            providers: [
                provideHttpClientTesting(),
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: CreationFormService, useValue: mockCreationFormService },
                { provide: GamesService, useValue: mockGameService },
                { provide: JoinCodeService, useValue: mockJoinCodeService },
                { provide: SocketService, useValue: mockSocketService },
                { provide: SharedDataService, useValue: mockSharedDataService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JoinCodeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should connect to the socket and set up the checkRoomExistenceResponse listener', () => {
            component.ngOnInit();
            expect(mockSocketService.connect).toHaveBeenCalled();
            expect(mockSocketService.on).toHaveBeenCalledWith('checkRoomExistenceResponse', jasmine.any(Function));
        });

        it('should handle room existence and accessibility response', () => {
            const mockGame: Game = { _id: 'gameId', mapSize: 'medium' } as Game;
            const mockResponse = {
                exists: true,
                accessible: true,
                playersInRoom: [{ username: 'player1' } as Player, { username: 'player2' } as Player],
                game: mockGame,
            };
            // Reason: Allow 'any' type for callback parameter to simplify mocking in tests for socket events
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
                if (event === 'checkRoomExistenceResponse') {
                    callback(mockResponse);
                }
            });

            component.ngOnInit();

            expect(mockJoinCodeService.checkIfLobbyFull).toHaveBeenCalledWith(component, 2);
            expect(mockSharedDataService.setPlayersInGame).toHaveBeenCalledWith(mockResponse.playersInRoom);
            expect(mockSharedDataService.setAccessCode).toHaveBeenCalledWith(component.accessCode);
            expect(mockDialogRef.close).toHaveBeenCalled();
            expect(mockCreationFormService.openCreationForm).toHaveBeenCalledWith('gameId', true);
            expect(component.errorMessage).toBeNull();
        });

        it('should show error if room is full', () => {
            const mockResponse = {
                exists: true,
                accessible: true,
                playersInRoom: [{ username: 'player1' } as Player, { username: 'player2' } as Player],
                game: { _id: 'gameId', mapSize: 'medium' } as Game,
            };

            mockJoinCodeService.checkIfLobbyFull.and.callFake((comp: JoinCodeComponent) => {
                comp.isLobbyFull = true;
            });
            // Reason: Allow 'any' type for callback parameter to simplify mocking in tests for socket events
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
                if (event === 'checkRoomExistenceResponse') {
                    callback(mockResponse);
                }
            });

            component.ngOnInit();

            expect(component.errorMessage).toBe('Le salon est plein. Impossible de joindre.');
        });

        it('should show error if room is locked', () => {
            const mockResponse = {
                exists: true,
                accessible: false,
                playersInRoom: [],
                game: { _id: 'gameId', mapSize: 'medium' } as Game,
            };
            // Reason: Allow 'any' type for callback parameter to simplify mocking in tests for socket events
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
                if (event === 'checkRoomExistenceResponse') {
                    callback(mockResponse);
                }
            });

            component.ngOnInit();

            expect(component.errorMessage).toBe('Ce salon est verrouillé.');
        });

        it('should show error if room does not exist', () => {
            const mockResponse = {
                exists: false,
                accessible: false,
                playersInRoom: [],
                game: {} as Game,
            };
            // Reason: Allow 'any' type for callback parameter to simplify mocking in tests for socket events
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockSocketService.on.and.callFake((event: string, callback: (data: any) => void) => {
                if (event === 'checkRoomExistenceResponse') {
                    callback(mockResponse);
                }
            });

            component.ngOnInit();

            expect(component.errorMessage).toBe('Code invalide. Veuillez réessayer.');
        });
    });

    describe('onSubmit', () => {
        it('should emit checkRoomExistence event with accessCode', () => {
            component.accessCode = 'testCode';
            component.onSubmit();

            expect(mockSocketService.emit).toHaveBeenCalledWith('checkRoomExistence', {
                accessCode: 'testCode',
            });
        });
    });

    describe('onCancel', () => {
        it('should close the dialog', () => {
            component.onCancel();
            expect(mockDialogRef.close).toHaveBeenCalled();
        });
    });
});
