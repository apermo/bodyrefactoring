#!/bin/bash
#
# Test GitHub Actions workflows locally using act
# Falls back gracefully if act is not installed

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if act is installed
if ! command -v act >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  act is not installed${NC}"
    echo ""
    echo "act allows you to test GitHub Actions workflows locally."
    echo ""
    echo "Install act:"
    echo "  macOS:    brew install act"
    echo "  Linux:    See https://github.com/nektos/act#installation"
    echo ""
    echo "Without act, workflows will be tested when pushed to GitHub."
    exit 0
fi

echo -e "${GREEN}✓ act is available${NC}"
echo ""

# Show available workflows
echo "📋 Available workflows:"
act -l
echo ""

# Show usage
echo "Usage examples:"
echo ""
echo "  # Test all pull_request workflows (dry run)"
echo "  act pull_request --dryrun"
echo ""
echo "  # Test specific workflow (dry run)"
echo "  act pull_request -W .github/workflows/validate-conventional-commits.yml --dryrun"
echo ""
echo "  # Actually run workflow locally"
echo "  act pull_request -W .github/workflows/validate-conventional-commits.yml"
echo ""
echo "  # Test push workflows"
echo "  act push --dryrun"
echo ""

# Ask if user wants to run a test
read -p "Test conventional commits workflow now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}🧪 Testing conventional commits workflow (dry run)...${NC}"
    echo ""
    act pull_request -W .github/workflows/validate-conventional-commits.yml --dryrun

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Workflow validation successful!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Workflow validation failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✓ Done${NC}"

