import { HttpException, HttpStatus } from '@nestjs/common';

export class ChatNotConfiguredException extends HttpException {
  constructor() {
    super(
      'The AI guide is not configured. Set OPENAI_API_KEY on the server.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class ChatUpstreamException extends HttpException {
  constructor(status: number, detail: string) {
    super(
      `AI service error (${status}): ${detail.slice(0, 200)}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
