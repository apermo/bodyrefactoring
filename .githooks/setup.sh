#!/bin/bash
#
# Setup script for Git hooks
# Configures the repository to use hooks from .githooks directory

echo "🔧 Setting up Git hooks..."

# Configure Git to use .githooks directory
git config core.hooksPath .githooks

# Make all hooks executable
chmod +x .githooks/*

echo "✅ Git hooks configured successfully!"
echo ""
echo "Hooks installed:"
echo "  - commit-msg: Validates Conventional Commits format"
echo ""
echo "Your commits will now be validated automatically."
echo ""
echo "To bypass validation (not recommended):"
echo "  git commit --no-verify"

