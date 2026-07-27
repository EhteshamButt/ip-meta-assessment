import { ConfigService } from '@nestjs/config';
import { TtlCacheService } from '../common/cache/ttl-cache.service';
import { AppConfig } from '../config/configuration';
import {
  GithubRateLimitException,
  GithubUserNotFoundException,
} from './github.exceptions';
import { GithubService } from './github.service';

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

function mockFetchOnce(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  const headerMap = new Map(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );

  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    statusText: 'error',
    headers: { get: (key: string) => headerMap.get(key.toLowerCase()) ?? null },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

const rawUser = {
  login: 'torvalds',
  id: 1,
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
  html_url: 'https://github.com/torvalds',
  name: 'Linus Torvalds',
  company: null,
  blog: '',
  location: 'Portland, OR',
  email: null,
  bio: null,
  twitter_username: null,
  public_repos: 10,
  public_gists: 0,
  followers: 200000,
  following: 0,
  created_at: '2011-09-03T15:26:22Z',
};

describe('GithubService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('fetches and maps a user profile', async () => {
    mockFetchOnce(200, rawUser);
    const service = new GithubService(
      makeConfigService(),
      new TtlCacheService(),
    );

    const profile = await service.getProfile('torvalds');

    expect(profile.username).toBe('torvalds');
    expect(profile.followers).toBe(200000);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws GithubUserNotFoundException on a 404 response', async () => {
    mockFetchOnce(404, { message: 'Not Found' });
    const service = new GithubService(
      makeConfigService(),
      new TtlCacheService(),
    );

    await expect(service.getProfile('does-not-exist')).rejects.toBeInstanceOf(
      GithubUserNotFoundException,
    );
  });

  it('throws GithubRateLimitException when GitHub reports an exhausted quota', async () => {
    mockFetchOnce(
      403,
      { message: 'rate limit exceeded' },
      {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60),
      },
    );
    const service = new GithubService(
      makeConfigService(),
      new TtlCacheService(),
    );

    await expect(service.getProfile('torvalds')).rejects.toBeInstanceOf(
      GithubRateLimitException,
    );
  });

  it('serves repeated profile lookups from cache without refetching', async () => {
    mockFetchOnce(200, rawUser);
    const service = new GithubService(
      makeConfigService(),
      new TtlCacheService(),
    );

    await service.getProfile('torvalds');
    await service.getProfile('torvalds');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
