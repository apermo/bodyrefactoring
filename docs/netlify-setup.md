# Netlify PR Preview Setup Guide

## Overview

This repository uses Netlify to automatically create preview environments for every pull request. This allows you to test changes in a live environment before merging to production.

## What Was Implemented

### Files Created

1. **`netlify.toml`** - Netlify configuration
   - Build command: `php build.php`
   - Publish directory: `dist`
   - Redirects configuration

2. **`build.php`** - Build script
   - Converts PHP to static HTML
   - Processes cache-busting timestamps
   - Copies assets and training schedules
   - Removes consent check (not needed for previews)

3. **`.gitignore`** additions
   - `dist/` - Build output directory
   - `.netlify/` - Netlify cache directory

## How It Works

### Build Process

1. **PR Created/Updated** → Netlify webhook triggered
2. **Build starts** → Runs `php build.php`
3. **PHP → HTML conversion**:
   - Removes consent check (testing only)
   - Injects version from `composer.json`
   - Processes asset paths with cache busting
   - Copies all assets and schedules
4. **Deploy** → Preview URL created
5. **Comment** → Netlify posts URL in PR

### Build Script Details

The `build.php` script:
- Reads `index.php`
- Removes PHP consent logic (not needed for previews)
- Replaces `<?php echo APP_VERSION; ?>` with actual version
- Replaces `asset()` calls with timestamped URLs
- Outputs clean HTML to `dist/index.html`
- Copies `assets/` directory (all files)
- Copies `trainings/` directory (excludes PHP files, schema, and templates)
- Generates `trainings/schedules.json` (replaces `trainings/index.php`)
- Converts `schedule-editor.php` to `schedule-editor.html`

**Files excluded from trainings/:**
- `*.php` (index.php, validate-schedule.php)
- `schema-*.json` (validation schemas)
- `template-*.json` (templates)

**JavaScript Compatibility:**
The app automatically works on both platforms using directory paths:
1. Fetches `trainings/` (directory path without file)
2. **On Plesk (production)**: Apache `.htaccess` serves `index.php` as directory index
3. **On Netlify (preview)**: `netlify.toml` redirects to `schedules.json`
4. No code changes needed - works on both platforms transparently

**Netlify Redirects:**
```toml
# Serve schedules.json when accessing /trainings/ directory
[[redirects]]
  from = "/trainings/"
  to = "/trainings/schedules.json"
  status = 200

# Also handle direct index.php requests
[[redirects]]
  from = "/trainings/index.php"
  to = "/trainings/schedules.json"
  status = 200
```

**Build time:** ~30 seconds

## Setup Instructions

### One-Time Setup (Already Done)

The repository is already configured, but if you need to set it up again:

1. **Sign up for Netlify** (free): https://app.netlify.com/signup
   - Use GitHub account for easy integration

2. **Connect Repository**:
   - Go to https://app.netlify.com/start
   - Click "Import from Git"
   - Select "GitHub"
   - Choose `apermo/bodyrefactoring`
   - Netlify auto-detects `netlify.toml` settings
   - Click "Deploy site"

3. **Configure Site Settings** (optional):
   - Site name: `bodyrefactoring` (or custom)
   - Domain: Auto-generated or custom

4. **Done!** No other configuration needed.

### PR Preview Workflow

1. **Create a PR** on GitHub
2. **Netlify builds automatically** (~30 seconds)
3. **Preview URL appears** in PR comments:
   ```
   https://deploy-preview-123--bodyrefactoring.netlify.app
   ```
4. **Test your changes** in the preview
5. **Push updates** → New preview deployed automatically
6. **Merge PR** → Preview auto-deleted

## Preview URL Format

- **PR Previews**: `https://deploy-preview-{PR#}--bodyrefactoring.netlify.app`
- **Branch Previews**: `https://{branch}--bodyrefactoring.netlify.app`
- **Production**: `https://bodyrefactoring.netlify.app` (if configured)

**Note:** Production remains on Plesk (`https://prv.chrdm.de/`), not Netlify.

## What's Included in Previews

✅ **Included:**
- All HTML/CSS/JS
- Training schedules (JSON files)
- Assets (images, fonts via CDN)
- Schedule editor
- Full app functionality (LocalStorage-based)

❌ **Not Included:**
- PHP runtime (converted to static HTML)
- Consent check (skipped for testing)
- Server-side logic (not needed - app is client-side)

## Differences from Production

| Feature | Production (Plesk) | PR Preview (Netlify) |
|---------|-------------------|---------------------|
| **PHP Runtime** | ✅ Yes | ❌ No (pre-rendered) |
| **Consent Check** | ✅ Yes | ❌ Skipped |
| **Cache Busting** | ✅ Dynamic (filemtime) | ✅ Static (build time) |
| **Schedule Loading** | ✅ PHP serves JSON | ✅ Static files |
| **LocalStorage** | ✅ Works | ✅ Works |
| **Service Workers** | ✅ Works | ✅ Works |
| **Domain** | prv.chrdm.de | netlify.app |

**Important:** Previews are for testing only. They work identically to production for app functionality since the app is primarily client-side (LocalStorage).

## Testing Build Locally

Test the build process before pushing:

```bash
# Run build script
php build.php

# Check output
ls -la dist/

# View generated HTML
open dist/index.html
# or
cat dist/index.html | head -50

# Clean up
rm -rf dist/
```

## Troubleshooting

### Build Fails

**Check Netlify build logs:**
1. Go to Netlify dashboard
2. Click on deploy that failed
3. View build logs

**Common issues:**
- PHP syntax error in `build.php`
- Missing `composer.json`
- File permissions

**Solution:** Test build locally with `php build.php`

### Preview Doesn't Load

**Possible causes:**
1. Assets not copied (check `dist/assets/`)
2. JavaScript errors (check browser console)
3. Incorrect paths in HTML

**Solution:** Check `dist/index.html` and verify all paths are relative

### Changes Not Showing

**Causes:**
- Browser cache
- Old deployment still loading

**Solution:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check Netlify dashboard for latest deploy time
- Verify commit hash matches

## Netlify Free Tier Limits

Your usage vs limits:

| Metric | Free Limit | Your Usage (estimated) | % Used |
|--------|------------|----------------------|--------|
| **Bandwidth** | 100 GB/month | ~100-300 MB/month | 0.1-0.3% |
| **Build Minutes** | 300 min/month | ~30-50 min/month | 10-17% |
| **Sites** | Unlimited | 1 | ✅ |
| **Team Members** | 1 | 1 | ✅ |

**Conclusion:** Free tier is more than sufficient. Would need 142,857 page loads to hit bandwidth limit.

## Disabling PR Previews

If you ever want to disable automatic previews:

1. Go to Netlify dashboard
2. Site settings → Build & deploy
3. Deploy contexts → Edit settings
4. Uncheck "Deploy previews"

Or simply delete the Netlify site entirely.

## Further Enhancements (Optional)

Future improvements you could add:

1. **Visual regression testing** - Compare screenshots between PRs
2. **Lighthouse CI** - Automatic performance audits
3. **Custom domains** - Use your own domain for previews
4. **Password protection** - Protect previews with password
5. **Deploy notifications** - Slack/Discord when deploy completes

## Resources

- **Netlify Docs**: https://docs.netlify.com/
- **Deploy Contexts**: https://docs.netlify.com/site-deploys/overview/#deploy-contexts
- **Build Configuration**: https://docs.netlify.com/configure-builds/overview/
- **Your Netlify Dashboard**: https://app.netlify.com/

## Credits

Setup completed: January 8, 2026  
Implementation: v14.1.0  
Build time: ~30 seconds per deployment  
Cost: $0/month (free tier)

