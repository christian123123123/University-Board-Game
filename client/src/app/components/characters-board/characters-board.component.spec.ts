import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Character } from '@app/interfaces/Character';
import { Player } from '@app/interfaces/Player';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { CharactersBoardComponent } from './characters-board.component';
import { CHARACTERS } from './constant-characters-board';

const MOCK_CHARACTER: Character = {
    name: '',
    face: 'character1',
    image: '',
    body: '',
    dice: '',
    stats: { attack: 0, defense: 0, health: 0, speed: 0 },
    disabled: false,
    victories: 0,
    position: { row: 0, col: 0 },
    initialPosition: { row: 0, col: 0 },
};
const MOCK_CHARACTER2: Character = {
    name: '',
    face: 'character2',
    image: '',
    body: '',
    dice: '',
    stats: { attack: 0, defense: 0, health: 0, speed: 0 },
    disabled: false,
    victories: 0,
    position: { row: 0, col: 0 },
    initialPosition: { row: 0, col: 0 },
};

const MOCK_PLAYER: Player = { username: 'test1', isAdmin: true, character: { ...MOCK_CHARACTER }, inventory: ['', ''] };
const MOCK_PLAYER2: Player = { username: 'test2', isAdmin: false, character: { ...MOCK_CHARACTER2 }, inventory: ['', ''] };
describe('CharactersBoardComponent', () => {
    let component: CharactersBoardComponent;
    let fixture: ComponentFixture<CharactersBoardComponent>;
    let sharedDataServiceMock: jasmine.SpyObj<SharedDataService>;

    beforeEach(async () => {
        sharedDataServiceMock = jasmine.createSpyObj('SharedDataService', ['getAccessCode', 'getPlayersInGame']);
        await TestBed.configureTestingModule({
            imports: [CharactersBoardComponent],
            providers: [provideHttpClient(withInterceptorsFromDi()), { provide: SharedDataService, useValue: sharedDataServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(CharactersBoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render a grid of characters', () => {
        const boardRows: DebugElement[] = fixture.debugElement.queryAll(By.css('.board-row'));
        const totalSquares = component.ROW_BOARD * component.COLUMN_BOARD;

        expect(boardRows.length).toBe(component.ROW_BOARD);
        const squares = fixture.debugElement.queryAll(By.css('.board-square'));
        expect(squares.length).toBe(totalSquares);

        const images = fixture.debugElement.queryAll(By.css('img'));
        expect(images.length).toBe(component.characters.length);
    });

    it('should call onCharacterSelection and emit selected character when a character is clicked', () => {
        spyOn(component.selectedCharacter, 'emit');

        const firstCharacter = component.characters[0];
        const firstCharacterSquare = fixture.debugElement.query(By.css('img')).nativeElement;

        firstCharacterSquare.click();

        expect(component.selectedCharacter.emit).toHaveBeenCalledWith(firstCharacter);
    });

    it('should not emit any event when a null square is clicked', () => {
        spyOn(component.selectedCharacter, 'emit');

        component.board.getGrid()[0][0] = null;
        fixture.detectChanges();

        const nullSquare = fixture.debugElement.queryAll(By.css('.board-square'))[0].nativeElement;
        nullSquare.click();

        expect(component.selectedCharacter.emit).not.toHaveBeenCalled();
    });

    it('should render the correct character images and names', () => {
        const characterElements = fixture.debugElement.queryAll(By.css('img'));

        characterElements.forEach((characterElement, index) => {
            const character = component.characters[index];
            expect(characterElement.nativeElement.src).toContain(character.face);
            expect(characterElement.nativeElement.alt).toBe(character.name);
        });
    });
    it('should initialize charactersAlreadyTaken and board when accessCode is available', () => {
        const mockAccessCode = 'some-access-code';
        const MOCK_PLAYERS = [MOCK_PLAYER, MOCK_PLAYER2];

        sharedDataServiceMock.getAccessCode.and.returnValue(mockAccessCode);
        sharedDataServiceMock.getPlayersInGame.and.returnValue(MOCK_PLAYERS);

        component = new CharactersBoardComponent(sharedDataServiceMock);

        expect(sharedDataServiceMock.getAccessCode).toHaveBeenCalled();
        expect(sharedDataServiceMock.getPlayersInGame).toHaveBeenCalled();
        expect(component.accessCode).toEqual(mockAccessCode);
        expect(component.charactersAlreadyTaken).toEqual(['character1', 'character2']);
        expect(component.board).toBeDefined();

        const filteredCharacters = CHARACTERS.filter((character) => !component.charactersAlreadyTaken.includes(character.face));
        component.board.placeCharacters(filteredCharacters);
        expect(component.board.getGrid()).toEqual(component.board.getGrid());
    });

    describe('isCharacterDisabled', () => {
        it('should return true if character is disabled', () => {
            const disabledCharacter: Character = { ...MOCK_CHARACTER, disabled: true };

            const result = component.isCharacterDisabled(disabledCharacter);

            expect(result).toBe(true);
        });

        it('should return false if character is not disabled', () => {
            const enabledCharacter: Character = { ...MOCK_CHARACTER, disabled: false };

            const result = component.isCharacterDisabled(enabledCharacter);

            expect(result).toBe(false);
        });

        it('should return false if character disabled property is undefined', () => {
            const characterWithUndefinedDisabled: Character = { ...MOCK_CHARACTER, disabled: undefined };

            const result = component.isCharacterDisabled(characterWithUndefinedDisabled);

            expect(result).toBe(false);
        });
    });
});
