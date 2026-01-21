#!/bin/bash
#
# Setup script for Git hooks
# Configures the repository to use hooks from .githooks directory

echo "Setting up Git hooks..."

# Configure Git to use .githooks directory
git config core.hooksPath .githooks

# Make all hooks executable
chmod +x .githooks/pre-commit
chmod +x .githooks/commit-msg

# Make all pre-commit.d scripts executable
if [ -d ".githooks/pre-commit.d" ]; then
	chmod +x .githooks/pre-commit.d/*.sh 2>/dev/null
fi

echo "Git hooks configured successfully!"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Runs pre-commit.d/ scripts in order"
echo "      01-version-sync.sh: Syncs package.json version from composer.json"
echo "      02-lint-staged.sh:  Runs lint-staged (PHP, JS, CSS linting)"
echo "  - commit-msg: Validates Conventional Commits format"
echo ""
echo "Your commits will now be validated automatically."
echo ""
echo "To bypass validation (not recommended):"
echo "  git commit --no-verify"
