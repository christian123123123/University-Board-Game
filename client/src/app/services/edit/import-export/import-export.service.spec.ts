import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Game } from '@app/interfaces/Game';
import { Tiles } from '@app/interfaces/Tiles';
import { SaveGameService } from '@app/services/edit/save/save-game.service';
import { ValidationService } from '@app/services/edit/save/validation/validation.service';
import { GamesService } from '@app/services/games/games.service';
import { GAME_OBJECTS } from '@app/shared/game-objects';
import { GAME_TILES } from '@app/shared/game-tiles';
import { of } from 'rxjs';
import { ImportExportService } from './import-export.service';

describe('ImportExportService', () => {
    let service: ImportExportService;
    let gamesServiceSpy: jasmine.SpyObj<GamesService>;
    let saveGameServiceSpy: jasmine.SpyObj<SaveGameService>;
    let validationServiceSpy: jasmine.SpyObj<ValidationService>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        gamesServiceSpy = jasmine.createSpyObj('GamesService', ['getGameById', 'createGame']);
        saveGameServiceSpy = jasmine.createSpyObj('SaveGameService', ['checkForDuplicateTitleCreating', 'saveGame']);
        validationServiceSpy = jasmine.createSpyObj('ValidationService', ['isFlagHere', 'isDoorNotSurrounded']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        TestBed.configureTestingModule({
            imports: [MatSnackBarModule],
            providers: [
                { provide: GamesService, useValue: gamesServiceSpy },
                { provide: SaveGameService, useValue: saveGameServiceSpy },
                { provide: ValidationService, useValue: validationServiceSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                provideHttpClient(),
            ],
        });

        service = TestBed.inject(ImportExportService);
    });
    it('should display a snackbar if file size exceeds 1MB', () => {
        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        const mockFile = new File(['a'.repeat(1 * 1024 * 1024 + 1)], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;

        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const target = event.target as HTMLInputElement;
                const fileSelected = target.files?.[0];
                expect(fileSelected?.size).toBeGreaterThan(1 * 1024 * 1024);
            })
            .and.callThrough();

        service.importGame();
        expect(mockInputElement.click).toHaveBeenCalled();

        mockInputElement.onchange(mockEvent);

        expect(snackBarSpy.open).toHaveBeenCalledWith(
            'Fichier trop grand, veuillez sélectionné un fichier de taille inférieure à 1 MB',
            'Ok',
            jasmine.objectContaining({ duration: 3000 }),
        );
    });

    it('should display a snackbar if game mode is invalid', () => {
        const invalidGame: Partial<Game> = { mode: 'invalid-mode', board: [] };

        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(invalidGame),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent);
        });

        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile);

                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        service.importGame();

        expect(mockInputElement.click).toHaveBeenCalled();
        mockInputElement.onchange!(mockEvent);

        expect(snackBarSpy.open).toHaveBeenCalledWith('Mode de jeu inconnu.', 'Ok', jasmine.any(Object));
    });

    it('should call downloadFile with the correct filename and content', () => {
        const mockGame: Game = {
            _id: '123',
            title: 'Test Game',
            mapSize: 'petite',
            mode: 'classique',
            visibility: true,
            description: 'Test description',
            board: [],
            updatedAt: new Date(),
        };

        gamesServiceSpy.getGameById.and.returnValue(of(mockGame));

        spyOn(service, 'downloadFile');
        service.exportGame(mockGame);

        expect(service.downloadFile).toHaveBeenCalledWith('Test Game.json', jasmine.any(String));
    });

    it('should display a snackbar for invalid tile field', () => {
        const board = [[{ fieldTile: 'invalid-field', door: false, wall: false, object: null, avatar: null, isTileSelected: false, position: null }]];
        validationServiceSpy.isFlagHere.and.returnValue(false);

        expect(service.areTilesValid(board)).toBeFalse();
        expect(snackBarSpy.open).toHaveBeenCalledWith(`Invalid field at (0, 0): invalid-field`, 'Ok', jasmine.any(Object));
    });

    it('should return false for an invalid board size', () => {
        const board = Array(5).fill(Array(5).fill({ fieldTile: GAME_TILES.BASE, door: false, wall: false }));
        expect(service.isBoardSizeValid(board)).toBeFalse();
    });

    it('should check for missing flag in CTF mode and display a snackbar', () => {
        const gameInstance: Partial<Game> = {
            mode: 'capture the flag',
            board: [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: null,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ],
        };

        spyOn(service, 'isFlagInFile').and.returnValue(false);
        spyOn(service, 'displaySnackBar');
        spyOn(service, 'checkAndSaveGame');

        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(gameInstance),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent);
        });

        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile);

                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        service.importGame();

        expect(mockInputElement.click).toHaveBeenCalled();
        mockInputElement.onchange!(mockEvent);

        expect(service.isFlagInFile).toHaveBeenCalledWith(gameInstance.board as Tiles[][]);
        expect(service.displaySnackBar).toHaveBeenCalledWith('Drapeau manquant dans une partie CTF.');
        expect(service.checkAndSaveGame).not.toHaveBeenCalled();
    });

    it('should display a snackbar if a flag is present in classique mode', () => {
        const gameInstance: Partial<Game> = {
            mode: 'classique',
            board: [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: 'assets/object-flag-only.png',
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ],
        };

        spyOn(service, 'isFlagInFile').and.returnValue(true);
        spyOn(service, 'displaySnackBar');
        spyOn(service, 'checkAndSaveGame');

        // Mock FileReader to simulate the readAsText method
        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(gameInstance),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent); // Manually trigger the onload event
        });

        // Mock input element creation
        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        // Simulate file selection and onchange event
        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile); // Ensure the correct file is passed

                // Trigger FileReader logic
                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        // Call the method under test
        service.importGame();

        // Simulate user interaction with file input
        expect(mockInputElement.click).toHaveBeenCalled(); // Ensure the input is clicked
        mockInputElement.onchange!(mockEvent); // Trigger onchange manually

        // Verify that isFlagInFile was called with the correct board
        expect(service.isFlagInFile).toHaveBeenCalledWith(gameInstance.board as Tiles[][]);

        // Verify snackbar behavior
        expect(service.displaySnackBar).toHaveBeenCalledWith('Il ne devrait pas avoir un drapeau dans une partie classique.');
        expect(service.checkAndSaveGame).not.toHaveBeenCalled();
    });

    it('should exit early if tiles are invalid', () => {
        const gameInstance: Partial<Game> = {
            mode: 'classique',
            board: [
                [
                    {
                        fieldTile: 'invalid-tile', // Invalid fieldTile to trigger areTilesValid failure
                        door: false,
                        wall: false,
                        object: null,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ],
        };

        spyOn(service, 'areTilesValid').and.returnValue(false); // Simulate invalid tiles
        spyOn(service, 'displaySnackBar');
        spyOn(service, 'checkAndSaveGame');

        // Mock FileReader to simulate the readAsText method
        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(gameInstance),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent); // Manually trigger the onload event
        });

        // Mock input element creation
        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        // Simulate file selection and onchange event
        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile); // Ensure the correct file is passed

                // Trigger FileReader logic
                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        // Call the method under test
        service.importGame();

        // Simulate user interaction with file input
        expect(mockInputElement.click).toHaveBeenCalled(); // Ensure the input is clicked
        mockInputElement.onchange!(mockEvent); // Trigger onchange manually

        // Verify that areTilesValid is called
        expect(service.areTilesValid).toHaveBeenCalledWith(gameInstance.board as Tiles[][]);

        // Verify the method exits early and doesn't call checkAndSaveGame
        expect(service.checkAndSaveGame).not.toHaveBeenCalled();
        expect(service.displaySnackBar).not.toHaveBeenCalled(); // No snackbar should be triggered here
    });

    it('should exit early if the object count is invalid', () => {
        const gameInstance: Partial<Game> = {
            mode: 'classique',
            mapSize: 'moyenne', // Mock a map size
            board: [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: 'assets/object-universal-cube-only.png', // Mock an object
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ],
        };

        spyOn(service, 'isObjectCountValid').and.returnValue(false); // Simulate invalid object count
        spyOn(service, 'displaySnackBar');
        spyOn(service, 'checkAndSaveGame');

        // Mock FileReader to simulate the readAsText method
        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(gameInstance),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent); // Manually trigger the onload event
        });

        // Mock input element creation
        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        // Simulate file selection and onchange event
        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile); // Ensure the correct file is passed

                // Trigger FileReader logic
                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        // Call the method under test
        service.importGame();

        // Simulate user interaction with file input
        expect(mockInputElement.click).toHaveBeenCalled(); // Ensure the input is clicked
        mockInputElement.onchange!(mockEvent); // Trigger onchange manually

        // Verify that isObjectCountValid is called with the correct arguments
        expect(service.isObjectCountValid).toHaveBeenCalledWith(gameInstance.board as Tiles[][], gameInstance.mapSize!);

        // Verify the method exits early and doesn't call checkAndSaveGame
        expect(service.checkAndSaveGame).not.toHaveBeenCalled();
        expect(service.displaySnackBar).not.toHaveBeenCalled(); // No snackbar should be triggered directly here
    });

    it('should display a snackbar and exit if the board size is invalid', () => {
        const gameInstance: Partial<Game> = {
            mode: 'classique', // Valid mode
            board: Array(5) // Invalid board size (not 10x10, 15x15, or 20x20)
                .fill(null)
                .map(() => Array(5).fill({ fieldTile: 'assets/moon-tiles.png', door: false, wall: false })),
        };

        // Ensure all earlier checks pass
        spyOn(service, 'isFlagInFile').and.returnValue(false); // No flag check needed for classique
        spyOn(service, 'areTilesValid').and.returnValue(true); // Simulate valid tiles
        spyOn(service, 'isObjectCountValid').and.returnValue(true); // Simulate valid object count
        spyOn(service, 'isBoardSizeValid').and.returnValue(false); // Simulate invalid board size
        spyOn(service, 'displaySnackBar');
        spyOn(service, 'checkAndSaveGame');

        // Mock FileReader to simulate the readAsText method
        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(gameInstance),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent); // Manually trigger the onload event
        });

        // Mock input element creation
        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        // Simulate file selection and onchange event
        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile); // Ensure the correct file is passed

                // Trigger FileReader logic
                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        // Call the method under test
        service.importGame();

        // Simulate user interaction with file input
        expect(mockInputElement.click).toHaveBeenCalled(); // Ensure the input is clicked
        mockInputElement.onchange!(mockEvent); // Trigger onchange manually

        // Verify that isBoardSizeValid is called with the correct board
        expect(service.isBoardSizeValid).toHaveBeenCalledWith(gameInstance.board as Tiles[][]);

        // Verify that the snackbar is displayed with the correct message
        expect(service.displaySnackBar).toHaveBeenCalledWith('Taille de la map invalide. Elle doit être de 10x10, 15x15 ou 20x20');

        // Verify that checkAndSaveGame is not called
        expect(service.checkAndSaveGame).not.toHaveBeenCalled();
    });

    it('should display a snackbar and exit if map size does not match board size', () => {
        const gameInstance: Partial<Game> = {
            mode: 'classique', // Valid mode
            mapSize: 'grande', // Mismatch with the board size
            board: Array(10) // Mock a 10x10 board, but mapSize is "grande" (20x20 expected)
                .fill(null)
                .map(() => Array(10).fill({ fieldTile: 'assets/moon-tiles.png', door: false, wall: false })),
        };

        // Ensure all earlier checks pass
        spyOn(service, 'isFlagInFile').and.returnValue(false); // Not relevant for classique mode
        spyOn(service, 'areTilesValid').and.returnValue(true); // Simulate valid tiles
        spyOn(service, 'isObjectCountValid').and.returnValue(true); // Simulate valid object count
        spyOn(service, 'isBoardSizeValid').and.returnValue(true); // Simulate valid board size
        spyOn(service, 'isMapSizeValid').and.returnValue(false); // Simulate invalid map size
        spyOn(service, 'displaySnackBar');
        spyOn(service, 'checkAndSaveGame');

        // Mock FileReader to simulate the readAsText method
        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(gameInstance),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent); // Manually trigger the onload event
        });

        // Mock input element creation
        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        // Simulate file selection and onchange event
        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile); // Ensure the correct file is passed

                // Trigger FileReader logic
                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        // Call the method under test
        service.importGame();

        // Simulate user interaction with file input
        expect(mockInputElement.click).toHaveBeenCalled(); // Ensure the input is clicked
        mockInputElement.onchange!(mockEvent); // Trigger onchange manually

        // Verify that isMapSizeValid is called with the correct board and mapSize
        expect(service.isMapSizeValid).toHaveBeenCalledWith(gameInstance.board as Tiles[][], gameInstance.mapSize!);

        // Verify that the snackbar is displayed with the correct message
        expect(service.displaySnackBar).toHaveBeenCalledWith('Taille de map correcte, mais elle ne correspond pas avec mapSize. Fichier corrompu?');

        // Verify that checkAndSaveGame is not called
        expect(service.checkAndSaveGame).not.toHaveBeenCalled();
    });

    it('should call checkAndSaveGame with the correct arguments when all validations pass', () => {
        const gameInstance: Partial<Game> = {
            mode: 'classique',
            mapSize: 'moyenne',
            title: 'Test Game',
            description: 'Test Description',
            board: Array(15)
                .fill(null)
                .map(() =>
                    Array(15).fill({
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                    }),
                ),
        };

        const expectedGameWithAttributesWitVisibility = {
            title: 'Test Game',
            description: 'Test Description',
            board: gameInstance.board,
            mode: 'classique',
            mapSize: 'moyenne',
            visibility: false, // Added by importGame
        };

        // Mock all validations to pass
        spyOn(service, 'isFlagInFile').and.returnValue(false);
        spyOn(service, 'areTilesValid').and.returnValue(true);
        spyOn(service, 'isObjectCountValid').and.returnValue(true);
        spyOn(service, 'isBoardSizeValid').and.returnValue(true);
        spyOn(service, 'isMapSizeValid').and.returnValue(true);
        spyOn(service, 'checkAndSaveGame'); // Spy on the method we are testing

        // Mock FileReader to simulate the readAsText method
        spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
            const progressEvent = {
                target: {
                    result: JSON.stringify(gameInstance),
                },
            } as ProgressEvent<FileReader>;
            this.onload!(progressEvent); // Manually trigger the onload event
        });

        // Mock input element creation
        const mockInputElement = {
            type: 'file',
            accept: '.json',
            onchange: null as unknown as (event: Event) => void,
            click: jasmine.createSpy('click'),
        };
        spyOn(document, 'createElement').and.returnValue(mockInputElement as unknown as HTMLInputElement);

        // Simulate file selection and onchange event
        const mockFile = new File(['mock-content'], 'test.json');
        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        mockInputElement.onchange = jasmine
            .createSpy('onchange', (event: Event) => {
                const file = (event.target as HTMLInputElement).files![0];
                expect(file).toBe(mockFile); // Ensure the correct file is passed

                // Trigger FileReader logic
                const reader = new FileReader();
                reader.readAsText(file);
            })
            .and.callThrough();

        // Call the method under test
        service.importGame();

        // Simulate user interaction with file input
        expect(mockInputElement.click).toHaveBeenCalled(); // Ensure the input is clicked
        mockInputElement.onchange!(mockEvent); // Trigger onchange manually

        // Verify that checkAndSaveGame is called with the correct arguments
        expect(service.checkAndSaveGame).toHaveBeenCalledWith(
            jasmine.objectContaining(expectedGameWithAttributesWitVisibility), // Matches the transformed object
            jasmine.objectContaining(gameInstance), // Matches the original game instance
        );
    });

    it('should display a snackbar and return false if a tile is not an object', () => {
        const invalidBoard: Tiles[][] = [
            [
                null as unknown as Tiles, // Null tile to trigger the "not an object" error
                {
                    fieldTile: 'assets/moon-tiles.png',
                    door: false,
                    wall: false,
                    object: 'j',
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 1 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar'); // Spy on displaySnackBar to verify its call

        // Call the method under test
        const result = service.areTilesValid(invalidBoard);

        // Assertions
        expect(result).toBeFalse(); // The method should return false
        expect(service.displaySnackBar).toHaveBeenCalledWith('Tile at (0, 0) must be an object.'); // Verify error message
    });

    it('should display a snackbar and return false if a tile has an invalid object', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'assets/moon-tiles.png',
                    door: false,
                    wall: false,
                    object: 'invalid-object', // Invalid object not in VALID_OBJECTS
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        const VALID_OBJECTS = Object.values(GAME_OBJECTS).map((item) => item.object);
        console.log('Valid Objects:', VALID_OBJECTS);

        spyOn(service, 'displaySnackBar'); // Spy on displaySnackBar to verify its call

        // Call the method under test
        const result = service.areTilesValid(invalidBoard);

        // Assertions
        expect(result).toBeFalse(); // The method should return false
        expect(service.displaySnackBar).toHaveBeenCalledWith('Invalid object at (0, 0): invalid-object'); // Verify error message
    });

    it('should display a snackbar and return false if door is not a boolean', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'assets/moon-tiles.png',
                    door: 'invalid' as unknown as boolean, // Invalid door value
                    wall: false,
                    object: null,
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar'); // Spy on displaySnackBar to verify its call

        // Call the method under test
        const result = service.areTilesValid(invalidBoard);

        // Assertions
        expect(result).toBeFalse(); // The method should return false
        expect(service.displaySnackBar).toHaveBeenCalledWith('Invalid door attribute at (0, 0). Must be a boolean.'); // Verify error message
    });

    it('should display a snackbar and return false if tile is not a door but door is true', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'assets/moon-tiles.png', // Not a door fieldTile
                    door: true, // Incorrect door attribute
                    wall: false,
                    object: null,
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar'); // Spy on displaySnackBar to verify its call

        // Call the method under test
        const result = service.areTilesValid(invalidBoard);

        // Assertions
        expect(result).toBeFalse(); // The method should return false
        expect(service.displaySnackBar).toHaveBeenCalledWith(
            `La tuile a (0, 0) n'est pas une porte. l'attribut door doit etre false.`, // Verify error message
        );
    });

    it('should display a snackbar and return false if tile is a door but door is false', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: GAME_TILES.DOOR_CLOSED, // Door fieldTile
                    door: false, // Incorrect door attribute
                    wall: false,
                    object: null,
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar'); // Spy on displaySnackBar to verify its call

        // Call the method under test
        const result = service.areTilesValid(invalidBoard);

        // Assertions
        expect(result).toBeFalse(); // The method should return false
        expect(service.displaySnackBar).toHaveBeenCalledWith(
            `La tuile a (0, 0) est une porte. l'attribut door doit etre true.`, // Verify error message
        );
    });

    it('should display a snackbar and return false if wall is not a boolean', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'assets/moon-tiles.png',
                    door: false,
                    wall: 'invalid' as unknown as boolean, // Invalid wall value
                    object: null,
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar'); // Spy on displaySnackBar to verify its call

        // Call the method under test
        const result = service.areTilesValid(invalidBoard);

        // Assertions
        expect(result).toBeFalse(); // The method should return false
        expect(service.displaySnackBar).toHaveBeenCalledWith(
            `Invalid wall attribute at (0, 0). Must be a boolean.`, // Verify error message
        );
    });

    it('should display a snackbar and return false if tile is a wall but wall is false', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: GAME_TILES.WALL, // Wall tile
                    door: false,
                    wall: false, // Incorrect wall attribute
                    object: null,
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar');

        const result = service.areTilesValid(invalidBoard);

        expect(result).toBeFalse();
        expect(service.displaySnackBar).toHaveBeenCalledWith(`La tuile a (0, 0) est un mur. l'attribut wall doit etre true.`);
    });

    it('should display a snackbar and return false if tile is not a wall but wall is true', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'assets/moon-tiles.png', // Not a wall tile
                    door: false,
                    wall: true,
                    object: null,
                    avatar: null,
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar');

        const result = service.areTilesValid(invalidBoard);

        expect(result).toBeFalse();
        expect(service.displaySnackBar).toHaveBeenCalledWith(`La tuile a (0, 0) est n'est pas un mur. l'attribut mur doit etre false.`);
    });

    it('should display a snackbar and return false if isTileSelected is not false', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'assets/moon-tiles.png',
                    door: false,
                    wall: false,
                    object: null,
                    avatar: null,
                    isTileSelected: true,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar');

        const result = service.areTilesValid(invalidBoard);

        expect(result).toBeFalse();
        expect(service.displaySnackBar).toHaveBeenCalledWith(`Tile at (0, 0) must have isTileSelected set to false.`);
    });

    it('should display a snackbar and return false if a tile has an avatar', () => {
        const invalidBoard: Tiles[][] = [
            [
                {
                    fieldTile: 'assets/moon-tiles.png',
                    door: false,
                    wall: false,
                    object: null,
                    avatar: 'some-avatar-id',
                    isTileSelected: false,
                    position: { row: 0, col: 0 },
                },
            ],
        ];

        spyOn(service, 'displaySnackBar');

        const result = service.areTilesValid(invalidBoard);

        expect(result).toBeFalse();
        expect(service.displaySnackBar).toHaveBeenCalledWith(`Tile at (0, 0) must not have an avatar.`);
    });

    describe('ImportExportService - isObjectCountValid', () => {
        it('should return true if the object counts and starting points are valid', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, { open: jasmine.createSpy('open') } as any, {} as any);

            spyOn(service, 'displaySnackBar');

            const validBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.randomItem.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 2 },
                    },
                ],
            ];

            const mapSize = 'petite';

            const result = service.isObjectCountValid(validBoard, mapSize);

            expect(result).toBeTrue();
            expect(service.displaySnackBar).not.toHaveBeenCalled();
        });

        it('should return false and display a snackbar if the number of universalCube objects is incorrect', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, { open: jasmine.createSpy('open') } as any, {} as any);

            spyOn(service, 'displaySnackBar');

            const invalidBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                ],
            ];

            const mapSize = 'petite';

            const result = service.isObjectCountValid(invalidBoard, mapSize);

            expect(result).toBeFalse();
            expect(service.displaySnackBar).toHaveBeenCalledWith(
                'Le nombre de points de départ (cubes universels) est incorrect. Requis: 2, trouvés: 1.',
            );
        });

        it('should return false and display a snackbar if the total number of objects exceeds the limit', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, { open: jasmine.createSpy('open') } as any, {} as any);

            spyOn(service, 'displaySnackBar');

            const invalidBoard: Tiles[][] = [
                [
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 0 },
                    },
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.universalCube.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 1 },
                    },
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.shield.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 2 },
                    },
                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.spaceSword.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 3 },
                    },

                    {
                        fieldTile: 'assets/moon-tiles.png',
                        door: false,
                        wall: false,
                        object: GAME_OBJECTS.spaceSword.object,
                        avatar: null,
                        isTileSelected: false,
                        position: { row: 0, col: 5 },
                    },
                ],
            ];

            const mapSize = 'petite';

            const result = service.isObjectCountValid(invalidBoard, mapSize);

            expect(result).toBeFalse();
            expect(service.displaySnackBar).toHaveBeenCalledWith(
                "Le nombre total d'objets (y compris objets aléatoires) dépasse la limite. Maximum autorisé: 2, trouvés: 3.",
            );
        });
    });

    describe('ImportExportService - isMapSizeValid', () => {
        it('should return true for valid board size and mapSize: petite', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, {} as any, {} as any);

            const validBoard = Array(10)
                .fill(null)
                .map(() => Array(10).fill({}));
            const result = service.isMapSizeValid(validBoard, 'petite');

            expect(result).toBeTrue();
        });

        it('should return true for valid board size and mapSize: moyenne', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, {} as any, {} as any);

            const validBoard = Array(15)
                .fill(null)
                .map(() => Array(15).fill({}));
            const result = service.isMapSizeValid(validBoard, 'moyenne');

            expect(result).toBeTrue();
        });

        it('should return true for valid board size and mapSize: grande', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, {} as any, {} as any);

            const validBoard = Array(20)
                .fill(null)
                .map(() => Array(20).fill({}));
            const result = service.isMapSizeValid(validBoard, 'grande');

            expect(result).toBeTrue();
        });

        it('should return false for invalid board size and mapSize: petite', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, {} as any, {} as any);

            const invalidBoard = Array(15)
                .fill(null)
                .map(() => Array(15).fill({}));
            const result = service.isMapSizeValid(invalidBoard, 'petite');

            expect(result).toBeFalse();
        });

        it('should return false for mismatched board size and mapSize', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, {} as any, {} as any);

            const mismatchedBoard = Array(10)
                .fill(null)
                .map(() => Array(10).fill({}));
            const result = service.isMapSizeValid(mismatchedBoard, 'grande');

            expect(result).toBeFalse();
        });
    });

    describe('ImportExportService - downloadFile', () => {
        it('should create a file and trigger download', () => {
            const service = new ImportExportService({} as any, {} as any, {} as any, {} as any, {} as any);

            const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('mock-url');
            const revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
            const appendChildSpy = spyOn(document.body, 'appendChild');
            const removeChildSpy = spyOn(document.body, 'removeChild');

            const linkMock = jasmine.createSpyObj('a', ['click']);
            spyOn(document, 'createElement').and.returnValue(linkMock as unknown as HTMLAnchorElement);

            const filename = 'test.json';
            const content = '{"key":"value"}';

            service.downloadFile(filename, content);

            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(appendChildSpy).toHaveBeenCalledWith(linkMock);
            expect(linkMock.download).toBe(filename);
            expect(linkMock.click).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalledWith(linkMock);
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('mock-url');
        });
    });
});
