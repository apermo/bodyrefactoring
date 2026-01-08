# Tools

Helper scripts and utilities for Body Refactoring development.

## Git Commit Template

A commit message template is configured in `.gitmessage` to guide proper formatting.

**To use in git commands:**
```bash
# Template is automatically loaded when you run:
git commit
```

The template shows:
- Character count guides (50 and 72 character markers)
- Available commit types
- Scope examples
- Subject line guidelines
- Body wrapping reminder

**Configuration:**
```bash
# Already configured for this repository
git config commit.template .gitmessage
```

## Git Hooks (Automatic Validation)

The repository uses git hooks to automatically validate commit messages.

**Setup (one-time):**
```bash
./.githooks/setup.sh
```

**What the hooks check:**
- ✅ Subject line ≤ 72 characters (hard limit)
- ✅ Conventional commit format: `type(scope): subject`
- ✅ Valid type: feat, fix, docs, style, refactor, test, chore, perf
- ✅ No period at end of subject line
- ✅ Body lines ≤ 72 characters

**Bypass (only when necessary):**
```bash
git commit --no-verify
```

## Tips for Writing Good Commit Messages

### Subject Line (First Line)
- **Keep it under 50 characters** (hard limit: 72)
- Use imperative mood: "add" not "added" or "adds"
- No period at the end
- Be specific but concise

### Examples of Good Subjects
```
feat(timer): add pause functionality           (37 chars) ✅
fix(auth): resolve login timeout issue         (38 chars) ✅
docs: update installation instructions         (39 chars) ✅
refactor(api): simplify error handling         (39 chars) ✅
```

### Examples of Bad Subjects
```
feat(schedule-editor): add comprehensive validation and error handling support
(78 chars - TOO LONG!) ❌

Fixed a bug in the timer that was causing issues
(49 chars but not conventional format) ❌

feat(timer): adds pause functionality.
(Use imperative mood + no period) ❌
```

### If Your Message is Too Long

**Option 1: Remove scope**
```
Before: feat(schedule-editor): add validation support (53 chars)
After:  feat: add schedule editor validation (39 chars) ✅
```

**Option 2: Abbreviate**
```
Before: feat(authentication): add user login (43 chars)
After:  feat(auth): add user login (28 chars) ✅
```

**Option 3: Shorten subject**
```
Before: feat(timer): add pause and resume functionality (54 chars)
After:  feat(timer): add pause/resume (31 chars) ✅
```

**Option 4: Move details to body**
```
feat(timer): add pause feature

Includes pause and resume functionality with state persistence.
```

### Body Guidelines
- Separate from subject with a blank line
- Wrap at 72 characters per line
- Explain *what* and *why*, not *how*
- Reference issues/PRs when relevant

### AI-Generated Commit Messages
When using "Generate Commit Message" features (Copilot, etc.):

1. **Check the character count** before accepting
2. If > 50 chars, manually edit to shorten
3. Remove scope if needed to fit under limit
4. Focus on clear, concise subject line

**Common AI mistakes:**
- ❌ Too descriptive: "add comprehensive validation with error handling"
- ✅ Better: "add validation"
- ❌ Too long with scope: "feat(schedule-editor-component): ..."
- ✅ Better: "feat(editor): ..." or "feat: ..."

## Debugging Commit Message Issues

If git hook rejects your commit:

```bash
# Check what git sees
git log --format=%B -n 1 HEAD

# Check character count
echo "feat(scope): your subject line" | wc -c

# View the git hook that's validating
cat .git/hooks/commit-msg

# Re-run hook setup if needed
./.githooks/setup.sh
```

## Related Files

- `.gitmessage` - Git commit message template (visual guide)
- `.cursorrules` - AI assistant guidelines (includes commit standards)
- `.githooks/` - Git hooks for automatic validation
- `.github/workflows/validate-conventional-commits.yml` - CI validation

