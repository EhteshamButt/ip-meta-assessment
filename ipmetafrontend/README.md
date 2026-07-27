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
- An AI guide (bottom-right chat widget, `AiGuideChat`) answers questions about using the app. It calls
  `app/api/chat/route.ts`, a Next.js Route Handler that proxies to OpenAI's Chat Completions API — the
  key stays server-side; the browser only ever talks to this app's own `/api/chat` route.

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
| `OPENAI_API_KEY` | Yes, for the AI guide | — | Powers the chat widget. **Not** `NEXT_PUBLIC_` — it's read only inside the `/api/chat` route handler, server-side, and never sent to the browser. Get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys). This is a paid, usage-billed API — set a spending limit on your OpenAI account before deploying publicly. |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Override if that model is retired by the time you deploy. |

## Project structure

```
app/
  page.tsx                 Home page (search)
  u/[username]/page.tsx    Dashboard (Server Component, fetches data)
  u/[username]/loading.tsx Skeleton shown while the dashboard loads
  u/[username]/not-found.tsx  Shown when notFound() is triggered
  api/chat/route.ts        Server-side proxy to OpenAI for the AI guide
components/
  AiGuideChat.tsx           Bottom-right chat widget
  ...                       Other presentational + client components
lib/
  api.ts                   Typed fetch client for the backend
  chat.ts                  Types + client helper for the AI guide
  types.ts                 Shared response types (mirrors backend DTOs)
  format.ts                Number/date formatting helpers
```

### AI guide notes

The `/api/chat` route caps each request to the last 12 messages and 1000 characters per message before
forwarding to OpenAI, mainly to bound per-request cost rather than as abuse prevention — there's no
per-IP rate limiting, since that needs persistent state (a KV store, etc.) that's out of scope here. If
this goes past a demo/assessment context, add that before relying on the OpenAI spending limit alone.

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
4. Add environment variables: `NEXT_PUBLIC_API_URL` pointing at your deployed backend
   (e.g. `https://your-backend.onrender.com/api`), and `OPENAI_API_KEY` for the AI guide.
5. Deploy. Vercel auto-detects Next.js — no build command changes needed.

Make sure the backend's `CORS_ORIGIN` env var includes this app's deployed URL, or client-side repo
sorting/pagination will fail with a CORS error even though the initial page load (server-side) works fine.
