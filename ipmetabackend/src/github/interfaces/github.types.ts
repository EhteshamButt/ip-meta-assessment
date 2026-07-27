// Shape of the fields we actually use from GitHub's REST API responses.
// GitHub returns a lot more than this per object; we only type what we read.

export interface GithubUserResponse {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GithubRepoResponse {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  archived: boolean;
  updated_at: string;
  pushed_at: string;
  topics?: string[];
}

export type RepoSort = 'stars' | 'updated' | 'forks' | 'name';

export interface RepoSummary {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isFork: boolean;
  isArchived: boolean;
  updatedAt: string;
  topics: string[];
}

export interface LanguageStat {
  language: string;
  repoCount: number;
  percentage: number;
}

export interface DeveloperProfile {
  username: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitterUsername: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  joinedAt: string;
}

export interface DeveloperDashboard {
  profile: DeveloperProfile;
  stats: {
    totalStars: number;
    totalForks: number;
    originalRepoCount: number;
    forkedRepoCount: number;
    reposAnalyzed: number;
  };
  topLanguages: LanguageStat[];
  topRepos: RepoSummary[];
  generatedAt: string;
}

export interface PaginatedRepos {
  username: string;
  page: number;
  perPage: number;
  sort: RepoSort;
  repos: RepoSummary[];
  hasNextPage: boolean;
}
