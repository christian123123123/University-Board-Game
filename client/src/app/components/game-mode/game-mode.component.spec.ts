import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GameModeComponent } from './game-mode.component';

describe('GameModeComponent', () => {
    let component: GameModeComponent;
    let fixture: ComponentFixture<GameModeComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<GameModeComponent>>;

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            declarations: [],
            imports: [FormsModule, GameModeComponent],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: MatDialogRef, useValue: mockDialogRef },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameModeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set selectedGameMode when selectGameMode is called', () => {
        const MODE = 'classique';
        spyOn(component, 'selectGameMode').and.callThrough();
        component.selectGameMode(MODE);
        expect(component.selectGameMode).toHaveBeenCalled();
        expect(component.selectGameMode).toHaveBeenCalledWith(MODE);
    });

    it('should set selectedMapSize when selectMapSize is called', () => {
        const MAPSIZE = 'petite';
        spyOn(component, 'selectMapSize').and.callThrough();
        component.selectMapSize(MAPSIZE);
        expect(component.selectMapSize).toHaveBeenCalledWith(MAPSIZE);
        expect(component.selectedMapSize).toBe(MAPSIZE);
    });

    it('should submit selectMapSize and selectGameMode', () => {
        const GAMEMODE = 'classique';
        const SIZE = 'petite';
        component.selectedGameMode = GAMEMODE;
        component.selectedMapSize = SIZE;

        component.onSubmit();
        expect(mockDialogRef.close).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit'], {
            queryParams: { gameMode: GAMEMODE, mapSize: SIZE },
        });
    });

    it('should cancel when onCancel is called', () => {
        component.onCancel();

        expect(mockDialogRef.close).toHaveBeenCalled();
    });
});
