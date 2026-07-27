export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface OpenAiChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}
