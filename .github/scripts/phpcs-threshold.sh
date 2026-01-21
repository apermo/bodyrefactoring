#!/bin/bash
# PHPCS threshold check - compares against baseline, auto-updates when improved

set -e

BASELINE_FILE="phpcs-baseline.json"

# Ensure baseline file exists
if [ ! -f "$BASELINE_FILE" ]; then
	echo "Error: $BASELINE_FILE not found. Run PHPCS and create baseline first."
	exit 1
fi

# Run PHPCS and extract totals (allow non-zero exit, -q for quiet mode)
RESULT=$(vendor/bin/phpcs --report=json -q 2>/dev/null || true)
CURRENT_ERRORS=$(echo "$RESULT" | jq '.totals.errors // 0')
CURRENT_WARNINGS=$(echo "$RESULT" | jq '.totals.warnings // 0')

# Read baseline
BASELINE_ERRORS=$(jq '.errors // 0' "$BASELINE_FILE")
BASELINE_WARNINGS=$(jq '.warnings // 0' "$BASELINE_FILE")

echo "PHPCS: Errors $CURRENT_ERRORS/$BASELINE_ERRORS, Warnings $CURRENT_WARNINGS/$BASELINE_WARNINGS"

# Check for regression
if [ "$CURRENT_ERRORS" -gt "$BASELINE_ERRORS" ] || [ "$CURRENT_WARNINGS" -gt "$BASELINE_WARNINGS" ]; then
	echo "Linting regression detected!"
	echo "Run 'npm run lint:php' to see details."
	exit 1
fi

# Auto-update if improved
if [ "$CURRENT_ERRORS" -lt "$BASELINE_ERRORS" ] || [ "$CURRENT_WARNINGS" -lt "$BASELINE_WARNINGS" ]; then
	echo "Improved! Updating baseline."
	echo "{\"errors\": $CURRENT_ERRORS, \"warnings\": $CURRENT_WARNINGS}" > "$BASELINE_FILE"
fi

echo "PHPCS threshold check passed"
