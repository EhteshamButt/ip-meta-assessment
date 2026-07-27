import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TtlCacheService } from '../common/cache/ttl-cache.service';
import { AppConfig } from '../config/configuration';
import {
  GithubRateLimitException,
  GithubUpstreamException,
  GithubUserNotFoundException,
} from './github.exceptions';
import {
  DeveloperDashboard,
  DeveloperProfile,
  GithubRepoResponse,
  GithubUserResponse,
  LanguageStat,
  PaginatedRepos,
  RepoSort,
  RepoSummary,
} from './interfaces/github.types';
import {
  GITHUB_CACHE_KEYS,
  MAX_AGGREGATE_PAGES,
  MAX_FETCH_RETRIES,
  MAX_REPOS_PER_PAGE,
  RETRY_BASE_DELAY_MS,
} from './github.constants';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly config: AppConfig;

  constructor(
    configService: ConfigService,
    private readonly cache: TtlCacheService,
  ) {
    this.config = configService.getOrThrow<AppConfig>('app');

    if (!this.config.githubToken) {
      this.logger.warn(
        'GITHUB_TOKEN is not set. Requests will use the unauthenticated ' +
          'rate limit of 60 requests/hour instead of 5,000/hour.',
      );
    }
  }

  async getProfile(username: string): Promise<DeveloperProfile> {
    return this.cache.wrap(
      GITHUB_CACHE_KEYS.profile(username),
      this.config.cacheTtlMs,
      async () => {
        const { data } = await this.fetchJson<GithubUserResponse>(
          `/users/${encodeURIComponent(username)}`,
          () => new GithubUserNotFoundException(username),
        );
        return this.toProfile(data);
      },
    );
  }

  async listRepos(
    username: string,
    page: number,
    perPage: number,
    sort: RepoSort,
  ): Promise<PaginatedRepos> {
    return this.cache.wrap(
      GITHUB_CACHE_KEYS.repos(username, page, perPage, sort),
      this.config.cacheTtlMs,
      async () => {
        const { data, headers } = await this.fetchRepoPage(
          username,
          page,
          perPage,
          sort,
        );

        return {
          username,
          page,
          perPage,
          sort,
          repos: data.map((repo) => this.toRepoSummary(repo)),
          hasNextPage: this.linkHeaderHasNext(headers.get('link')),
        };
      },
    );
  }

  async getDashboard(username: string): Promise<DeveloperDashboard> {
    return this.cache.wrap(
      GITHUB_CACHE_KEYS.dashboard(username),
      this.config.cacheTtlMs,
      async () => {
        const profile = await this.getProfile(username);
        const repos = await this.fetchReposForAggregation(
          username,
          profile.publicRepos,
        );

        const originalRepos = repos.filter((repo) => !repo.fork);
        const forkedRepos = repos.filter((repo) => repo.fork);

        const totalStars = originalRepos.reduce(
          (sum, r) => sum + r.stargazers_count,
          0,
        );
        const totalForks = originalRepos.reduce(
          (sum, r) => sum + r.forks_count,
          0,
        );

        const topLanguages = this.computeLanguageBreakdown(originalRepos);
        const topRepos = [...originalRepos]
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 6)
          .map((repo) => this.toRepoSummary(repo));

        return {
          profile,
          stats: {
            totalStars,
            totalForks,
            originalRepoCount: originalRepos.length,
            forkedRepoCount: forkedRepos.length,
            reposAnalyzed: repos.length,
          },
          topLanguages,
          topRepos,
          generatedAt: new Date().toISOString(),
        };
      },
    );
  }

  private async fetchReposForAggregation(
    username: string,
    publicRepoCount: number,
  ): Promise<GithubRepoResponse[]> {
    const pagesNeeded = Math.min(
      MAX_AGGREGATE_PAGES,
      Math.max(1, Math.ceil(publicRepoCount / MAX_REPOS_PER_PAGE)),
    );

    const pages = await Promise.all(
      Array.from({ length: pagesNeeded }, (_, i) =>
        this.fetchRepoPage(username, i + 1, MAX_REPOS_PER_PAGE, 'updated'),
      ),
    );

    return pages.flatMap((page) => page.data);
  }

  private async fetchRepoPage(
    username: string,
    page: number,
    perPage: number,
    sort: RepoSort,
  ): Promise<{ data: GithubRepoResponse[]; headers: Headers }> {
    return this.fetchJson<GithubRepoResponse[]>(
      `/users/${encodeURIComponent(username)}/repos`,
      () => new GithubUserNotFoundException(username),
      {
        sort: sort === 'stars' || sort === 'forks' ? 'updated' : sort,
        direction: 'desc',
        per_page: String(Math.min(perPage, MAX_REPOS_PER_PAGE)),
        page: String(page),
      },
    ).then(({ data, headers }) => ({
      data: this.applyClientSideSort(data, sort),
      headers,
    }));
  }

  // GitHub's REST API can only sort repos by created/updated/pushed/full_name,
  // not by stars or forks, so those two sort modes are applied client-side.
  private applyClientSideSort(
    repos: GithubRepoResponse[],
    sort: RepoSort,
  ): GithubRepoResponse[] {
    if (sort === 'stars') {
      return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
    if (sort === 'forks') {
      return [...repos].sort((a, b) => b.forks_count - a.forks_count);
    }
    return repos;
  }

  private computeLanguageBreakdown(
    repos: GithubRepoResponse[],
  ): LanguageStat[] {
    const counts = new Map<string, number>();
    let taggedRepoCount = 0;

    for (const repo of repos) {
      if (!repo.language) continue;
      taggedRepoCount += 1;
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }

    if (taggedRepoCount === 0) return [];

    return [...counts.entries()]
      .map(([language, repoCount]) => ({
        language,
        repoCount,
        percentage: Math.round((repoCount / taggedRepoCount) * 1000) / 10,
      }))
      .sort((a, b) => b.repoCount - a.repoCount)
      .slice(0, 6);
  }

  private toProfile(user: GithubUserResponse): DeveloperProfile {
    return {
      username: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      profileUrl: user.html_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog || null,
      twitterUsername: user.twitter_username,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      joinedAt: user.created_at,
    };
  }

  private toRepoSummary(repo: GithubRepoResponse): RepoSummary {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      isFork: repo.fork,
      isArchived: repo.archived,
      updatedAt: repo.updated_at,
      topics: repo.topics ?? [],
    };
  }

  private linkHeaderHasNext(link: string | null): boolean {
    if (!link) return false;
    return link.split(',').some((part) => part.includes('rel="next"'));
  }

  private async fetchJson<T>(
    path: string,
    notFoundError: () => Error,
    query?: Record<string, string>,
    attempt = 0,
  ): Promise<{ data: T; headers: Headers }> {
    const url = new URL(this.config.githubApiBaseUrl + path);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.config.githubToken) {
      headers.Authorization = `Bearer ${this.config.githubToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (error) {
      if (attempt < MAX_FETCH_RETRIES) {
        await this.delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
        return this.fetchJson<T>(path, notFoundError, query, attempt + 1);
      }
      throw new GithubUpstreamException(
        0,
        error instanceof Error ? error.message : 'network error',
      );
    }

    if (response.status === 404) {
      throw notFoundError();
    }

    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      const resetHeader = response.headers.get('x-ratelimit-reset');
      const resetAt = resetHeader
        ? new Date(parseInt(resetHeader, 10) * 1000)
        : null;

      if (remaining === '0' || response.status === 429) {
        throw new GithubRateLimitException(resetAt);
      }
    }

    if (!response.ok) {
      if (response.status >= 500 && attempt < MAX_FETCH_RETRIES) {
        await this.delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
        return this.fetchJson<T>(path, notFoundError, query, attempt + 1);
      }

      const body = await response.text();
      throw new GithubUpstreamException(
        response.status,
        body || response.statusText,
      );
    }

    const data = (await response.json()) as T;
    return { data, headers: response.headers };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
