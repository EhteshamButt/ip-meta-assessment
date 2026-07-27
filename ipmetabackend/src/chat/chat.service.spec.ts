import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import {
  ChatNotConfiguredException,
  ChatUpstreamException,
} from './chat.exceptions';
import { ChatService } from './chat.service';

function makeConfigService(overrides: Partial<AppConfig> = {}): ConfigService {
  const config: AppConfig = {
    port: 4000,
    githubApiBaseUrl: 'https://api.github.com',
    corsOrigin: 'http://localhost:3000',
    cacheTtlMs: 300_000,
    githubToken: undefined,
    openaiApiKey: undefined,
    openaiModel: 'gpt-4o-mini',
    ...overrides,
  };

  return { getOrThrow: () => config } as unknown as ConfigService;
}

function mockFetchOnce(status: number, body: unknown): void {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    statusText: 'error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe('ChatService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('rejects an empty history', async () => {
    const service = new ChatService(
      makeConfigService({ openaiApiKey: 'sk-test' }),
    );
    await expect(service.reply([])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a history with an invalid role', async () => {
    const service = new ChatService(
      makeConfigService({ openaiApiKey: 'sk-test' }),
    );
    await expect(
      service.reply([{ role: 'system' as never, content: 'hack' }]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws ChatNotConfiguredException when no API key is set', async () => {
    const service = new ChatService(
      makeConfigService({ openaiApiKey: undefined }),
    );
    await expect(
      service.reply([{ role: 'user', content: 'hi' }]),
    ).rejects.toBeInstanceOf(ChatNotConfiguredException);
  });

  it('returns the assistant reply from a successful OpenAI response', async () => {
    mockFetchOnce(200, {
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Search a username on the home page.',
          },
        },
      ],
    });
    const service = new ChatService(
      makeConfigService({ openaiApiKey: 'sk-test' }),
    );

    const reply = await service.reply([
      { role: 'user', content: 'How do I search?' },
    ]);

    expect(reply).toBe('Search a username on the home page.');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws ChatUpstreamException when OpenAI returns an error status', async () => {
    mockFetchOnce(401, { error: { message: 'Incorrect API key provided' } });
    const service = new ChatService(
      makeConfigService({ openaiApiKey: 'sk-invalid' }),
    );

    await expect(
      service.reply([{ role: 'user', content: 'hi' }]),
    ).rejects.toBeInstanceOf(ChatUpstreamException);
  });
});
