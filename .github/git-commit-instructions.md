# Git Commit Instructions

Instructions for GitHub Copilot when generating commit messages and PR descriptions.

## Commit Message Format

Use Conventional Commits format:

```
<type>(<scope>): <subject>

<body>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependencies, build changes
- `perf` - Performance improvement

### Character Limits (Hard Limits)

- **Subject line**: 50 characters maximum
- **Body lines**: 72 characters maximum per line

### Rules

1. **Use imperative mood** - "Add feature" not "Added feature"
2. **Write in English** - All commit messages must be in English

### Examples

```
feat(timer): add pause functionality

Implement pause/resume for workout timer to allow
users to take breaks without losing progress.
```

```
fix(schedule): correct date parsing for DST

The schedule loader failed to account for daylight
saving time transitions, causing incorrect dates.
```

```
docs(changelog): prepare v14.5.0 section
```

```
chore: bump version to 14.5.0
```
