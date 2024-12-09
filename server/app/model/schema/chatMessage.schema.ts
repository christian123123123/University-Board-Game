import { ChatMessage as IChatMessage } from '@common/chat-message.interface';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessage implements IChatMessage {
    @ApiProperty({ example: 'Mon Message' })
    user: string;
    @ApiProperty({ example: 'Je suis envoyé à partir de la documentation!' })
    text: string;
    @ApiProperty({ example: 'le temps que le messsage à été envoyé' })
    time: Date;
}
