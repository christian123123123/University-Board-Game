import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Board } from '@app/classes/Board/board';
import { Character } from '@app/interfaces/Character';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { CHARACTERS } from './constant-characters-board';
@Component({
    selector: 'app-characters-board',
    standalone: true,
    imports: [CommonModule, NgClass],
    templateUrl: './characters-board.component.html',
    styleUrl: './characters-board.component.scss',
})
export class CharactersBoardComponent {
    @Input() gameId: string;
    @Output() selectedCharacter = new EventEmitter<Character>();
    charactersAlreadyTaken: string[] = [];
    accessCode: string | null = null;

    selectedCharacters: Character[] = [];
    characters: Character[] = CHARACTERS.map((character) => ({
        ...character,
        stats: { ...character.stats },
    }));
    board: Board;
    /* eslint-disable @typescript-eslint/naming-convention */
    readonly ROW_BOARD = 4;
    readonly COLUMN_BOARD = 3;
    /* eslint-disable @typescript-eslint/naming-convention */

    constructor(readonly sharedService: SharedDataService) {
        this.board = new Board(this.ROW_BOARD, this.COLUMN_BOARD);
        this.accessCode = this.sharedService.getAccessCode();
        if (this.accessCode) {
            const tempArray: string[] = [];
            const players = this.sharedService.getPlayersInGame();
            for (const player of players) {
                tempArray.push(player.character.face);
            }
            this.charactersAlreadyTaken = tempArray;
            this.board.placeCharacters(this.updateCharacterAvailability());
        } else {
            this.board.placeCharacters(this.characters);
        }
    }

    get grid(): (null | Character)[][] {
        return this.board.getGrid();
    }

    updateCharacterAvailability(): Character[] {
        this.characters.forEach((character) => {
            character.disabled = this.charactersAlreadyTaken.includes(character.face);
        });

        return this.characters;
    }

    isCharacterDisabled(character: Character): boolean {
        return character.disabled ?? false;
    }

    onCharacterSelection(character: Character): void {
        if (!character.disabled) {
            this.selectedCharacter.emit(character);
        }
    }
}
