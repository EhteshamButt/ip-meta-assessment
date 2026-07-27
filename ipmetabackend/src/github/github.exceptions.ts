import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

export class GithubUserNotFoundException extends NotFoundException {
  constructor(username: string) {
    super(`GitHub user "${username}" does not exist.`);
  }
}

export class GithubRateLimitException extends HttpException {
  constructor(resetAt: Date | null) {
    const message = resetAt
      ? `GitHub API rate limit exceeded. Try again after ${resetAt.toISOString()}.`
      : 'GitHub API rate limit exceeded. Try again shortly.';

    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        resetAt: resetAt?.toISOString() ?? null,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class GithubUpstreamException extends HttpException {
  constructor(status: number, detail: string) {
    super(
      `GitHub API request failed (${status}): ${detail}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
