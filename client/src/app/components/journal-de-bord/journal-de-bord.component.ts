import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Player } from '@app/interfaces/Player';

@Component({
    selector: 'app-journal-box',
    standalone: true,
    imports: [CommonModule, NgClass, FormsModule],
    templateUrl: './journal-de-bord.component.html',
    styleUrls: ['./journal-de-bord.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class JournalComponent {
    @ViewChild('messagesContainer') public messagesContainer: ElementRef;
    @Input() accessCode: string = '';
    @Input() player: Player;
    @Input() welcomeMessage: string = '';
    @Input() currentRoute: string | null = null;
    @Input() roomJournal: { usersMentionned: Player[]; text: string }[];
    inputMessage: string = '';
    messages: { user: string; text: string; time: Date }[] = [];
    serverClock: Date;
    showUserMessagesOnly: boolean = false;

    constructor(readonly route: ActivatedRoute) {}

    toggleUserMessages(): void {
        this.showUserMessagesOnly = !this.showUserMessagesOnly;
    }

    isUserMentionned(message: { usersMentionned: Player[]; text: string }, myPlayer: Player): boolean {
        return message.usersMentionned.some((user) => user.username === myPlayer.username);
    }
}
