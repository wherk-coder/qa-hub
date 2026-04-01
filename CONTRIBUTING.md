# Contributing to This Project

## PR Workflow (Required)

All changes must follow this workflow — no direct commits to `main`.

### 1. Branch from main

```bash
git checkout main && git pull origin main
git checkout -b feat/whe-XX-description
```

Use the naming convention `feat/whe-XX-description` where `XX` is the issue number.

### 2. Do your work

Make focused, minimal changes that address the issue. Run lint and tests locally before pushing.

### 3. Open a Pull Request

Push your branch and open a PR against `main`. Include:
- A clear title referencing the issue (e.g., `[WHE-42] Add user auth`)
- A description of what changed and why
- Link to the relevant issue

### 4. Review Process

PRs go through this review pipeline:

1. **CodeRabbit** auto-reviews on PR open (automated)
2. **Code Reviewer** reviews for architecture, logic, and security issues
3. **PR Closer** addresses review comments and pushes fixes
4. **QA Engineer** verifies functionality before merge approval

### 5. Merge

Only merge after **all reviews pass** and status checks are green. Use squash merge to keep history clean.

## Rules

- Never push directly to `main`
- Never force-push to `main`
- All PRs require at least 1 approving review
- All CI status checks must pass before merge
- Keep PRs focused — one issue per PR
