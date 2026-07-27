export const GITHUB_CACHE_KEYS = {
  profile: (username: string) => `github:profile:${username.toLowerCase()}`,
  repos: (username: string, page: number, perPage: number, sort: string) =>
    `github:repos:${username.toLowerCase()}:${sort}:${page}:${perPage}`,
  dashboard: (username: string) => `github:dashboard:${username.toLowerCase()}`,
};

// GitHub caps per_page at 100. We pull a bounded number of pages to compute
// aggregate stats (stars/forks/languages) without risking a runaway number
// of requests against accounts with thousands of repos.
export const MAX_REPOS_PER_PAGE = 100;
export const MAX_AGGREGATE_PAGES = 3;
export const DEFAULT_REPO_PAGE_SIZE = 12;
export const MAX_FETCH_RETRIES = 2;
export const RETRY_BASE_DELAY_MS = 300;
