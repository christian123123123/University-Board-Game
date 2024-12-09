import { Location } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router, RouterModule, Routes } from '@angular/router';
import { JoinCodeComponent } from '@app/components/join-code/join-code.component';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
const routes: Routes = [
    { path: 'game', component: GamePageComponent },
    { path: 'create', component: CreatePageComponent },
    { path: 'admin', component: AdminPageComponent },
];

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let router: Router;
    let location: Location;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainPageComponent, RouterModule.forRoot(routes), GamePageComponent, CreatePageComponent, AdminPageComponent],
            providers: [provideHttpClient(withInterceptorsFromDi()), { provide: MatDialog }],
        }).compileComponents();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        router.initialNavigation();
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it("should have as title 'ROAD TO GLORY'", () => {
        expect(component.title).toEqual('ROAD TO GLORY');
    });

    it('should have three buttons', () => {
        const NUMBER_BUTTON = 3;
        const buttons = fixture.debugElement.queryAll(By.css('button'));
        expect(buttons.length).toBe(NUMBER_BUTTON);
    });

    it('should route to "/create" when clicking on "Créer une partie" ', async () => {
        const button = fixture.debugElement.queryAll(By.css('button'))[1];
        button.nativeElement.click();
        await fixture.whenStable();

        expect(location.path()).toBe('/create');
    });

    it('should route to "/admin" when clicking on "Administrer les jeux"', async () => {
        const button = fixture.debugElement.queryAll(By.css('button'))[2];
        button.nativeElement.click();
        await fixture.whenStable();

        expect(location.path()).toBe('/admin');
    });

    it('should open JoinCodeComponent dialog when joinButton is called', () => {
        component.joinButton();
        expect(dialogSpy.open).not.toHaveBeenCalledWith(JoinCodeComponent);
    });
});
