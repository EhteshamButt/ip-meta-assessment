# ipmetafrontend

A GitHub developer dashboard: search any GitHub username and see their profile, stats (followers, stars
earned, top languages), and a sortable, paginated list of their public repositories.

Built with Next.js (App Router) on top of the [`ipmetabackend`](../ipmetabackend) API, which is the actual
integration point with the GitHub REST API — this app never calls GitHub directly.

## Architecture

```
User → Next.js frontend → ipmetabackend (NestJS) → GitHub REST API → process & aggregate → dashboard UI
```

- `/` — search form, redirects to `/u/[username]`.
- `/u/[username]` — an async Server Component that fetches the dashboard and first page of repos from
  the backend at request time, so the profile is server-rendered on load. Not-found and upstream-error
  states are handled explicitly (see `not-found.tsx` / `ErrorState`).
- Sorting and "load more" pagination on the repo list happen client-side (`RepoBrowser`), calling the
  backend directly from the browser.

## Getting started

The backend must be running first (see [`../ipmetabackend/README.md`](../ipmetabackend/README.md)).

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` | Base URL of the `ipmetabackend` API. Used both server-side (initial page render) and client-side (repo sorting/pagination), so it's intentionally `NEXT_PUBLIC_` — it points at a public read-only API, not a secret. |

## Project structure

```
app/
  page.tsx                 Home page (search)
  u/[username]/page.tsx    Dashboard (Server Component, fetches data)
  u/[username]/loading.tsx Skeleton shown while the dashboard loads
  u/[username]/not-found.tsx  Shown when notFound() is triggered
components/                Presentational + client components
lib/
  api.ts                   Typed fetch client for the backend
  types.ts                 Shared response types (mirrors backend DTOs)
  format.ts                Number/date formatting helpers
```

## Testing it locally

1. Start the backend (`npm run start:dev` in `ipmetabackend`, default port 4000).
2. Start this app (`npm run dev`, default port 3000).
3. Search a username (e.g. `torvalds`, `sindresorhus`) — the home page links to a few known-good ones.
4. Try a username that doesn't exist to see the not-found state.

## Build

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Set the **Root Directory** to `ipmetafrontend` if deploying from the monorepo root.
4. Add the environment variable `NEXT_PUBLIC_API_URL` pointing at your deployed backend
   (e.g. `https://your-backend.onrender.com/api`).
5. Deploy. Vercel auto-detects Next.js — no build command changes needed.

Make sure the backend's `CORS_ORIGIN` env var includes this app's deployed URL, or client-side repo
sorting/pagination will fail with a CORS error even though the initial page load (server-side) works fine.
