# ipmetafrontend

A GitHub developer dashboard: search any GitHub username and see their profile, stats (followers, stars
earned, top languages), and a sortable, paginated list of their public repositories. Includes an in-app
AI guide (chat widget) that answers questions about using the dashboard.

Built with Next.js (App Router) on top of the [`ipmetabackend`](../ipmetabackend) API, which is the actual
integration point with the GitHub REST API and OpenAI's Chat Completions API — this app never calls either
directly; it only ever talks to its own backend.

## Architecture

```
User → Next.js frontend → ipmetabackend (NestJS) → GitHub REST API → process & aggregate → dashboard UI
                                                  → OpenAI Chat Completions API → AI guide replies
```

- `/` — search form, redirects to `/u/[username]`.
- `/u/[username]` — an async Server Component that fetches the dashboard and first page of repos from
  the backend at request time, so the profile is server-rendered on load. Not-found and upstream-error
  states are handled explicitly (see `not-found.tsx` / `ErrorState`).
- Sorting and "load more" pagination on the repo list happen client-side (`RepoBrowser`), calling the
  backend directly from the browser.
- An AI guide (bottom-right chat widget, `AiGuideChat`) answers questions about using the app. It calls
  the backend's `POST /chat` endpoint — this app holds no AI API key of its own, and never talks to
  OpenAI directly.

## Getting started

The backend must be running first (see [`../ipmetabackend/README.md`](../ipmetabackend/README.md)) — it's
where the GitHub and OpenAI API keys actually live.

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000/api` | Base URL of the `ipmetabackend` API. Used both server-side (initial page render) and client-side (repo sorting/pagination, AI guide chat), so it's intentionally `NEXT_PUBLIC_` — it points at this project's own backend, not a secret. |

This app has no other env vars — no API keys live here. `GITHUB_TOKEN` and `OPENAI_API_KEY` are both
backend-only; see `ipmetabackend/README.md`.

## Project structure

```
app/
  page.tsx                 Home page (search)
  u/[username]/page.tsx    Dashboard (Server Component, fetches data)
  u/[username]/loading.tsx Skeleton shown while the dashboard loads
  u/[username]/not-found.tsx  Shown when notFound() is triggered
components/
  AiGuideChat.tsx           Bottom-right chat widget
  ...                       Other presentational + client components
lib/
  api.ts                   Typed fetch client for the backend (GitHub data)
  chat.ts                  Typed fetch client for the backend (AI guide)
  types.ts                 Shared response types (mirrors backend DTOs)
  format.ts                Number/date formatting helpers
```

## Testing it locally

1. Start the backend (`npm run start:dev` in `ipmetabackend`, default port 4000) with a real
   `OPENAI_API_KEY` set if you want to test the AI guide's actual replies.
2. Start this app (`npm run dev`, default port 3000).
3. Search a username (e.g. `torvalds`, `sindresorhus`) — the home page links to a few known-good ones.
4. Try a username that doesn't exist to see the not-found state.
5. Open the chat widget (bottom-right) and ask something like "how do I sort repos?".

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

Make sure the backend's `CORS_ORIGIN` env var includes this app's deployed URL, or client-side calls
(repo sorting/pagination, the AI guide) will fail with a CORS error even though the initial page load
(server-side) works fine.
