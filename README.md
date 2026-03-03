# Twitter Poster

A simple internal tool for posting tweets from a single Twitter/X account. Built for solo founders who want a clean dashboard to compose, schedule, and track tweets.

## Features

- **Post tweets immediately** from a simple compose UI
- **Schedule tweets** for future posting with a datetime picker
- **Tweet queue** — view and manage scheduled tweets
- **Post history** — see recent posts with status badges (posted/failed)
- **Cookie caching** — authenticates once and caches session cookies in Supabase so you don't re-login on every request
- **Background scheduler** — a cron job checks for due tweets every minute and posts them automatically

## Tech Stack

- Next.js 15 (JavaScript, App Router)
- Tailwind CSS + shadcn/ui components
- agent-twitter-client (unofficial cookie-based Twitter API)
- node-cron for scheduling
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

## Important Notes

- **agent-twitter-client uses unofficial Twitter APIs.** This means it relies on internal endpoints and cookie-based authentication rather than the official Twitter API v2. Use at your own risk — this could break if Twitter changes their internal APIs, and may violate Twitter's Terms of Service.
- **This tool is designed for local use only.** There is no authentication on the UI. Do not deploy this publicly without adding auth.
- The scheduler runs via Next.js instrumentation and only activates at runtime (not during `next build`).
