import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { HomeButtonComponent } from './home-button.component';

const routes: Routes = [{ path: 'home', component: MainPageComponent }];

describe('HomeButtonComponent', () => {
    let fixture: ComponentFixture<HomeButtonComponent>;
    let component: HomeButtonComponent;
    let location: Location;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterModule.forRoot(routes), HomeButtonComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(HomeButtonComponent);
        component = fixture.componentInstance;
        location = TestBed.inject(Location);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should route to "/home" when clicking the home button', async () => {
        const button = fixture.debugElement.query(By.css('.home-button'));
        button.nativeElement.click();
        await fixture.whenStable();

        expect(location.path()).toBe('/home');
    });

    it('should render a button with the home icon', () => {
        const button = fixture.debugElement.query(By.css('.home-button'));
        expect(button).toBeTruthy();

        const icon = button.query(By.css('.fa-home'));
        expect(icon).toBeTruthy();
    });

    it('should apply the correct CSS class to the button', () => {
        const button = fixture.debugElement.query(By.css('.home-button'));
        expect(button.nativeElement.classList.contains('home-button')).toBeTrue();
    });
});
