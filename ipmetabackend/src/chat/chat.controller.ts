import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { ChatReplyDto, ChatRequestDto } from './dto/chat-request.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async postMessage(@Body() body: ChatRequestDto): Promise<ChatReplyDto> {
    const reply = await this.chatService.reply(body?.messages);
    return { reply };
  }
}
