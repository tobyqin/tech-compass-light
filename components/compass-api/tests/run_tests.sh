#!/bin/bash

# Add current directory to PYTHONPATH to ensure imports work correctly
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Parse arguments
TEST_MODULE=""
COVERAGE=false

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --module)
      TEST_MODULE="$2"
      shift 2
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./run_tests.sh [--module MODULE_NAME] [--coverage]"
      exit 1
      ;;
  esac
done

# If no module specified, run all tests
if [ -z "$TEST_MODULE" ]; then
  TEST_PATH="tests/"
  MODULE_NAME="all modules"
else
  TEST_PATH="tests/test_${TEST_MODULE}.py"
  MODULE_NAME="$TEST_MODULE module"
fi

# Run tests
echo "Running tests for $MODULE_NAME..."
if [ "$COVERAGE" = true ]; then
  if [ -z "$TEST_MODULE" ]; then
    # Run coverage for all modules
    python -m pytest $TEST_PATH -v --cov=app.routers
  else
    # Run coverage for specific module
    python -m pytest $TEST_PATH -v --cov=app.routers.$TEST_MODULE
  fi
else
  python -m pytest $TEST_PATH -v
fi 