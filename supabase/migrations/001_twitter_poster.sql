-- Twitter Poster schema

create table if not exists twitter_sessions (
  id uuid primary key default gen_random_uuid(),
  cookies jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists tweets (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) <= 280),
  status text not null default 'queued' check (status in ('queued', 'posted', 'failed')),
  scheduled_for timestamptz,
  posted_at timestamptz,
  error text,
  created_at timestamptz default now()
);

-- Index for scheduler queries
create index if not exists idx_tweets_queued_scheduled
  on tweets (scheduled_for)
  where status = 'queued';
