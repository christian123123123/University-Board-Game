import { Location } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterModule, Routes } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { HomeButtonComponent } from '@app/components/home-button/home-button.component';
import { GamesService } from '@app/services/games/games.service';
import { of } from 'rxjs';
import { CreatePageComponent } from './create-page.component';

const routes: Routes = [{ path: 'home', component: HomeButtonComponent }];

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let router: Router;
    let location: Location;

    beforeEach(async () => {
        const gamesServiceMock = jasmine.createSpyObj('GamesService', ['getGames']);
        gamesServiceMock.getGames.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot(routes), CreatePageComponent],
            providers: [[provideHttpClient(withInterceptorsFromDi())], { provide: GamesService, useValue: gamesServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);

        fixture.detectChanges();
        router.initialNavigation();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render the HomeButtonComponent', () => {
        const homeButton = fixture.debugElement.query(By.directive(HomeButtonComponent));
        expect(homeButton).toBeTruthy();
    });

    it('should render the GameListComponent with correct input', () => {
        const gameList = fixture.debugElement.query(By.directive(GameListComponent));
        expect(gameList).toBeTruthy();

        const filteredVisibility = gameList.componentInstance.filteredVisibility;
        expect(filteredVisibility).toBeTrue();
    });

    it('should render the static text "Créer une partie"', () => {
        const h1Element = fixture.nativeElement.querySelector('h1');
        expect(h1Element.textContent).toContain('Créer une partie');
    });

    it('should route to "/home" when clicking on the home button', async () => {
        await router.navigate(['/home']);
        await fixture.whenStable();
        expect(location.path()).toBe('/home');
    });
});
