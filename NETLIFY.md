# Netlify Setup - Quick Start

## What You Need to Do

1. **Go to Netlify**: https://app.netlify.com/start
2. **Click "Import from Git"**
3. **Select GitHub** → `apermo/bodyrefactoring`
4. **Deploy settings are auto-detected** from `netlify.toml`:
   - Build command: `php build.php`
   - Publish directory: `dist`
5. **Click "Deploy site"**

That's it! Every PR will now automatically get a preview URL.

## What Happens Next

- Every PR gets a preview: `https://deploy-preview-{number}--bodyrefactoring.netlify.app`
- Netlify posts the URL in PR comments
- Updates on every push
- Auto-cleanup when PR closes

## Testing This Setup

Once connected, create a test PR to verify it works:
1. Create a new branch
2. Make a small change
3. Open PR
4. Wait ~30 seconds
5. Preview URL appears in PR comments

## Full Documentation

See [docs/netlify-setup.md](docs/netlify-setup.md) for complete details.

## Questions?

- Build script: `build.php` (converts PHP → HTML)
- Configuration: `netlify.toml`
- Output: `dist/` directory (git-ignored)

