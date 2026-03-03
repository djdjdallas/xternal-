# Twitter Poster

A simple internal tool for posting tweets from a single Twitter/X account. Built for solo founders who want a clean dashboard to compose, schedule, and track tweets.

## Features

- **Post tweets immediately** from a simple compose UI
- **Schedule tweets** for future posting with a datetime picker
- **Tweet queue** — view and manage scheduled tweets
- **Post history** — see recent posts with status badges (posted/failed)
- **Cookie caching** — authenticates once and caches session cookies in Supabase so you don't re-login on every request
- **Vercel Cron scheduling** — a Vercel Cron Job checks for due tweets every minute and posts them automatically
- **Basic auth** — dashboard is protected with username/password when deployed

## Tech Stack

- Next.js 15 (JavaScript, App Router)
- Tailwind CSS + shadcn/ui components
- agent-twitter-client (unofficial cookie-based Twitter API)
- Vercel Cron Jobs for scheduling
- Supabase for data storage

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd twitter-poster
npm install
```

### 2. Set up Supabase

Create a new Supabase project, then run the migration to create the required tables. You can do this via the Supabase SQL editor — copy and paste the contents of:

```
supabase/migrations/001_twitter_poster.sql
```

This creates two tables:
- `twitter_sessions` — stores cached Twitter session cookies
- `tweets` — stores the tweet queue and post history

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `TWITTER_USERNAME` | Your Twitter/X username (without @) |
| `TWITTER_PASSWORD` | Your Twitter/X password |
| `TWITTER_EMAIL` | The email associated with your Twitter account |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (used server-side) |
| `CRON_SECRET` | Random string used to authenticate Vercel Cron requests |
| `ADMIN_USER` | Username for dashboard Basic Auth |
| `ADMIN_PASSWORD` | Password for dashboard Basic Auth |

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000 to see the dashboard.

## How Cookie Caching Works

On first run, the app logs into Twitter using `agent-twitter-client` with your username/password/email. The session cookies are saved to the `twitter_sessions` table in Supabase.

On subsequent requests, the app loads the cached cookies instead of logging in again. This avoids rate limits and repeated auth flows.

### If login breaks

If your cookies expire or Twitter invalidates the session, hit the refresh endpoint:

```bash
curl -X POST http://localhost:3000/api/twitter/refresh-session
```

This forces a fresh login and saves new cookies to Supabase.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/twitter/post` | Post a tweet immediately or schedule it |
| GET | `/api/twitter/queue` | Get all queued tweets |
| DELETE | `/api/twitter/queue/[id]` | Delete a queued tweet |
| GET | `/api/twitter/history` | Get last 50 posted/failed tweets |
| POST | `/api/twitter/refresh-session` | Force re-authentication |
| GET | `/api/cron/process-queue` | Vercel Cron endpoint (requires CRON_SECRET) |

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the repo into [Vercel](https://vercel.com) and add all env vars from `.env.example` in the project settings.
3. Set `CRON_SECRET` to any random string (e.g. `openssl rand -hex 32`). Vercel automatically sends this as an `Authorization: Bearer <CRON_SECRET>` header when invoking the cron route.
4. Set `ADMIN_USER` and `ADMIN_PASSWORD` to your preferred credentials. The dashboard will prompt for these via Basic Auth.
5. Deploy. Vercel will read `vercel.json` and register the cron job at `/api/cron/process-queue` to run every minute.

**Notes:**
- The Vercel Hobby plan supports a minimum 1-minute cron interval, which is sufficient for this tool.
- `node-cron` has been removed — scheduling is handled entirely by Vercel Cron Jobs. There is no persistent background process.
- The cron route validates the `CRON_SECRET` header and returns 401 if it doesn't match, so it cannot be triggered by external callers.

## Important Notes

- **agent-twitter-client uses unofficial Twitter APIs.** This means it relies on internal endpoints and cookie-based authentication rather than the official Twitter API v2. Use at your own risk — this could break if Twitter changes their internal APIs, and may violate Twitter's Terms of Service.
- The dashboard is protected with Basic Auth when deployed. For local development, set `ADMIN_USER` and `ADMIN_PASSWORD` in `.env.local`.
