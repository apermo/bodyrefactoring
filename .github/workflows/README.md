# GitHub Actions Workflows

This directory contains automated workflows for the Body Refactoring project.

## Workflows

### PR Validation (`pr-validation.yml`)

Automatically validates pull requests to ensure quality and consistency.

**Triggered on:** Pull request open, sync, reopen, or edit to `main` branch

**Jobs:**

1. **Check Version Bump**
   - Compares `composer.json` version between base and PR branch
   - Ensures version is incremented
   - ❌ Fails if version not bumped
   - ✅ Outputs new version number for subsequent jobs

2. **Check CHANGELOG Entry**
   - Verifies that `CHANGELOG.md` contains entry for new version
   - ❌ Fails if entry missing
   - ✅ Passes if version entry found

3. **Validate Training Schedules**
   - Runs `trainings/validate-schedule.php` on all schedule files
   - Checks JSON structure and schema compliance
   - ❌ Fails if any schedule invalid
   - ✅ Passes if all schedules valid

4. **Update PR Checkboxes**
   - Automatically checks off completed items in PR description:
     - `[x] I have updated the version number in composer.json`
     - `[x] I have updated the CHANGELOG.md`
     - `[x] I have validated schedule JSON files`

5. **Post Validation Results**
   - Creates/updates summary comment on PR
   - Shows status of all validation checks
   - Provides overall pass/fail status

### PR Enforcement (`pr-enforce.yml`)

Prevents merging of PRs that don't meet requirements.

**Triggered on:** Pull request open, sync, or reopen to `main` branch

**Jobs:**

1. **Enforce PR Requirements**
   - Creates commit status "PR Requirements"
   - Waits for validation jobs to complete
   - Sets status to:
     - ✅ Success if all validations pass
     - ❌ Failure if any validation fails
   - Blocks merge if status is failure (when branch protection enabled)

## Setup

### Enable Branch Protection

To enforce these requirements, enable branch protection on the `main` branch:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Add required status checks:
   - `PR Requirements`
   - `Check Version Bump`
   - `Check CHANGELOG Entry`
   - `Validate Training Schedules`

### Permissions

The workflows require the following permissions (already configured):
- `contents: read` - Read repository files
- `pull-requests: write` - Update PR description and comments
- `checks: write` - Create check runs
- `statuses: write` - Create commit statuses

## Usage

The workflows run automatically when a PR is created or updated. No manual action required.

**What happens:**

1. **PR created/updated** → Workflows triggered
2. **Validations run** → Version, CHANGELOG, schedules checked
3. **Checkboxes updated** → Completed items automatically checked
4. **Comment posted** → Summary of results added to PR
5. **Status set** → Merge blocked if validations fail

## Validation Rules

### Version Bump
- Version in `composer.json` must be different from base branch
- Semantic versioning recommended (e.g., 10.0.1 → 10.0.2)

### CHANGELOG Entry
- `CHANGELOG.md` must contain `[X.Y.Z]` matching new version
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Include date and change categories (Added, Changed, Fixed, etc.)

### Schedule Validation
- All JSON files in `trainings/` must pass validation
- Run locally: `cd trainings && php validate-schedule.php`
- See [Schedule Validation Guide](../docs/schedule-validation.md)

## Troubleshooting

### Version check fails
```bash
# Bump version in composer.json
{
  "version": "10.0.2"  // Increment this
}
```

### CHANGELOG check fails
```markdown
# Add entry to CHANGELOG.md
## [10.0.2] - 2026-01-04

### Fixed
- Bug fix description
```

### Schedule validation fails
```bash
# Run validator locally to see errors
cd trainings
php validate-schedule.php schedule-2026-01-04.json

# Fix JSON structure/schema issues
```

### Checkboxes not updating
- Ensure PR description contains exact checkbox text from template
- Workflow needs `pull-requests: write` permission
- Check workflow logs for errors

### Merge blocked
- All validations must pass
- Check "PR Requirements" status in PR
- Review failed checks and fix issues
- Push fixes to trigger re-validation

## Testing Workflows

To test workflows without creating a real PR:

1. Create a test branch
2. Make changes (version bump, CHANGELOG, etc.)
3. Create draft PR to `main`
4. Check workflow results
5. Close/delete PR when done

## Maintenance

### Updating Workflows

When modifying workflows:
1. Test in a fork or draft PR first
2. Validate YAML syntax
3. Check permissions are correct
4. Update this README if behavior changes

### Adding New Validations

To add new automated checks:
1. Add job to `pr-validation.yml`
2. Update `pr-enforce.yml` to check new job
3. Add checkbox to PR template
4. Update checkbox automation in `update-pr-checkboxes` job
5. Document in this README

