# Code Coverage Guide

This document explains how to collect and analyze code coverage across all testing strategies in the Payload monorepo.

## Overview

Payload uses multiple testing strategies:

- **Unit tests** - Pure function testing in `packages/**/*.spec.ts`
- **Integration tests** - Full Payload instance testing in `test/**/*int.spec.ts`
- **E2E tests** - Browser-based testing in `test/**/*e2e.spec.ts` (via Playwright)

The coverage system collects coverage from each strategy and merges them into a single cumulative report.

## Quick Start

### Basic Coverage (Unit + Integration with default DB)

```bash
pnpm test:coverage
```

This runs:

1. Unit tests with coverage
2. Integration tests with coverage (MongoDB by default)
3. Merges all coverage into `coverage/merged/`

### Comprehensive Coverage (All DB Adapters)

```bash
pnpm test:coverage:all
```

This runs:

1. Unit tests with coverage
2. Integration tests with MongoDB, Postgres, and SQLite
3. Merges all coverage into `coverage/merged/`

### Full Coverage (Unit + Integration + E2E)

```bash
pnpm test:coverage:full
```

This runs:

1. Unit tests with coverage
2. Integration tests with coverage (MongoDB by default)
3. E2E tests with coverage (Playwright browser tests)
4. Processes and merges all coverage into `coverage/merged/`

**Note:** E2E tests take significantly longer and collect browser-based coverage.

## Available Scripts

### Individual Coverage Collection

```bash
# Unit tests only
pnpm test:coverage:unit

# Integration tests (default DB: MongoDB)
pnpm test:coverage:int

# Integration tests with specific DB adapter
pnpm test:coverage:int:mongodb
pnpm test:coverage:int:postgres
pnpm test:coverage:int:sqlite
pnpm test:coverage:int:firestore

# E2E tests (Playwright)
pnpm test:coverage:e2e

# Process E2E coverage data (convert to Istanbul format)
pnpm test:coverage:e2e:process
```

### Coverage Management

```bash
# Merge all collected coverage reports
pnpm test:coverage:merge

# Open HTML coverage report in browser
pnpm test:coverage:report

# Clean all coverage data
pnpm test:coverage:clean
```

## Understanding Coverage Reports

After running coverage, you'll find reports in the `coverage/` directory:

```
coverage/
├── unit/                    # Unit test coverage
│   └── coverage-final.json
├── int/                     # Integration test coverage (default DB)
│   └── coverage-final.json
├── int-mongodb/             # Integration test coverage (MongoDB)
│   └── coverage-final.json
├── int-postgres/            # Integration test coverage (Postgres)
│   └── coverage-final.json
├── int-sqlite/              # Integration test coverage (SQLite)
│   └── coverage-final.json
├── e2e/                     # E2E test coverage (Playwright)
│   └── coverage-final.json
└── merged/                  # Cumulative merged coverage
    ├── index.html          # HTML report (open in browser)
    ├── lcov.info           # LCOV format (for CI/CD tools)
    ├── coverage-summary.json
    └── lcov-report/        # Detailed HTML reports
```

### Viewing Reports

**Text Summary:**
Automatically displayed after running `pnpm test:coverage:merge`

**HTML Report:**

```bash
pnpm test:coverage:report
# or manually:
open coverage/merged/index.html
```

**LCOV Report (for CI/CD):**

```
coverage/merged/lcov.info
```

## How It Works

### 1. Coverage Collection

Each test type collects coverage independently:

- **Vitest** (unit & integration): Uses V8 coverage provider
- **Playwright** (e2e): Uses Playwright's coverage API to collect browser-based JS coverage

### 2. Coverage Merging

The `scripts/merge-coverage.ts` script:

1. Finds all `coverage-final.json` files
2. Copies them to `.nyc_output/`
3. Uses `nyc` to merge and generate unified reports

### 3. Configuration Files

- **vitest.config.ts** - Coverage configuration for Vitest
- **.nycrc.json** - NYC configuration for merging reports
- **scripts/merge-coverage.ts** - Coverage merge script

## Coverage Scope

### Included

All source files in `packages/*/src/**/*.{ts,tsx}`:

- Core Payload package
- Database adapters
- Rich text editors
- Storage adapters
- Email adapters
- Plugins
- UI components
- GraphQL layer
- Translations

### Excluded

- Test files (`*.spec.ts`, `*.test.ts`)
- Build outputs (`**/dist/**`)
- Configuration files (`*.config.ts`)
- Type definitions (`*.d.ts`, `payload-types.ts`)
- Templates and examples
- Node modules

## CI/CD Integration

### Using with GitHub Actions

```yaml
- name: Run tests with coverage
  run: pnpm test:coverage:all

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/merged/lcov.info
    flags: unittests,integration
```

### Using with Coveralls

```yaml
- name: Run tests with coverage
  run: pnpm test:coverage:all

- name: Upload to Coveralls
  uses: coverallsapp/github-action@v2
  with:
    file: ./coverage/merged/lcov.info
```

### Using with SonarQube

```yaml
- name: Run tests with coverage
  run: pnpm test:coverage:all

- name: SonarQube Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    args: >
      -Dsonar.javascript.lcov.reportPaths=coverage/merged/lcov.info
```

## Database Adapter Coverage Strategy

### Option 1: All Adapters (Comprehensive)

Run tests against all database adapters and merge coverage:

```bash
pnpm test:coverage:all
```

**Pros:**

- Ensures adapter-specific code paths are covered
- Catches adapter-specific bugs

**Cons:**

- Slower (runs tests 3-4 times)
- May show inflated coverage if core logic is identical

### Option 2: Single Adapter (Efficient)

Run coverage on one canonical adapter (e.g., Postgres):

```bash
pnpm test:coverage:clean
pnpm test:coverage:unit
pnpm test:coverage:int:postgres
pnpm test:coverage:merge
```

**Pros:**

- Faster
- Still covers most core logic

**Cons:**

- May miss adapter-specific code paths

### Recommendation

For **local development**: Use single adapter (faster feedback)
For **CI/CD**: Use all adapters (comprehensive coverage)

## E2E Test Coverage

**Status: ✅ Fully Implemented!**

E2E coverage uses Playwright's built-in coverage API to collect JavaScript coverage from the browser.

### How It Works

**Coverage Flow:**

1. Playwright starts and enables JS coverage collection
2. Tests run in the browser, exercising the application
3. Coverage data is collected from each page/context
4. Raw V8 coverage is converted to Istanbul format
5. E2E coverage is merged with unit and integration coverage

### Running E2E Tests with Coverage

```bash
# Run all E2E tests with coverage
pnpm test:coverage:e2e

# Process the collected coverage data
pnpm test:coverage:e2e:process

# Or run everything together (unit + int + e2e)
pnpm test:coverage:full
```

### Implementation Details

- **Coverage Collection**: Uses Playwright's `page.coverage.startJSCoverage()` API
- **Format Conversion**: Converts V8 coverage to Istanbul format for NYC merging
- **Config**: Uses `test/playwright.coverage.config.ts` when coverage is enabled
- **Storage**: E2E coverage saved to `coverage/e2e/coverage-final.json`
- **Fixtures**: Custom Playwright fixtures automatically enable/disable coverage

### Performance Considerations

E2E tests are slower than unit/integration tests:

- Browser startup/teardown overhead
- Network requests and rendering
- Coverage collection adds ~10-15% overhead

**Recommendation:**

- **Local development**: Use `pnpm test:coverage` (unit + integration only)
- **CI/CD or final checks**: Use `pnpm test:coverage:full` (all tests)

## Troubleshooting

### No coverage files found

**Problem:** `pnpm test:coverage:merge` says "No coverage files found"

**Solution:** Run tests with coverage first:

```bash
pnpm test:coverage:unit
pnpm test:coverage:int
```

### Coverage percentage seems low

**Problem:** Coverage shows lower than expected

**Possible causes:**

1. Not all test types are running (add `:all` for comprehensive coverage)
2. Some packages aren't being tested
3. Test files themselves are excluded from coverage

**Solution:**

- Run `pnpm test:coverage:all` for comprehensive coverage
- Check `coverage/merged/index.html` to see which files are uncovered

### Merge fails with permission errors

**Problem:** Coverage merge script fails

**Solution:**

```bash
pnpm test:coverage:clean  # Clean old coverage
pnpm test:coverage        # Run again
```

### Different coverage on different machines

**Problem:** Coverage percentages differ between local and CI

**Possible causes:**

1. Different test suites running
2. Different database adapters
3. Cached coverage data

**Solution:**

- Always run `pnpm test:coverage:clean` before collecting coverage
- Use the same script in CI as locally (e.g., `test:coverage:all`)

## Advanced Usage

### Custom Coverage Thresholds

Edit `.nycrc.json` to add coverage thresholds:

```json
{
  "check-coverage": true,
  "lines": 80,
  "functions": 80,
  "branches": 80,
  "statements": 80
}
```

Then run:

```bash
pnpm test:coverage
```

It will fail if coverage falls below thresholds.

### Filtering Coverage by Package

To see coverage for a specific package:

```bash
# Run coverage
pnpm test:coverage

# Filter report
npx nyc report --include "packages/payload/src/**/*.ts"
```

### Coverage for Specific Test Suite

To get coverage for a specific integration test:

```bash
vitest run --project int test/fields/int.spec.ts --coverage
```

## Best Practices

1. **Always clean before comprehensive coverage runs:**

   ```bash
   pnpm test:coverage:clean
   pnpm test:coverage:all
   ```

2. **Check coverage locally before pushing:**

   ```bash
   pnpm test:coverage
   pnpm test:coverage:report
   ```

3. **Use coverage to find untested code paths:**

   - Review HTML report
   - Look for red (uncovered) lines
   - Add tests for critical paths

4. **Don't chase 100% coverage:**
   - Focus on critical business logic
   - Some code (error handling, edge cases) may not need tests
   - Aim for meaningful coverage, not arbitrary percentages

## Resources

- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)
- [NYC Coverage Docs](https://github.com/istanbuljs/nyc)
- [LCOV Format Spec](https://github.com/linux-test-project/lcov)
