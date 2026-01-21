#!/bin/bash
# ESLint threshold check - compares against baseline, auto-updates when improved

set -e

BASELINE_FILE="eslint-baseline.json"

# Ensure baseline file exists
if [ ! -f "$BASELINE_FILE" ]; then
	echo "Error: $BASELINE_FILE not found. Run ESLint and create baseline first."
	exit 1
fi

# Run ESLint with JSON formatter (allow non-zero exit)
RESULT=$(npx eslint assets/js/ -f json 2>/dev/null || true)

# Count errors (severity 2) and warnings (severity 1) from JSON output
CURRENT_ERRORS=$(echo "$RESULT" | jq '[.[].messages[] | select(.severity == 2)] | length')
CURRENT_WARNINGS=$(echo "$RESULT" | jq '[.[].messages[] | select(.severity == 1)] | length')

# Read baseline
BASELINE_ERRORS=$(jq '.errors // 0' "$BASELINE_FILE")
BASELINE_WARNINGS=$(jq '.warnings // 0' "$BASELINE_FILE")

echo "ESLint: Errors $CURRENT_ERRORS/$BASELINE_ERRORS, Warnings $CURRENT_WARNINGS/$BASELINE_WARNINGS"

# Check for regression
if [ "$CURRENT_ERRORS" -gt "$BASELINE_ERRORS" ] || [ "$CURRENT_WARNINGS" -gt "$BASELINE_WARNINGS" ]; then
	echo "Linting regression detected!"
	echo "Run 'npm run lint:js' to see details."
	exit 1
fi

# Auto-update if improved
if [ "$CURRENT_ERRORS" -lt "$BASELINE_ERRORS" ] || [ "$CURRENT_WARNINGS" -lt "$BASELINE_WARNINGS" ]; then
	echo "Improved! Updating baseline."
	echo "{\"errors\": $CURRENT_ERRORS, \"warnings\": $CURRENT_WARNINGS}" > "$BASELINE_FILE"
fi

echo "ESLint threshold check passed"
