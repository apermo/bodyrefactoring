#!/bin/bash
# Stylelint threshold check - compares against baseline, auto-updates when improved

set -e

BASELINE_FILE="stylelint-baseline.json"

# Ensure baseline file exists
if [ ! -f "$BASELINE_FILE" ]; then
	echo "Error: $BASELINE_FILE not found. Run Stylelint and create baseline first."
	exit 1
fi

# Run Stylelint with JSON formatter (allow non-zero exit, merge stderr to stdout)
RESULT=$(npx stylelint "assets/css/**/*.css" -f json 2>&1 || true)

# Count errors and warnings from JSON output
CURRENT_ERRORS=$(echo "$RESULT" | jq '[.[].warnings[] | select(.severity == "error")] | length')
CURRENT_WARNINGS=$(echo "$RESULT" | jq '[.[].warnings[] | select(.severity == "warning")] | length')

# Read baseline
BASELINE_ERRORS=$(jq '.errors // 0' "$BASELINE_FILE")
BASELINE_WARNINGS=$(jq '.warnings // 0' "$BASELINE_FILE")

echo "Stylelint: Errors $CURRENT_ERRORS/$BASELINE_ERRORS, Warnings $CURRENT_WARNINGS/$BASELINE_WARNINGS"

# Check for regression
if [ "$CURRENT_ERRORS" -gt "$BASELINE_ERRORS" ] || [ "$CURRENT_WARNINGS" -gt "$BASELINE_WARNINGS" ]; then
	echo "Linting regression detected!"
	echo "Run 'npm run lint:css' to see details."
	exit 1
fi

# Auto-update if improved
if [ "$CURRENT_ERRORS" -lt "$BASELINE_ERRORS" ] || [ "$CURRENT_WARNINGS" -lt "$BASELINE_WARNINGS" ]; then
	echo "Improved! Updating baseline."
	echo "{\"errors\": $CURRENT_ERRORS, \"warnings\": $CURRENT_WARNINGS}" > "$BASELINE_FILE"
fi

echo "Stylelint threshold check passed"
