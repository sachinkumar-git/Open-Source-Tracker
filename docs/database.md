# Database

Run this in the Supabase SQL editor.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  github_id text unique not null,
  username text not null,
  email text,
  avatar_url text,
  github_access_token text
);

create table repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  repo_name text not null,
  repo_url text,
  language text,
  status text,
  notes text
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  repo_name text,
  type text,            -- commit | pull_request | issue
  date timestamp,
  message text,
  url text,
  unique (user_id, type, url)   -- conflict key for upserts; must match the onConflict used in the sync code
);

create table user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  commits int default 0,
  pull_requests int default 0,
  issues int default 0,
  last_synced timestamp
);
```
