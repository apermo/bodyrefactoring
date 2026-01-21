#!/bin/bash
#
# Git pre-commit hook to run lint-staged via DDEV
# Validates code quality before allowing commits
#
# This hook runs:
# - PHPCS for PHP files
# - ESLint for JavaScript files
# - Stylelint for CSS files
#
# Locally: Requires DDEV to be installed and running.
# GitHub Actions: Runs directly without DDEV.

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "Running lint-staged..."

# Determine execution mode: GitHub Actions runs directly, local requires DDEV
if [ "$GITHUB_ACTIONS" = "true" ]; then
	USE_DDEV=false
else
	# Check if DDEV is available
	if ! command -v ddev &> /dev/null; then
		echo -e "${YELLOW}DDEV not installed. Skipping linting.${NC}"
		echo "   Install DDEV: https://ddev.readthedocs.io/en/stable/"
		exit 0
	fi

	# Check if DDEV is running
	if ! ddev describe &> /dev/null; then
		echo -e "${YELLOW}DDEV not running. Skipping linting.${NC}"
		echo "   Start DDEV: ddev start"
		exit 0
	fi

	USE_DDEV=true
fi

# Check if node_modules exists
if [ ! -d "$REPO_ROOT/node_modules" ]; then
	echo -e "${YELLOW}node_modules not found. Skipping JavaScript and CSS linting.${NC}"
	if [ "$USE_DDEV" = true ]; then
		echo "   Run 'ddev npm install' to enable full linting."
	else
		echo "   Run 'npm install' to enable full linting."
	fi
	echo ""
fi

# Check if vendor exists (for PHPCS)
if [ ! -d "$REPO_ROOT/vendor" ]; then
	echo -e "${YELLOW}vendor not found. Skipping PHP linting.${NC}"
	if [ "$USE_DDEV" = true ]; then
		echo "   Run 'ddev composer install' to enable PHP linting."
	else
		echo "   Run 'composer install' to enable PHP linting."
	fi
	echo ""
fi

# Run lint-staged
if [ -f "$REPO_ROOT/node_modules/.bin/lint-staged" ]; then
	if [ "$USE_DDEV" = true ]; then
		cd "$REPO_ROOT" && ddev exec npx lint-staged
	else
		cd "$REPO_ROOT" && npx lint-staged
	fi
	LINT_STATUS=$?

	if [ $LINT_STATUS -ne 0 ]; then
		echo ""
		echo -e "${RED}Linting failed!${NC}"
		echo "   Please fix the issues above before committing."
		echo ""
		echo "   To auto-fix issues, run:"
		if [ "$USE_DDEV" = true ]; then
			echo "     ddev npm run lint:fix"
		else
			echo "     npm run lint:fix"
		fi
		echo ""
		echo "   To bypass linting (not recommended):"
		echo "     git commit --no-verify"
		exit 1
	fi

	echo -e "${GREEN}Linting passed${NC}"
else
	echo -e "${YELLOW}lint-staged not installed. Skipping pre-commit linting.${NC}"
	if [ "$USE_DDEV" = true ]; then
		echo "   Run 'ddev npm install' to enable linting."
	else
		echo "   Run 'npm install' to enable linting."
	fi
fi

exit 0
