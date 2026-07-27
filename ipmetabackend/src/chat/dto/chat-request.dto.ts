import { ChatMessage } from '../chat.types';

export interface ChatRequestDto {
  messages: ChatMessage[];
}

export interface ChatReplyDto {
  reply: string;
}
