import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_STATS } from '@app/components/characters-board/constant-characters-board';
import { Character } from '@app/interfaces/Character';
import { CharacterBonusComponent } from './character-bonus.component';

describe('CharacterBonusComponent', () => {
    const DEFAULT_STAT_VALUE = 4;
    const INCREASED_STAT_VALUE = 6;

    let component: CharacterBonusComponent;
    let fixture: ComponentFixture<CharacterBonusComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CharacterBonusComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CharacterBonusComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should apply health bonus correctly', () => {
        component.selectedCharacter = {
            stats: { health: DEFAULT_STAT_VALUE, speed: DEFAULT_STAT_VALUE, attack: DEFAULT_STAT_VALUE, defense: DEFAULT_STAT_VALUE },
        } as Character;

        component.applyBonus('health');

        expect(component.selectedCharacter.stats.health).toBe(INCREASED_STAT_VALUE);
        expect(component.selectedCharacter.stats.speed).toBe(DEFAULT_STAT_VALUE);
        expect(component.bonusAppliedState.health).toBeTrue();
        expect(component.bonusAppliedState.speed).toBeFalse();
    });

    it('should apply speed bonus correctly', () => {
        component.selectedCharacter = {
            stats: { health: DEFAULT_STAT_VALUE, speed: DEFAULT_STAT_VALUE, attack: DEFAULT_STAT_VALUE, defense: DEFAULT_STAT_VALUE },
        } as Character;

        component.applyBonus('speed');

        expect(component.selectedCharacter.stats.speed).toBe(INCREASED_STAT_VALUE);
        expect(component.selectedCharacter.stats.health).toBe(DEFAULT_STAT_VALUE);
        expect(component.bonusAppliedState.speed).toBeTrue();
        expect(component.bonusAppliedState.health).toBeFalse();
    });

    it('should toggle bonuses correctly', () => {
        component.selectedCharacter = {
            stats: { health: DEFAULT_STAT_VALUE, speed: DEFAULT_STAT_VALUE, attack: DEFAULT_STAT_VALUE, defense: DEFAULT_STAT_VALUE },
        } as Character;

        component.applyBonus('health');

        expect(component.selectedCharacter.stats.health).toBe(INCREASED_STAT_VALUE);
        expect(component.selectedCharacter.stats.speed).toBe(DEFAULT_STAT_VALUE);
        expect(component.bonusAppliedState.health).toBeTrue();
        expect(component.bonusAppliedState.speed).toBeFalse();

        component.applyBonus('speed');

        expect(component.selectedCharacter.stats.health).toBe(DEFAULT_STAT_VALUE);
        expect(component.selectedCharacter.stats.speed).toBe(INCREASED_STAT_VALUE);
        expect(component.bonusAppliedState.health).toBeFalse();
        expect(component.bonusAppliedState.speed).toBeTrue();
    });

    it('should remove the speed bonus when health bonus is applied', () => {
        component.selectedCharacter = {
            stats: { health: DEFAULT_STAT_VALUE, speed: INCREASED_STAT_VALUE, attack: DEFAULT_STAT_VALUE, defense: DEFAULT_STAT_VALUE },
        } as Character;
        component.bonusAppliedState = { health: false, speed: true };

        component.applyBonus('health');

        expect(component.selectedCharacter.stats.speed).toBe(DEFAULT_STAT_VALUE);
        expect(component.bonusAppliedState.speed).toBeFalse();
        expect(component.selectedCharacter.stats.health).toBe(INCREASED_STAT_VALUE);
        expect(component.bonusAppliedState.health).toBeTrue();
    });

    it('should remove the health bonus when speed bonus is applied', () => {
        component.selectedCharacter = {
            stats: { health: INCREASED_STAT_VALUE, speed: DEFAULT_STAT_VALUE, attack: DEFAULT_STAT_VALUE, defense: DEFAULT_STAT_VALUE },
        } as Character;
        component.bonusAppliedState = { health: true, speed: false };

        component.applyBonus('speed');

        expect(component.selectedCharacter.stats.health).toBe(DEFAULT_STAT_VALUE);
        expect(component.bonusAppliedState.health).toBeFalse();
        expect(component.selectedCharacter.stats.speed).toBe(INCREASED_STAT_VALUE);
        expect(component.bonusAppliedState.speed).toBeTrue();
    });

    it('should emit correct bonusApplied event', () => {
        spyOn(component.bonusApplied, 'emit');
        component.selectedCharacter = {
            stats: { health: DEFAULT_STAT_VALUE, speed: DEFAULT_STAT_VALUE, attack: DEFAULT_STAT_VALUE, defense: DEFAULT_STAT_VALUE },
        } as Character;

        component.applyBonus('speed');

        expect(component.bonusApplied.emit).toHaveBeenCalledWith({ health: false, speed: true });
    });
    it('should assign attack dice correctly', () => {
        component.selectedCharacter = {
            dice: '',
        } as Character;

        component.assignDice('attack');

        expect(component.diceAssignedState.attack).toBeTrue();
        expect(component.diceAssignedState.defense).toBeFalse();
        expect(component.selectedCharacter.dice).toBe('attack');
    });

    it('should assign defense dice correctly', () => {
        component.selectedCharacter = {
            dice: '',
        } as Character;

        component.assignDice('defense');

        expect(component.diceAssignedState.defense).toBeTrue();
        expect(component.diceAssignedState.attack).toBeFalse();
        expect(component.selectedCharacter.dice).toBe('defense');
    });

    it('should emit diceAssignedState after assigning attack dice', () => {
        spyOn(component.diceAssigned, 'emit');
        component.selectedCharacter = {
            dice: '',
        } as Character;

        component.assignDice('attack');

        expect(component.diceAssigned.emit).toHaveBeenCalledWith({ attack: true, defense: false });
    });

    it('should emit diceAssignedState after assigning defense dice', () => {
        spyOn(component.diceAssigned, 'emit');
        component.selectedCharacter = {
            dice: '',
        } as Character;

        component.assignDice('defense');

        expect(component.diceAssigned.emit).toHaveBeenCalledWith({ attack: false, defense: true });
    });

    it('should reset bonus and dice states and emit events when resetBonusAndDiceStates is called', () => {
        component.selectedCharacter = {
            name: 'Test Character',
            stats: { ...DEFAULT_STATS },
            dice: 'attack',
            face: 'test-face.png',
        } as Character;
        const bonusAppliedSpy = spyOn(component.bonusApplied, 'emit');
        const diceAssignedSpy = spyOn(component.diceAssigned, 'emit');

        component.selectedCharacter.stats.health = 10;
        component.selectedCharacter.stats.speed = 10;
        component.bonusAppliedState = { health: true, speed: true };
        component.diceAssignedState = { attack: true, defense: false };

        component.resetBonusAndDiceStates();

        expect(component.selectedCharacter.stats).toEqual({ ...DEFAULT_STATS });
        expect(component.bonusAppliedState).toEqual({ health: false, speed: false });
        expect(component.diceAssignedState).toEqual({ attack: false, defense: false });

        expect(bonusAppliedSpy).toHaveBeenCalledWith({ health: false, speed: false });
        expect(diceAssignedSpy).toHaveBeenCalledWith({ attack: false, defense: false });
    });

    it('should call resetBonusAndDiceStates when selectedCharacter changes and it is not the first change', () => {
        const resetSpy = spyOn(component, 'resetBonusAndDiceStates');
        const previousCharacter = { ...component.selectedCharacter, name: 'Old Character' };
        const newCharacter = { ...component.selectedCharacter, name: 'New Character' };

        const changes: SimpleChanges = {
            selectedCharacter: new SimpleChange(previousCharacter, newCharacter, false),
        };
        component.ngOnChanges(changes);

        expect(resetSpy).toHaveBeenCalled();
    });

    it('should not call resetBonusAndDiceStates on the first change of selectedCharacter', () => {
        const resetSpy = spyOn(component, 'resetBonusAndDiceStates');
        const newCharacter = { ...component.selectedCharacter, name: 'New Character' };

        const changes: SimpleChanges = {
            selectedCharacter: new SimpleChange(null, newCharacter, true),
        };
        component.ngOnChanges(changes);

        expect(resetSpy).not.toHaveBeenCalled();
    });
});
