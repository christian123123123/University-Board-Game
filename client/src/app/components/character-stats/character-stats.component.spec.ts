import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Character } from '@app/interfaces/Character';
import { CharacterStatsComponent } from './character-stats.component';

describe('CharacterStatsComponent', () => {
    let component: CharacterStatsComponent;
    let fixture: ComponentFixture<CharacterStatsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CharacterStatsComponent],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterStatsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should correctly calculate the stat width based on current value and max value', () => {
        const TEST_VALUE = 5;
        const MAX_TEST_VALUE = 10;
        const RESULT = '50%';
        const width = component.getStatWidth(TEST_VALUE, MAX_TEST_VALUE);
        expect(width).toBe(RESULT);
    });

    it('should render character stats correctly', () => {
        const TEST_HEALTH = 6;
        const RESULT_HEALTH = '60%';
        const TEST_SPEED = 4;
        const RESULT_SPEED = '40%';
        const TEST_ATTACK = 6;
        const RESULT_ATTACK = '60%';
        const TEST_DEFENSE = 4;
        const RESULT_DEFENSE = '40%';
        component.selectedCharacter = {
            name: 'Test Character',
            image: 'assets/test-image.png',
            stats: {
                health: TEST_HEALTH,
                speed: TEST_SPEED,
                attack: TEST_ATTACK,
                defense: TEST_DEFENSE,
            },
        } as Character;
        fixture.detectChanges();

        const nameElement = fixture.debugElement.query(By.css('.character-name')).nativeElement;
        expect(nameElement.textContent).toBe('Test Character');

        const image = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(image.src).toContain('assets/test-image.png');

        const healthElement = fixture.debugElement.query(By.css('#health + .stat-bar .stat-fill')).nativeElement;
        expect(healthElement.style.width).toBe(RESULT_HEALTH);

        const speedElement = fixture.debugElement.query(By.css('#speed + .stat-bar .stat-fill')).nativeElement;
        expect(speedElement.style.width).toBe(RESULT_SPEED);

        const attackElement = fixture.debugElement.query(By.css('#attack + .stat-bar .stat-fill')).nativeElement;
        expect(attackElement.style.width).toBe(RESULT_ATTACK);

        const defenseElement = fixture.debugElement.query(By.css('#defense + .stat-bar .stat-fill')).nativeElement;
        expect(defenseElement.style.width).toBe(RESULT_DEFENSE);
    });

    it('should not render anything if no character is selected', () => {
        component.selectedCharacter = null;
        fixture.detectChanges();

        const characterDetailsElement = fixture.debugElement.query(By.css('.character-details'));
        expect(characterDetailsElement).toBeNull();
    });
});
