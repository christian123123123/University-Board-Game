import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TilesComponent } from '@app/components/tiles/tiles.component';
import { Tiles } from '@app/interfaces/Tiles';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { BoardService } from '@app/services/edit/board/board.service';
import { ObjectsService } from '@app/services/edit/objects/objects.service';
import { TilesService } from '@app/services/edit/tiles/tiles.service';
import { DragEventService } from '@app/services/events/drag-event/drag-event.service';
import { MouseEventService } from '@app/services/events/mouse-event/mouse-event.service';

@Component({
    selector: 'app-board',
    standalone: true,
    imports: [CommonModule, TilesComponent, AdminPageComponent],
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnChanges, OnInit {
    @Input() selectedTile: Tiles | null = null;
    @Input() gameMode: string;
    @Input() mapSize: string;
    @Input() savedBoard: Tiles[][] | null = null;
    @Output() objectDropped = new EventEmitter<string>();
    @Output() objectRemoved = new EventEmitter<string>();
    originalRowIndex: number | null = null;
    originalColIndex: number | null = null;

    boardSize: number;
    board: Tiles[][];
    isMouseDownRight: boolean = false;
    isMouseDownLeft: boolean = false;
    lastToggledTile: Tiles | null = null;
    disableMouseMove: boolean = false;
    currentRoute: string = '';
    constructor(
        readonly boardService: BoardService,
        readonly tilesService: TilesService,
        readonly dragEventService: DragEventService,
        readonly mouseEventService: MouseEventService,
        readonly objectsService: ObjectsService,
    ) {}

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent): void {
        event.preventDefault();
    }

    @HostListener('document:mouseup', ['$event'])
    onMouseUp(): void {
        this.mouseEventService.onMouseUp(this);
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent): void {
        this.mouseEventService.onMouseDown(event, this);
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent): void {
        this.mouseEventService.onMouseMove(event, this);
    }

    ngOnInit(): void {
        this.boardSize = this.boardService.getBoardSize(this.mapSize);
        this.initializeBoard();
    }

    getBoardState(): Tiles[][] {
        return this.board;
    }

    initializeBoard(): void {
        if (this.savedBoard) {
            this.board = this.savedBoard;
        } else {
            this.board = this.boardService.getNewBoard(this.boardSize);
        }
    }

    selectTile(event: MouseEvent, row: number, col: number): void {
        const currentTile = this.board[row][col];
        if (event.buttons === 1 && this.selectedTile) {
            this.lastToggledTile = this.tilesService.leftClickSelect(this.selectedTile, currentTile, this);
        } else if (event.buttons === 2) {
            this.tilesService.rightClickSelect(this.board, currentTile, this);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mapSize) {
            this.boardSize = this.boardService.getBoardSize(this.mapSize);
            this.initializeBoard();
        }
    }
}
