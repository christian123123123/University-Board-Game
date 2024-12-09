import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DEFAULT_STATS } from '@app/components/characters-board/constant-characters-board';
import { Character } from '@app/interfaces/Character';
@Component({
    selector: 'app-character-bonus',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './character-bonus.component.html',
    styleUrl: './character-bonus.component.scss',
})
export class CharacterBonusComponent implements OnChanges {
    @Input() selectedCharacter: Character;
    @Output() bonusApplied = new EventEmitter<{ health: boolean; speed: boolean }>();
    @Output() diceAssigned = new EventEmitter<{ attack: boolean; defense: boolean }>();
    bonusAppliedState: { health: boolean; speed: boolean } = { health: false, speed: false };
    diceAssignedState: { attack: boolean; defense: boolean } = { attack: false, defense: false };

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedCharacter'] && !changes['selectedCharacter'].firstChange) {
            this.resetBonusAndDiceStates();
        }
    }

    applyBonus(stat: 'health' | 'speed'): void {
        const VALUE_ADD_SUBTRACT = 2;
        if (this.bonusAppliedState.health) {
            this.selectedCharacter.stats.health -= VALUE_ADD_SUBTRACT;
            this.bonusAppliedState.health = false;
        }
        if (this.bonusAppliedState.speed) {
            this.selectedCharacter.stats.speed -= VALUE_ADD_SUBTRACT;
            this.bonusAppliedState.speed = false;
        }

        if (stat === 'health') {
            this.selectedCharacter.stats.health += VALUE_ADD_SUBTRACT;
            this.bonusAppliedState.health = true;
        } else if (stat === 'speed') {
            this.selectedCharacter.stats.speed += VALUE_ADD_SUBTRACT;
            this.bonusAppliedState.speed = true;
        }

        this.bonusApplied.emit(this.bonusAppliedState);
    }

    assignDice(stat: 'attack' | 'defense') {
        if (stat === 'attack') {
            this.diceAssignedState.attack = true;
            this.selectedCharacter.dice = 'attack';
            this.diceAssignedState.defense = false;
        } else if (stat === 'defense') {
            this.diceAssignedState.defense = true;
            this.selectedCharacter.dice = 'defense';
            this.diceAssignedState.attack = false;
        }
        this.diceAssigned.emit(this.diceAssignedState);
    }

    resetBonusAndDiceStates(): void {
        this.selectedCharacter.stats = { ...DEFAULT_STATS };
        this.bonusAppliedState = { health: false, speed: false };
        this.diceAssignedState = { attack: false, defense: false };
        this.bonusApplied.emit(this.bonusAppliedState);
        this.diceAssigned.emit(this.diceAssignedState);
    }
}
