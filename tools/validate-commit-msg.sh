#!/bin/bash
# Commit message validator helper
# Can be used to check commit message format before committing

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

MESSAGE_FILE="$1"

if [ -z "$MESSAGE_FILE" ]; then
    echo -e "${RED}Usage: $0 <commit-message-file>${NC}"
    exit 1
fi

# Read commit message
COMMIT_MSG=$(cat "$MESSAGE_FILE")

# Get first line (subject)
SUBJECT=$(echo "$COMMIT_MSG" | head -n1)

# Get body (skip first blank line after subject)
BODY=$(echo "$COMMIT_MSG" | tail -n +3)

echo -e "${YELLOW}Validating commit message...${NC}\n"

# Check subject line length
SUBJECT_LENGTH=${#SUBJECT}
echo "Subject line: \"$SUBJECT\""
echo "Length: $SUBJECT_LENGTH characters"

if [ $SUBJECT_LENGTH -gt 72 ]; then
    echo -e "${RED}✗ FAIL: Subject line exceeds 72 characters (hard limit)${NC}"
    exit 1
elif [ $SUBJECT_LENGTH -gt 50 ]; then
    echo -e "${YELLOW}⚠ WARNING: Subject line exceeds 50 characters (recommended limit)${NC}"
    echo -e "${YELLOW}  Consider shortening to make it more readable${NC}"
fi

# Check conventional commit format
if ! echo "$SUBJECT" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf)(\(.+\))?!?: .+$"; then
    echo -e "${RED}✗ FAIL: Subject line doesn't follow conventional commit format${NC}"
    echo -e "${RED}  Expected: type(scope): subject${NC}"
    echo -e "${RED}  Types: feat, fix, docs, style, refactor, test, chore, perf${NC}"
    exit 1
fi

# Check subject line doesn't end with period
if echo "$SUBJECT" | grep -qE "\.$"; then
    echo -e "${RED}✗ FAIL: Subject line should not end with a period${NC}"
    exit 1
fi

# Check body line lengths (if body exists)
if [ -n "$BODY" ]; then
    LONGEST_LINE=0
    while IFS= read -r line; do
        LINE_LENGTH=${#line}
        if [ $LINE_LENGTH -gt $LONGEST_LINE ]; then
            LONGEST_LINE=$LINE_LENGTH
        fi
        if [ $LINE_LENGTH -gt 72 ]; then
            echo -e "${RED}✗ FAIL: Body line exceeds 72 characters: \"${line:0:50}...\"${NC}"
            echo -e "${RED}  Line length: $LINE_LENGTH characters${NC}"
            exit 1
        fi
    done <<< "$BODY"

    echo "Body: $(echo "$BODY" | wc -l) lines, longest: $LONGEST_LINE characters"
fi

echo -e "\n${GREEN}✓ PASS: Commit message is valid!${NC}"
exit 0

