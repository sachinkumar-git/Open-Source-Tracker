# Architecture

See the high-level diagram in the [README](../README.md#-architecture).

## GitHub sync flow

```mermaid
sequenceDiagram
    participant User
    participant React App
    participant Express Server
    participant GitHub API
    participant Supabase DB

    User->>React App: Clicks "Sync GitHub"
    React App->>Express Server: POST /dashboard/sync (JWT)
    Express Server->>Supabase DB: Retrieve user's GitHub token
    Express Server->>GitHub API: Fetch commits, PRs, issues
    GitHub API-->>Express Server: Activity JSON
    Express Server->>Supabase DB: Upsert activity logs and stats
    Express Server-->>React App: Sync complete
    React App->>Express Server: GET /dashboard (JWT)
    Express Server->>Supabase DB: Fetch latest stats
    Supabase DB-->>Express Server: Analytics data
    Express Server-->>React App: Render heatmap and charts
```

## Notes

- Sync is triggered by the user, not by a background job.
- The dashboard reads only from Supabase. GitHub is called during sync, repo analysis, and code push.
