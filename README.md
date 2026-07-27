# GitHub Developer Dashboard

A full-stack app that integrates the public [GitHub REST API](https://docs.github.com/en/rest): search any
GitHub username and get their profile, aggregated repository stats (stars/forks earned, top languages),
and a sortable, paginated list of their public repositories.

```
User → Next.js frontend → NestJS backend → GitHub REST API → aggregate & cache → dashboard UI
```

The backend is the actual integration point with GitHub — it owns auth, caching, retries, and rate-limit
handling, so the frontend just renders whatever it returns.

## Structure

This is a two-service monorepo:

| Directory | What it is | README |
|---|---|---|
| [`ipmetabackend/`](./ipmetabackend) | NestJS API that talks to GitHub | [setup + API reference](./ipmetabackend/README.md) |
| [`ipmetafrontend/`](./ipmetafrontend) | Next.js dashboard UI | [setup + architecture](./ipmetafrontend/README.md) |

## Quick start

```bash
# terminal 1
cd ipmetabackend
npm install
cp .env.example .env   # optionally add a GITHUB_TOKEN, see its README
npm run start:dev      # http://localhost:4000

# terminal 2
cd ipmetafrontend
npm install
cp .env.example .env.local
npm run dev             # http://localhost:3000
```

Open `http://localhost:3000` and search a GitHub username (e.g. `torvalds`).

## Tech stack

- **Backend**: NestJS, TypeScript, native `fetch`, in-memory TTL caching, Jest
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS

## Notable engineering details

- Requests to GitHub are cached in memory and retried with backoff on transient failures.
- GitHub's rate-limit responses are normalized into a proper `429` with a reset timestamp instead of
  leaking GitHub's raw error shape.
- The dashboard is server-rendered on first load; sorting/pagination of the repo list happens client-side
  against the backend directly.

See each service's README for environment variables, the full API reference, and deployment steps
(Render for the backend, Vercel for the frontend).
