---
name: triage-ci-flake
description: Reproduces, diagnoses, and fixes flaky CI test failures by running dev and production builds locally, identifying race conditions and timing issues, and verifying fixes with repeated test runs. Use when CI tests fail on main branch after PR merge, tests pass locally but fail in CI, or investigating intermittent e2e/integration test failures.
allowed-tools: Write, Bash(date:*), Bash(mkdir -p *)
---

# Triage CI Failure

## Overview

Systematic workflow for triaging and fixing test failures in CI, especially flaky tests that pass locally but fail in CI. Tests that made it to `main` are usually flaky due to timing, bundling, or environment differences.

**CRITICAL RULE: You MUST run the reproduction workflow before proposing any fixes. No exceptions.**

## When to Use

- CI test fails on `main` branch after PR was merged
- Test passes locally but fails in CI
- Test failure labeled as "flaky" or intermittent
- E2E or integration test timing out in CI only

## MANDATORY First Steps

**YOU MUST EXECUTE THESE COMMANDS. Reading code or analyzing logs does NOT count as reproduction.**

1. **Extract** suite name, test name, and error from CI logs
2. **EXECUTE**: Kill port 3000 to avoid conflicts
3. **EXECUTE**: `pnpm dev $SUITE_NAME` (use run_in_background=true)
4. **EXECUTE**: Wait for server to be ready (check with curl or sleep)
5. **EXECUTE**: Run the specific failing test with Playwright directly (npx playwright test test/TEST_SUITE_NAME/e2e.spec.ts:31:3 --headed -g "TEST_DESCRIPTION_TARGET_GOES_HERE")
6. **If test passes**, **EXECUTE**: `pnpm prepare-run-test-against-prod`
7. **EXECUTE**: `pnpm dev:prod $SUITE_NAME` and run test again

**Only after EXECUTING these commands and seeing their output** can you proceed to analysis and fixes.

**"Analysis from logs" is NOT reproduction. You must RUN the commands.**

## Step-by-Step Process

### 1. Extract CI Details

From CI logs or GitHub Actions URL, identify:

- **Suite name**: Directory name (e.g., `i18n`, `fields`, `lexical`)
- **Test file**: Full path (e.g., `test/i18n/e2e.spec.ts`)
- **Test name**: Exact test description
- **Error message**: Full stack trace
- **Test type**: E2E (Playwright) or integration (Vitest)

### 2. Reproduce with Dev Code

**CRITICAL: Always run the specific test by name, not the full suite.**

**SERVER MANAGEMENT RULES:**

1. **ALWAYS kill all servers before starting a new one**
2. **NEVER assume ports are free**
3. **ALWAYS wait for server ready confirmation before running tests**

```bash
# ========================================
# STEP 2A: STOP ALL SERVERS
# ========================================
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 clear"

# ========================================
# STEP 2B: START DEV SERVER
# ========================================
# Start dev server with the suite (in background with run_in_background=true)
pnpm dev $SUITE_NAME

# ========================================
# STEP 2C: WAIT FOR SERVER READY
# ========================================
# Wait for server to be ready (REQUIRED - do not skip)
until curl -s http://localhost:3000/admin > /dev/null 2>&1; do sleep 1; done && echo "Server ready"

# ========================================
# STEP 2D: RUN SPECIFIC TEST
# ========================================
# Run ONLY the specific failing test using Playwright directly
# For E2E tests (DO NOT use pnpm test:e2e as it spawns its own server):
pnpm exec playwright test test/$SUITE_NAME/e2e.spec.ts -g "exact test name"

# For integration tests:
pnpm test:int $SUITE_NAME -t "exact test name"
```

**Did the test fail?**

- ✅ **YES**: You reproduced it! Proceed to debug with dev code.
- ❌ **NO**: Continue to step 3 (bundled code test).

### 3. Reproduce with Bundled Code

If test passed with dev code, the issue is likely in bundled/production code.

**IMPORTANT: You MUST stop the dev server before starting prod server.**

```bash
# ========================================
# STEP 3A: STOP ALL SERVERS (INCLUDING DEV SERVER FROM STEP 2)
# ========================================
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 clear"

# ========================================
# STEP 3B: BUILD AND PACK FOR PROD
# ========================================
# Build all packages and pack them (this takes time - be patient)
pnpm prepare-run-test-against-prod

# ========================================
# STEP 3C: START PROD SERVER
# ========================================
# Start prod dev server (in background with run_in_background=true)
pnpm dev:prod $SUITE_NAME

# ========================================
# STEP 3D: WAIT FOR SERVER READY
# ========================================
# Wait for server to be ready (REQUIRED - do not skip)
until curl -s http://localhost:3000/admin > /dev/null 2>&1; do sleep 1; done && echo "Server ready"

# ========================================
# STEP 3E: RUN SPECIFIC TEST
# ========================================
# Run the specific test again using Playwright directly
pnpm exec playwright test test/$SUITE_NAME/e2e.spec.ts -g "exact test name"
# OR for integration tests:
pnpm test:int $SUITE_NAME -t "exact test name"
```

**Did the test fail now?**

- ✅ **YES**: Bundling or production build issue. Look for:
  - Missing exports in package.json
  - Build configuration problems
  - Code that behaves differently when bundled
- ❌ **NO**: Unable to reproduce locally. Proceed to step 4.

### 4. Unable to Reproduce

If you cannot reproduce locally after both attempts:

- Review CI logs more carefully for environment differences
- Check for race conditions (run test multiple times: `for i in {1..10}; do pnpm test:e2e...; done`)
- Look for CI-specific constraints (memory, CPU, timing)
- Consider if it's a true race condition that's highly timing-dependent

## Common Flaky Test Patterns

### Race Conditions

- Page navigating while assertions run
- Network requests not settled before assertions
- State updates not completed

**Fix patterns:**

- Use Playwright's web-first assertions (`toBeVisible()`, `toHaveText()`)
- Wait for specific conditions, not arbitrary timeouts
- Use `waitForFunction()` with condition checks

### Test Pollution

- Tests leaving data in database
- Shared state between tests
- Missing cleanup in `afterEach`

**Fix patterns:**

- Track created IDs and clean up in `afterEach`
- Use isolated test data
- Don't use `deleteAll` that affects other tests

### Timing Issues

- `setTimeout`/`sleep` instead of condition-based waiting
- Not waiting for page stability
- Animations/transitions not complete

**Fix patterns:**

- Use `waitForPageStability()` helper
- Wait for specific DOM states
- Use Playwright's built-in waiting mechanisms

## Linting Considerations

When fixing e2e tests, be aware of these eslint rules:

- `playwright/no-networkidle` - Avoid `waitForLoadState('networkidle')` (use condition-based waiting instead)
- `payload/no-wait-function` - Avoid custom `wait()` functions (use Playwright's built-in waits)
- `payload/no-flaky-assertions` - Avoid non-retryable assertions
- `playwright/prefer-web-first-assertions` - Use built-in Playwright assertions

**Existing code may violate these rules** - when adding new code, follow the rules even if existing code doesn't.

## Verification

After fixing:

```bash
# Ensure dev server is running on port 3000
# Run test multiple times to confirm stability
for i in {1..10}; do
  pnpm exec playwright test test/$SUITE_NAME/e2e.spec.ts -g "exact test name" || break
done

# Run full suite
pnpm exec playwright test test/$SUITE_NAME/e2e.spec.ts

# If you modified bundled code, test with prod build
lsof -ti:3000 | xargs kill -9 2>/dev/null
pnpm prepare-run-test-against-prod
pnpm dev:prod $SUITE_NAME
until curl -s http://localhost:3000/admin > /dev/null; do sleep 1; done
pnpm exec playwright test test/$SUITE_NAME/e2e.spec.ts
```

## Critical Rule: No Fix Without Reproduction

**NEVER propose a fix before completing the reproduction workflow (steps 1-3).** No exceptions — not for obvious errors, familiar stack traces, or time pressure. Logs show symptoms, not root causes. Reading code is not reproduction. Execute the commands first, then analyze.

## Common Mistakes

| Mistake                           | Fix                                                      |
| --------------------------------- | -------------------------------------------------------- |
| Running full test suite first     | Run specific test by name                                |
| Skipping dev code reproduction    | Always try dev code first                                |
| Not testing with bundled code     | If dev passes, test with `prepare-run-test-against-prod` |
| Proposing fix without reproducing | Follow the workflow - reproduce first                    |
| Using `networkidle` in new code   | Use condition-based waiting with `waitForFunction()`     |
| Adding arbitrary `wait()` calls   | Use Playwright's built-in assertions and waits           |

## Key Principles

1. **Reproduce before fixing**: Never propose a fix without reproducing the issue
2. **Test specifically**: Run the exact failing test, not the full suite
3. **Dev first, prod second**: Check dev code before bundled code
4. **Follow the workflow**: No shortcuts - the steps exist to save time
5. **Verify stability**: Run tests multiple times to confirm fix

## Completion: Creating a PR

**After you have:**

1. ✅ Reproduced the issue
2. ✅ Implemented a fix
3. ✅ Verified the fix passes locally (multiple runs)
4. ✅ Tested with prod build (if applicable)

**You MUST prompt the user to create a PR:**

```
The fix has been verified and is ready for review. Would you like me to create a PR with these changes?

Summary of changes:
- [List files modified]
- [Brief description of the fix]
- [Verification results]
```

**IMPORTANT:**

- **DO NOT automatically create a PR** - always ask the user first
- Provide a clear summary of what was changed and why
- Include verification results (number of test runs, pass rate)
- Let the user decide whether to create the PR immediately or make additional changes first

This ensures the user has visibility and control over what gets submitted for review.
