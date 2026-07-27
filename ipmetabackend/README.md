# ipmetabackend

NestJS API that wraps the public [GitHub REST API](https://docs.github.com/en/rest) to power a developer
dashboard: profile details, aggregated repository stats (stars, forks, language breakdown), and paginated,
sortable repository listings for any GitHub username.

This exists so the frontend never talks to GitHub directly — the backend handles authentication, caching,
retries, and rate-limit/error normalization in one place.

## Why a backend at all?

The GitHub API is public and could be called straight from the browser, but that pushes every hard problem
onto the client: leaking (or duplicating) a token, no shared cache between visitors, and every consumer
re-implementing retry/rate-limit handling. Centralizing it here means:

- The GitHub token (if you have one) never reaches the browser.
- Repeated lookups for the same username are served from an in-memory cache instead of re-hitting GitHub.
- Rate-limit, not-found, and upstream failures are normalized into consistent HTTP responses instead of
  leaking GitHub's raw error shapes to the frontend.

## Architecture

```
Browser
  │
  ▼
Next.js frontend  ──────────────►  ipmetabackend (NestJS)  ──────────────►  GitHub REST API
                     HTTP/JSON        │                        HTTPS
                                      ├─ GithubController   (routes, input validation)
                                      ├─ GithubService       (fetch, retry/backoff, aggregation)
                                      ├─ TtlCacheService     (in-memory response cache)
                                      └─ HttpExceptionFilter (consistent error responses)
```

## Tech stack

- [NestJS 11](https://nestjs.com/) + TypeScript
- Native `fetch` (Node 24) — no HTTP client dependency needed
- `@nestjs/config` for typed environment configuration
- Jest for unit tests

## Getting started

```bash
npm install
cp .env.example .env   # then fill in values, see below
npm run start:dev
```

The API listens on `http://localhost:4000` by default, with every route under the `/api` prefix
(e.g. `http://localhost:4000/api/health`).

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `4000` | Port the server listens on |
| `GITHUB_TOKEN` | No, but recommended | — | GitHub personal access token. Without it, requests are capped at GitHub's unauthenticated limit of 60/hour; with it, 5,000/hour. See below for how to generate one. |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Comma-separated list of origins allowed to call this API |
| `CACHE_TTL_MS` | No | `300000` (5 min) | How long GitHub responses are cached in memory |

### Getting a GitHub token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) → **Generate new token (classic)**.
2. Give it a name (e.g. `ipmeta-dashboard`), set an expiration, and leave all scope checkboxes unchecked —
   this app only reads public data, so no scopes are required.
3. Generate the token and copy it immediately (GitHub only shows it once).
4. Paste it into `.env` as `GITHUB_TOKEN=ghp_...`. Never commit this file — it's already gitignored.

The app runs fine without a token for local development; add one before deploying so a live demo doesn't
run into rate limits during review.

## API reference

All responses are JSON. All errors follow the shape:

```json
{ "statusCode": 404, "message": "GitHub user \"foo\" does not exist.", "path": "/api/github/foo", "timestamp": "..." }
```

### `GET /api/health`

Liveness check.

```json
{ "status": "ok", "service": "ipmetabackend", "timestamp": "2025-01-01T00:00:00.000Z" }
```

### `GET /api/github/:username`

Returns the user's profile plus aggregated stats computed from their repositories (stars/forks earned,
top languages, top repos by stars). Repos are analyzed across up to 300 repositories (3 pages of 100); for
accounts with more, stats are computed from the most recently updated 300.

```json
{
  "profile": {
    "username": "torvalds",
    "name": "Linus Torvalds",
    "avatarUrl": "...",
    "profileUrl": "...",
    "bio": null,
    "company": null,
    "location": "Portland, OR",
    "blog": null,
    "twitterUsername": null,
    "followers": 250000,
    "following": 0,
    "publicRepos": 10,
    "publicGists": 0,
    "joinedAt": "2011-09-03T15:26:22Z"
  },
  "stats": {
    "totalStars": 200000,
    "totalForks": 45000,
    "originalRepoCount": 6,
    "forkedRepoCount": 4,
    "reposAnalyzed": 10
  },
  "topLanguages": [{ "language": "C", "repoCount": 3, "percentage": 50 }],
  "topRepos": [{ "id": 1, "name": "linux", "stars": 190000, "...": "..." }],
  "generatedAt": "2025-01-01T00:00:00.000Z"
}
```

### `GET /api/github/:username/repos`

Paginated repository listing.

Query params:

| Param | Default | Notes |
|---|---|---|
| `page` | `1` | 1-indexed |
| `perPage` | `12` | Capped at 100 (GitHub's own max) |
| `sort` | `updated` | One of `updated`, `stars`, `forks`, `name`. `stars`/`forks` are sorted client-side since GitHub's repo-listing endpoint doesn't support sorting by them natively. |

```json
{
  "username": "torvalds",
  "page": 1,
  "perPage": 12,
  "sort": "updated",
  "repos": [{ "id": 1, "name": "linux", "stars": 190000, "...": "..." }],
  "hasNextPage": true
}
```

Errors: `400` invalid username format, `404` user not found, `429` GitHub rate limit exceeded (includes a
`resetAt` timestamp), `502` upstream GitHub failure.

## Design notes

- **Caching**: a minimal in-memory TTL cache (`TtlCacheService`) sits in front of every GitHub call. It's
  intentionally simple — good enough for a single instance; swap for Redis if this ever needs to scale
  horizontally.
- **Retries**: transient network errors and `5xx` responses from GitHub are retried up to twice with
  exponential backoff before failing.
- **Rate limits**: a `403`/`429` from GitHub with an exhausted quota is translated into a `429` with the
  quota reset time, rather than surfacing GitHub's raw response.

## Testing

```bash
npm test        # unit tests
npm run test:cov
```

`GithubService` is tested against a mocked `fetch` — profile mapping, 404 handling, rate-limit handling,
and cache reuse.

## Deployment (Render)

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **New Web Service** from the repo.
3. Settings:
   - **Root directory**: `ipmetabackend` (if deploying from the monorepo root) or leave blank if this is
     its own repo.
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm run start:prod`
4. Add environment variables from the table above (`GITHUB_TOKEN`, `CORS_ORIGIN` set to your deployed
   frontend URL, etc.). Render sets `PORT` automatically.
5. Deploy, then confirm `https://<your-service>.onrender.com/api/health` returns `{"status":"ok",...}`.

Railway and Fly.io work the same way — Node build command, start command, and the same env vars.
