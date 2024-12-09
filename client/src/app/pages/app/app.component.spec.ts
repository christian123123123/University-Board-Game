import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, NavigationStart, RouterOutlet } from '@angular/router';
import { AppComponent, browserRefresh } from './app.component';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let router: Router;
    let routerEventsSubject: Subject<any>;

    beforeEach(async () => {
        routerEventsSubject = new Subject();
        const routerMock = {
            events: routerEventsSubject.asObservable(),
            navigated: false,
        };

        await TestBed.configureTestingModule({
            imports: [RouterOutlet, AppComponent],
            providers: [{ provide: Router, useValue: routerMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
    });

    afterEach(() => {
        if (component.subscription) {
            component.subscription.unsubscribe();
        }
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should set browserRefresh to true on page reload', () => {
        router.navigated = false;
        routerEventsSubject.next(new NavigationStart(0, '/some-url'));

        expect(browserRefresh).toBeTrue();
    });

    it('should set browserRefresh to false on internal navigation', () => {
        router.navigated = true;
        routerEventsSubject.next(new NavigationStart(0, '/some-other-url'));

        expect(browserRefresh).toBeFalse();
    });
});
