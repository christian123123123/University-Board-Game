import { CommonModule, NgClass } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Player } from '@app/interfaces/Player';
import { SharedDataService } from '@app/services/shared-data/shared-data.service';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatMessage } from '@common/chat-message.interface';

@Component({
    selector: 'app-chat-box',
    standalone: true,
    imports: [CommonModule, NgClass, FormsModule],
    templateUrl: './chat-box.component.html',
    styleUrls: ['./chat-box.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ChatBoxComponent implements OnInit, AfterViewChecked {
    @Input() accessCode: string = '';
    @Input() player: Player;
    @Input() welcomeMessage: string = '';
    @Input() currentRoute: string | null = null;
    @Input() roomHistory: ChatMessage[];
    @ViewChild('messagesContainer') messagesContainer: ElementRef;
    inputMessage: string = '';
    messages: ChatMessage[] = [];
    serverClock: Date;

    shouldScroll: boolean = false;

    constructor(
        readonly socketService: SocketService,
        readonly route: ActivatedRoute,
        readonly sharedService: SharedDataService,
    ) {}

    ngOnInit(): void {
        if (this.sharedService.getChatHistory()) {
            this.messages = this.sharedService.getChatHistory();
        } else {
            this.messages = [];
        }
        this.setupListeners();
        this.route.url.subscribe((url) => {
            this.currentRoute = url[0]?.path;
        });
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    setupListeners(): void {
        this.socketService.off('roomMessage');
        this.socketService.off('messageFromServer');

        this.socketService.on('roomMessage', (res: { username: string; message: string }) => {
            this.messages.push({ user: res.username, text: res.message, time: this.serverClock });
            const filteredMessages = this.messages.filter((message) => message.user !== 'server');
            this.sharedService.setChatHistory(filteredMessages);
            this.shouldScroll = true;
        });

        this.socketService.on('messageFromServer', (message: string) => {
            this.messages.push({ user: 'server', text: message, time: this.serverClock });
            this.shouldScroll = true;
        });

        this.socketService.on('clock', (time: Date) => {
            this.serverClock = time;
        });
    }

    scrollToBottom(): void {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }

    sendMessage(): void {
        if (this.inputMessage.trim()) {
            this.socketService.emit('sendMessage', {
                username: this.player.username,
                room: this.accessCode,
                message: this.inputMessage,
                time: this.serverClock,
            });
            this.inputMessage = '';
            this.shouldScroll = true;
        }
    }
}
