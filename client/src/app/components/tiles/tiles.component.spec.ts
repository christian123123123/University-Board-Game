import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TilesComponent } from './tiles.component';

describe('TilesComponent', () => {
    let component: TilesComponent;
    let fixture: ComponentFixture<TilesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [TilesComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TilesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should initialize with the correct number of tiles', () => {
        const NUMBER_TILES = 4;
        expect(component.tiles.length).toBe(NUMBER_TILES);
    });

    it('should set the selectedTileUrl and emit tileSelected event when a tile is selected', () => {
        const tile = component.tiles[1];
        spyOn(component.tileSelected, 'emit');

        component.selectTile(tile);

        expect(component.selectedTileUrl).toBe(tile);
        expect(component.tileSelected.emit).toHaveBeenCalledWith(tile);
    });
});
