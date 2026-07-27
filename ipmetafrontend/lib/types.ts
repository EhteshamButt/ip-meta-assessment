export type RepoSort = "stars" | "updated" | "forks" | "name";

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

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  path?: string;
  timestamp?: string;
}
