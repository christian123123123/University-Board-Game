import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Character } from '@app/interfaces/Character';

@Component({
    selector: 'app-character-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './character-stats.component.html',
    styleUrl: './character-stats.component.scss',
})
export class CharacterStatsComponent implements OnInit {
    @Input() selectedCharacter: Character | null = null;
    @Input() currentRoute: string | null = null;
    /* eslint-disable @typescript-eslint/naming-convention */ // These are constants
    readonly MAX_VALUE_HEALTH_SPEED: number = 10;
    readonly MAX_VALUE_ATTACK_DEFENSE: number = 10;
    constructor(private route: ActivatedRoute) {}
    /* eslint-disable @typescript-eslint/naming-convention */
    ngOnInit(): void {
        this.route.url.subscribe((url) => {
            this.currentRoute = url[0]?.path;
        });
    }
    getStatWidth(currentNumber: number, maxValue: number): string {
        const PERCENT = 100;
        return (currentNumber / maxValue) * PERCENT + '%';
    }
}
