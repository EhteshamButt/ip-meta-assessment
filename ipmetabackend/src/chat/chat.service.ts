import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import {
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_LENGTH,
  OPENAI_CHAT_COMPLETIONS_URL,
  SYSTEM_PROMPT,
} from './chat.constants';
import {
  ChatNotConfiguredException,
  ChatUpstreamException,
} from './chat.exceptions';
import { ChatMessage, OpenAiChatCompletionResponse } from './chat.types';

@Injectable()
export class ChatService {
  private readonly config: AppConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<AppConfig>('app');
  }

  async reply(history: ChatMessage[]): Promise<string> {
    this.assertValidHistory(history);

    if (!this.config.openaiApiKey) {
      throw new ChatNotConfiguredException();
    }

    const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);

    let response: Response;
    try {
      response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.openaiModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...trimmedHistory,
          ],
          temperature: 0.4,
          max_tokens: 400,
        }),
      });
    } catch (error) {
      throw new ChatUpstreamException(
        0,
        error instanceof Error ? error.message : 'network error',
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ChatUpstreamException(
        response.status,
        detail || response.statusText,
      );
    }

    const data = (await response.json()) as OpenAiChatCompletionResponse;
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new ChatUpstreamException(502, 'empty response from AI service');
    }

    return reply;
  }

  private assertValidHistory(
    history: unknown,
  ): asserts history is ChatMessage[] {
    const isValid =
      Array.isArray(history) &&
      history.length > 0 &&
      history.every(
        (item: unknown) =>
          typeof item === 'object' &&
          item !== null &&
          ((item as ChatMessage).role === 'user' ||
            (item as ChatMessage).role === 'assistant') &&
          typeof (item as ChatMessage).content === 'string' &&
          (item as ChatMessage).content.length > 0 &&
          (item as ChatMessage).content.length <= MAX_MESSAGE_LENGTH,
      );

    if (!isValid) {
      throw new BadRequestException(
        'Expected a non-empty array of { role: "user" | "assistant", content } messages.',
      );
    }
  }
}
