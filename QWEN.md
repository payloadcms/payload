# QWEN.md - Local Development Guidelines

> **⚠️ LOCAL FILE - DO NOT COMMIT**
> 
> This file is for local development only and is ignored by git.
> Add `QWEN.md` to your personal `.gitignore` if you create similar files.

This file provides project-specific guidance for Qwen Code when working with the Payload CMS repository.

## Project Overview

**Payload CMS** is a headless CMS built on Next.js with React Server Components. It's a monorepo containing the core CMS platform, database adapters, plugins, and tooling.

**Repository:** https://github.com/payloadcms/payload  
**Your Fork:** https://github.com/ossaidqadri/payload

## Quick Reference

### Essential Commands

```bash
# Installation
pnpm install

# Building
pnpm run build:core          # Build core packages (excludes plugins/storage)
pnpm run build:all           # Build everything
pnpm run build:ui            # Build specific package

# Development
pnpm run dev                 # Start dev server (MongoDB default)
pnpm run dev:postgres        # Start with Postgres
pnpm run dev <directory>     # Start with specific test config

# Testing
pnpm run test:int            # Integration tests
pnpm run test:int <dir>      # Specific test suite (e.g., fields)
pnpm run test:unit           # Unit tests
pnpm run test:e2e            # Playwright E2E tests

# Code Quality
pnpm run lint                # Run linter
pnpm run lint:fix            # Auto-fix lint issues
```

### Git Workflow

```bash
# Create new branch from main
git checkout main && git pull origin main
git checkout -b fix/<issue-number>-<short-description>

# Commit with Conventional Commits
git commit -m "type(scope): description"

# Push and create PR
git push --set-upstream origin <branch-name>
gh pr create -t <title> -F .git/PR_BODY.md
```

## Conventional Commits

This repository **strictly follows** Conventional Commits. All PR titles and commits must follow this format.

### Format

```
<type>(<scope>): <description>
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New features or functionality |
| `fix` | Bug fixes |
| `perf` | Performance improvements |
| `refactor` | Code refactoring (no behavior change) |
| `docs` | Documentation changes |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks, build config |
| `ci` | CI/CD configuration |
| `style` | Code style changes (formatting, etc.) |
| `revert` | Reverting previous commits |

### Scopes

Match package names or omit if general:
- `ui` - Admin UI components
- `db-mongodb`, `db-postgres`, `db-sqlite` - Database adapters
- `richtext-lexical`, `richtext-slate` - Rich text editors
- `storage-s3`, `storage-r2` - Storage adapters
- `graphql` - GraphQL API
- `translations` - i18n
- `next` - Next.js integration
- *(omit)* - Core payload package or general changes

### Examples

```bash
# Good commit messages
feat(ui): add batch relationship loading
fix(db-mongodb): handle connection pool exhaustion
perf(ui): reduce API requests by 98%
docs: update getting started guide
chore: update dependencies
```

## Windows-Specific Notes

### GitHub CLI Escaping

Windows cmd.exe handles quotes differently than Unix shells. When using `gh pr create`:

```bash
# ❌ FAILS - spaces in arguments
gh pr create -t "perf(ui): batch requests" -b "Fixes #13329"

# ✅ WORKS - use file for body
echo "Fixes #13329" > .git\PR_BODY.md
gh pr create -t perf-ui-batch-requests -F .git\PR_BODY.md

# ✅ WORKS - simple title without special chars
gh pr create -t perf-ui-batch-requests -b "Fixes #13329"

# ✅ WORKS - web interface
gh pr create --web
```

### Path Separators

- Use forward slashes `/` in git commands (cross-platform)
- Use backslashes `\` in Windows file paths for shell commands
- Node.js `path.join()` handles this automatically in code

## Testing Guidelines

### Writing Tests

**MUST follow these rules:**

1. **Self-contained tests** - Create and cleanup within the test
2. **Use `afterEach`** for batch cleanup of multiple tests
3. **Track created resources** in arrays for cleanup
4. **Descriptive names** starting with "should"

### Example Test Pattern

```typescript
describe('My Feature', () => {
  const createdIDs: number[] = []

  afterEach(async () => {
    // Cleanup all created resources
    for (const id of createdIDs) {
      await payload.delete({ collection: 'test', id })
    }
    createdIDs.length = 0
  })

  it('should create document with relationship', async () => {
    const id = 123
    createdIDs.push(id)

    await payload.create({ 
      collection: 'test', 
      data: { id, title: 'Test' } 
    })
    
    // assertions...
  })
})
```

### Running Specific Tests

```bash
# Run tests in specific directory
pnpm run test:int fields

# Run with specific database
pnpm run test:int:postgres fields

# Run E2E tests with UI
pnpm run test:e2e:headed
```

## Code Style Guidelines

### Naming Conventions

```typescript
// Booleans with prefixes
const isValid = true
const hasData = false
const canEdit = true
const shouldUpdate = false

// Functions over classes
function calculateTotal() { }  // ✅
class Calculator { }           // ❌ (unless adapter/error)

// Single object parameter
function createUser(options: { name: string; email: string }) { }  // ✅
function createUser(name: string, email: string) { }               // ❌
```

### Types vs Interfaces

```typescript
// Prefer types
type User = {
  id: number
  name: string
}

// Interfaces for extending external types
interface CustomUser extends User {
  role: string
}
```

### Imports

```typescript
// Separate type and value imports
import type { User } from './types.js'
import { createUser } from './utils.js'

// Even from same module
import type { Config } from 'payload'
import { config } from 'payload'
```

### Comments

```typescript
// ✅ Good: Explains WHY, not WHAT
// Using LRU cache to prevent memory growth
if (cache.size >= MAX_SIZE) {
  cache.delete(cache.keys().next().value)
}

// ❌ Bad: Stating the obvious
// Delete the first item
cache.delete(cache.keys().next().value)

// ✅ Good: Non-obvious context
// Payload protocol includes trailing colon (e.g., 'https:' not 'https')
parsedUrl.protocol.match(/^https?:$/)
```

## Common Workflows

### Fixing an Issue

1. **Read the issue** - Understand the problem and requirements
2. **Search codebase** - Find relevant files using grep/glob
3. **Create branch** - `git checkout -b fix/<issue>-<description>`
4. **Write tests first** (TDD) - Create failing tests
5. **Implement fix** - Make minimal changes to pass tests
6. **Verify** - Run TypeScript, linter, tests
7. **Commit** - Use Conventional Commits
8. **Push & PR** - Create pull request

### Code Review Checklist

Before submitting PR:

- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Linter passes
- [ ] Commit message follows Conventional Commits
- [ ] PR description links to issue (Fixes #1234)
- [ ] No console.log statements
- [ ] No hardcoded credentials/secrets
- [ ] Error handling in place
- [ ] JSDoc for complex functions

### Performance Fixes

When fixing performance issues:

1. **Profile first** - Identify the bottleneck
2. **Quantify improvement** - Measure before/after
3. **Add tests** - Ensure performance doesn't regress
4. **Document** - Explain the optimization in commit message

Example from PR #15922:
```
perf(ui): batch relationship requests to prevent N+1 queries

- Before: 50 items × 2 relationships = 100+ API requests
- After: 2 requests (batched by collection)
- Improvement: 98% reduction
```

## Tools & Utilities

### GitHub CLI

```bash
# View issue
gh issue view 13329

# View PR
gh pr view 15922

# List issues by label
gh issue list -l "good first issue"

# Create PR
gh pr create -t <title> -F .git/PR_BODY.md

# Check CI status
gh pr checks 15922
```

### Git Shortcuts

```bash
# See recent commits
git log -n 5 --oneline

# See what will be committed
git diff HEAD

# See staged changes
git diff --staged

# Undo last commit (keep changes)
git reset HEAD~1

# Discard local changes
git checkout -- <file>
```

## Project Structure Quick Ref

```
payload/
├── packages/
│   ├── payload/           # Core CMS
│   ├── ui/                # Admin UI (React Server Components)
│   ├── next/              # Next.js integration
│   ├── db-*/              # Database adapters
│   ├── richtext-*/        # Rich text editors
│   ├── storage-*/         # Storage adapters
│   └── plugin-*/          # Plugins
├── test/                  # Test suites
├── docs/                  # Documentation
└── templates/             # Project templates
```

## Key Contacts & Resources

- **Main Repo:** https://github.com/payloadcms/payload
- **Your Fork:** https://github.com/ossaidqadri/payload
- **Docs:** https://payloadcms.com/docs
- **LLMS.txt:** https://payloadcms.com/llms.txt

## Recent Work

### PR #15922 - Performance: Batch Relationship Requests

**Issue:** #13329 - N+1 query problem with relationship fields

**Solution:**
- Created `RelationshipBatcher` utility
- Batches requests by collection type
- LRU cache with 1000 entry limit
- Concurrency limiting (max 10 requests)

**Impact:**
- 98% reduction in API requests
- Prevents MongoDB connection exhaustion
- 28 comprehensive tests added

**Files:**
- `packages/ui/src/utilities/RelationshipBatcher.ts`
- `packages/ui/src/fields/Relationship/utils.ts`
- `packages/ui/src/fields/Relationship/Input.tsx` (refactored)

## Tips for Success

1. **Read CLAUDE.md first** - It has detailed architecture info
2. **Use search tools** - grep_search, glob are your friends
3. **Run tests early** - Don't wait until the end
4. **Small commits** - Commit frequently with clear messages
5. **Ask for clarification** - If requirements are unclear
6. **Document as you go** - Update this file with new learnings
