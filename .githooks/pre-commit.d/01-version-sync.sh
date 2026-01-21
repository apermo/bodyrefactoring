#!/bin/bash
#
# Sync package.json version from composer.json
# composer.json is the authoritative source for version numbers
#
# This script runs before linting so synced files get linted

# Color codes for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
COMPOSER_JSON="$REPO_ROOT/composer.json"
PACKAGE_JSON="$REPO_ROOT/package.json"

# Check if both files exist
if [ ! -f "$COMPOSER_JSON" ]; then
	echo -e "${YELLOW}composer.json not found, skipping version sync${NC}"
	exit 0
fi

if [ ! -f "$PACKAGE_JSON" ]; then
	echo -e "${YELLOW}package.json not found, skipping version sync${NC}"
	exit 0
fi

# Extract versions using grep and sed (no external dependencies)
COMPOSER_VERSION=$(grep -o '"version": *"[^"]*"' "$COMPOSER_JSON" | head -1 | sed 's/.*: *"\([^"]*\)"/\1/')
PACKAGE_VERSION=$(grep -o '"version": *"[^"]*"' "$PACKAGE_JSON" | head -1 | sed 's/.*: *"\([^"]*\)"/\1/')

# Check if versions were extracted successfully
if [ -z "$COMPOSER_VERSION" ]; then
	echo -e "${YELLOW}Could not read version from composer.json, skipping version sync${NC}"
	exit 0
fi

if [ -z "$PACKAGE_VERSION" ]; then
	echo -e "${YELLOW}Could not read version from package.json, skipping version sync${NC}"
	exit 0
fi

# Compare versions
if [ "$COMPOSER_VERSION" != "$PACKAGE_VERSION" ]; then
	echo "Syncing package.json version: $PACKAGE_VERSION -> $COMPOSER_VERSION"

	# Update package.json version using sed
	# This handles the "version": "x.y.z" pattern
	sed -i '' "s/\"version\": *\"$PACKAGE_VERSION\"/\"version\": \"$COMPOSER_VERSION\"/" "$PACKAGE_JSON"

	# Stage the updated package.json
	git add "$PACKAGE_JSON"

	echo -e "${GREEN}package.json version synced and staged${NC}"
else
	echo -e "${GREEN}Versions in sync: $COMPOSER_VERSION${NC}"
fi

exit 0
