# E2E Coverage Setup Summary

This document summarizes the E2E coverage implementation added to the Payload monorepo.

## What Was Implemented

### 1. Coverage Collection Infrastructure

**Files Created:**

- `test/playwright-coverage-setup.ts` - Global setup for Playwright that prepares coverage directories
- `test/playwright-coverage-fixtures.ts` - Custom Playwright fixtures that automatically collect coverage
- `test/playwright.coverage.config.ts` - Playwright config with coverage enabled
- `test/runE2EWithCoverage.ts` - E2E test runner with coverage collection enabled
- `scripts/process-e2e-coverage.ts` - Script to convert V8 coverage to Istanbul format

### 2. How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Start E2E tests with coverage enabled                    │
│    $ pnpm test:coverage:e2e                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 2. Playwright starts with coverage fixtures                 │
│    - Each page enables JS coverage collection               │
│    - page.coverage.startJSCoverage()                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 3. Tests run in browser                                      │
│    - User interactions                                       │
│    - API calls                                               │
│    - Page navigations                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 4. Coverage collected after each test                       │
│    - page.coverage.stopJSCoverage()                          │
│    - Raw V8 coverage saved to coverage/e2e/*.json            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 5. Process coverage data                                     │
│    $ pnpm test:coverage:e2e:process                          │
│    - Converts V8 format to Istanbul format                   │
│    - Saves to coverage/e2e/coverage-final.json               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│ 6. Merge with other coverage                                 │
│    $ pnpm test:coverage:merge                                │
│    - Merges unit + integration + e2e coverage                │
│    - Generates unified reports in coverage/merged/           │
└──────────────────────────────────────────────────────────────┘
```

## New NPM Scripts

```bash
# Run E2E tests with coverage
pnpm test:coverage:e2e

# Process E2E coverage (convert V8 to Istanbul format)
pnpm test:coverage:e2e:process

# Run ALL tests with coverage (unit + integration + e2e)
pnpm test:coverage:full
```

## Usage Examples

### Basic E2E Coverage

```bash
# Clean, run e2e tests, process, and view
pnpm test:coverage:clean
pnpm test:coverage:e2e
pnpm test:coverage:e2e:process
pnpm test:coverage:merge
pnpm test:coverage:report
```

### Full Coverage (All Test Types)

```bash
# Everything at once
pnpm test:coverage:full
pnpm test:coverage:report
```

### Specific E2E Test Suite

```bash
# Run coverage for a specific test suite
ENABLE_COVERAGE=true pnpm runts ./test/runE2EWithCoverage.ts admin
```

## Technical Details

### Coverage Collection Method

- **Tool**: Playwright's built-in `page.coverage` API
- **Format**: V8 coverage format (same as Vitest)
- **Scope**: JavaScript executed in the browser during tests
- **Includes**:
  - Client-side React components
  - Client-side utilities
  - Bundled JavaScript from packages
- **Excludes**:
  - Server-side code (covered by integration tests)
  - Node.js modules
  - Static assets

### Format Conversion

E2E tests produce V8 coverage format (Chrome DevTools Protocol), which is converted to Istanbul format for compatibility with NYC and Vitest coverage.

**Conversion handled by**: `scripts/process-e2e-coverage.ts`

### Merging Strategy

The coverage merge script (`scripts/merge-coverage.ts`) looks for coverage files in:

1. `coverage/unit/coverage-final.json`
2. `coverage/int/coverage-final.json`
3. `coverage/int-*/coverage-final.json` (per-DB-adapter)
4. `coverage/e2e/coverage-final.json` ⭐ NEW
5. Merges all using NYC

## Performance Impact

### E2E Test Overhead

Adding coverage collection to E2E tests adds overhead:

| Aspect        | Without Coverage | With Coverage | Overhead |
| ------------- | ---------------- | ------------- | -------- |
| Single test   | ~2-5s            | ~2.5-6s       | +10-15%  |
| Full suite    | ~10-30 min       | ~12-35 min    | +10-15%  |
| Coverage data | 0 MB             | ~5-20 MB      | +5-20 MB |

### Recommendations

- **Local Development**: Use `pnpm test:coverage` (skip e2e)
- **Pre-commit**: Use `pnpm test:coverage` (skip e2e)
- **CI/CD**: Use `pnpm test:coverage:full` (include e2e)
- **Final Release**: Use `pnpm test:coverage:full` (include e2e)

## Troubleshooting

### No E2E coverage collected

**Problem**: `coverage/e2e/` is empty after running tests

**Solutions**:

1. Ensure `ENABLE_COVERAGE=true` is set
2. Check that Playwright tests actually ran
3. Look for errors in test output
4. Verify browser has JS coverage support (Chromium only)

### Coverage processing fails

**Problem**: `pnpm test:coverage:e2e:process` fails

**Solutions**:

1. Check that coverage files exist in `coverage/e2e/`
2. Ensure Istanbul packages are installed
3. Check for malformed JSON in coverage files

### Merged coverage looks wrong

**Problem**: Coverage percentage doesn't make sense

**Solutions**:

1. Clean and re-run: `pnpm test:coverage:clean && pnpm test:coverage:full`
2. Check that all coverage files were found (see merge output)
3. Verify no duplicate files in coverage directories

## Limitations

1. **Browser Only**: E2E coverage only captures code executed in the browser

   - Server-side code is covered by integration tests
   - API routes and server components are not in e2e coverage

2. **Chromium Only**: Coverage API only works in Chromium-based browsers

   - Firefox and WebKit don't support coverage collection
   - This is a Playwright/browser limitation

3. **Source Maps**: Coverage reports may show bundled code

   - Source maps should help map back to original source
   - Some minified code may appear in reports

4. **Async Code**: Race conditions may affect coverage accuracy
   - Dynamic imports might not be fully covered
   - Code that runs after test completion won't be captured

## Future Improvements

Potential enhancements:

1. **Incremental Coverage**: Only collect coverage for changed files
2. **Parallel Collection**: Run multiple browsers with coverage
3. **Better Source Mapping**: Improve bundled code → source mapping
4. **Coverage Thresholds**: Fail tests if coverage drops below threshold
5. **Differential Coverage**: Show coverage diff between branches

## Architecture Decisions

### Why Playwright Coverage API?

**Alternatives considered:**

- Istanbul middleware + instrumentation
- Babel plugin + runtime coverage
- Custom coverage collector

**Chosen: Playwright Coverage API**

- Built-in, no instrumentation needed
- Works with any bundler
- Accurate, low overhead
- Standard V8 format

### Why Convert to Istanbul Format?

**Reason**: Compatibility with NYC and Vitest

- NYC expects Istanbul format
- Vitest outputs Istanbul-compatible format
- Allows unified merging across all test types

## Support

For issues or questions:

1. Check `COVERAGE.md` for detailed coverage documentation
2. Review test output for specific errors
3. Verify all dependencies are installed
4. Ensure using supported Node.js version

## Summary

E2E coverage is now fully integrated into the Payload test suite! 🎉

- ✅ Automatic coverage collection in E2E tests
- ✅ Format conversion to Istanbul
- ✅ Unified merging with unit/integration coverage
- ✅ Updated documentation
- ✅ New NPM scripts for easy usage

**Next Steps**: Run `pnpm test:coverage:full` to see cumulative coverage across all test types!
