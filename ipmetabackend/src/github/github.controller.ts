import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { GithubService } from './github.service';
import {
  DeveloperDashboard,
  PaginatedRepos,
  RepoSort,
} from './interfaces/github.types';
import { DEFAULT_REPO_PAGE_SIZE, MAX_REPOS_PER_PAGE } from './github.constants';

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const VALID_SORTS: RepoSort[] = ['stars', 'updated', 'forks', 'name'];

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get(':username')
  getDashboard(
    @Param('username') username: string,
  ): Promise<DeveloperDashboard> {
    this.assertValidUsername(username);
    return this.githubService.getDashboard(username);
  }

  @Get(':username/repos')
  getRepos(
    @Param('username') username: string,
    @Query('page') pageParam?: string,
    @Query('perPage') perPageParam?: string,
    @Query('sort') sortParam?: string,
  ): Promise<PaginatedRepos> {
    this.assertValidUsername(username);

    const page = this.parsePositiveInt(pageParam, 1);
    const perPage = Math.min(
      this.parsePositiveInt(perPageParam, DEFAULT_REPO_PAGE_SIZE),
      MAX_REPOS_PER_PAGE,
    );
    const sort = this.parseSort(sortParam);

    return this.githubService.listRepos(username, page, perPage, sort);
  }

  private assertValidUsername(username: string): void {
    if (!USERNAME_PATTERN.test(username)) {
      throw new BadRequestException('Invalid GitHub username format.');
    }
  }

  private parsePositiveInt(
    value: string | undefined,
    fallback: number,
  ): number {
    if (!value) return fallback;
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseSort(value: string | undefined): RepoSort {
    return VALID_SORTS.includes(value as RepoSort)
      ? (value as RepoSort)
      : 'updated';
  }
}
