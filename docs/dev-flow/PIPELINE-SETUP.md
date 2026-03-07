# Autonomous Dev Pipeline — Setup Guide

One-time setup to enable the fully autonomous dev pipeline.

## GitHub Repo Settings

### 1. Enable auto-merge

**Settings > General > Pull Requests:**
- [x] Allow auto-merge

### 2. Branch protection (optional but recommended)

**Settings > Branches > Add rule for `main`:**
- [x] Require status checks to pass before merging
  - Add required checks: `frontend`, `control-plane`
- [x] Require review from Code Owners (uncheck for full automation, check for human-in-the-loop)

### 3. Allow Actions to merge

**Settings > Actions > General > Workflow permissions:**
- [x] Read and write permissions
- [x] Allow GitHub Actions to create and approve pull requests

### 4. Add LINEAR_API_KEY secret

1. Go to [Linear Settings > API](https://linear.app/settings/api)
2. Create a Personal API key
3. Go to **GitHub repo > Settings > Secrets and variables > Actions**
4. Add new secret: `LINEAR_API_KEY` = your Linear API key

## How It Works

```
You describe a feature
     |
     v
Product manager (Cursor chat) creates Linear ticket
  → delegate: Cursor, status: In Progress
     |
     v
Cursor Background Agent picks up the ticket
  → reads implement-ticket skill
  → implements, runs tests, creates PR
  → requests Copilot code review
  → marks ticket Done in Linear
  → sets next ticket delegate: Cursor
     |
     v
CI runs (frontend lint/typecheck/test + control-plane pytest)
     |
     v
Auto-merge (squash) when checks pass
     |
     v
next-ticket.yml Action (fallback):
  → marks ticket Done in Linear
  → finds next Backlog ticket
  → sets delegate: Cursor + status: In Progress
     |
     v
Next Cursor Background Agent picks up → loop
```

## Your Only Job

1. Open a Cursor chat
2. Describe what you want built
3. The pipeline handles the rest

## Troubleshooting

**Pipeline stalled (no new agent picking up)?**
- Check Linear: is the next ticket set to "In Progress" with Cursor as delegate?
- If not: manually set delegate to Cursor in Linear UI

**CI failing?**
- Check the PR's GitHub Actions tab
- Agent may have introduced a lint/type error
- Fix: create a bug ticket describing the CI failure, assign to Cursor

**Wrong implementation?**
- Comment on the Linear ticket or PR with feedback
- Create a new ticket for the correction
