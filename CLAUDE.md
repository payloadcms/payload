# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Payload is a monorepo structured around Next.js, containing the core CMS platform, database adapters, plugins, and tooling.

### Key Directories

- `packages/` - All publishable packages
  - `packages/payload` - Core Payload package containing the main CMS logic
  - `packages/ui` - Admin UI components (React Server Components)
  - `packages/next` - Next.js integration layer
  - `packages/db-*` - Database adapters (MongoDB, Postgres, SQLite, Vercel Postgres, D1 SQLite)
  - `packages/drizzle` - Drizzle ORM integration
  - `packages/kv-redis` - Redis key-value store adapter
  - `packages/richtext-*` - Rich text editors (Lexical, Slate)
  - `packages/storage-*` - Storage adapters (S3, Azure, GCS, Uploadthing, Vercel Blob, R2)
  - `packages/email-*` - Email adapters (Nodemailer, Resend)
  - `packages/plugin-*` - Additional functionality plugins
  - `packages/graphql` - GraphQL API layer
  - `packages/translations` - i18n translations
- `test/` - Test suites organized by feature area. Each directory contains a granular Payload config and test files
- `docs/` - Documentation (deployed to payloadcms.com)
- `tools/` - Monorepo tooling
- `templates/` - Production-ready project templates
- `examples/` - Example implementations

### Architecture Notes

- Payload 3.x is built as a Next.js native CMS that installs directly in `/app` folder
- UI is built with React Server Components (RSC)
- Database adapters use Drizzle ORM under the hood
- Packages use TypeScript with strict mode and path mappings defined in `tsconfig.base.json`
- Source files are in `src/`, compiled outputs go to `dist/`
- Monorepo uses pnpm workspaces and Turbo for builds

## Quick Start

1. `pnpm install`
2. `pnpm run build:core`
3. `pnpm run dev` (MongoDB) or `pnpm run dev:postgres`

## Build Commands

- `pnpm install` - Install all dependencies
- `pnpm turbo` - All Turbo commands should be run from root with pnpm - not with `turbo` directly
- `pnpm run build` or `pnpm run build:core` - Build core packages (excludes plugins and storage adapters)
- `pnpm run build:all` - Build all packages
- `pnpm run build:<directory_name>` - Build specific package (e.g. `pnpm run build:db-mongodb`, `pnpm run build:ui`)

## Development

### Coding Patterns and Best Practices

- Prefer single object parameters (improves backwards-compatibility)
- Prefer types over interfaces (except when extending external types)
- Prefer functions over classes (classes only for errors/adapters)
- Prefer pure functions; when mutation is unavoidable, return the mutated object instead of void.
- Organize functions top-down: exports before helpers
- Use JSDoc for complex functions; add tags only when justified beyond type signature
- Use `import type` for types, regular `import` for values, separate statements even from same module
- Prefix booleans with `is`/`has`/`can`/`should` (e.g., `isValid`, `hasData`) for clarity
- Commenting Guidelines
  - Execution flow: Skip comments when code is self-documenting. Keep for complex logic, non-obvious "why", multi-line context, or if following a documented, multi-step flow.
  - Top of file/module: Use sparingly; only for non-obvious purpose/context or an overview of complex logic.
  - Type definitions: Property/interface documentation is always acceptable.
- Logger Usage (`payload.logger.error`)
  - Valid: `payload.logger.error('message')` or `payload.logger.error({ msg: '...', err: error })`
  - Invalid: `payload.logger.error('message', err)` - don't pass error as second argument
  - Use `err` not `error`, use `msg` not `message` in object form

### Running Dev Server

- `pnpm run dev` - Start dev server with default config (`test/_community/config.ts`)
- `pnpm run dev <directory_name>` - Start dev server with specific test config (e.g. `pnpm run dev fields` loads `test/fields/config.ts`)
- `pnpm run dev:postgres` - Run dev server with Postgres

### Development Environment

- Auto-login is enabled by default with credentials: `dev@payloadcms.com` / `test`
- To disable: pass `--no-auto-login` flag or set `PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN=false`
- Default database is MongoDB (in-memory). Switch to Postgres with `PAYLOAD_DATABASE=postgres`
- Docker services: `pnpm docker:start` / `pnpm docker:stop` / `pnpm docker:restart`

## Testing

### Writing Tests - Required Practices

**Tests MUST be self-contained and clean up after themselves:**

- If you create a database record in a test, you MUST delete it before the test completes
- For multiple tests with similar cleanup needs, use `afterEach` to centralize cleanup logic
- Track created resources (IDs, files, etc.) in a shared array within the `describe` block

**Example pattern:**

```typescript
describe('My Feature', () => {
  const createdIDs: number[] = []

  afterEach(async () => {
    for (const id of createdIDs) {
      await payload.delete({ collection: 'my-collection', id })
    }
    createdIDs.length = 0
  })

  it('should create a record', async () => {
    const id = 123
    createdIDs.push(id)

    await payload.create({ collection: 'my-collection', data: { id, title: 'Test' } })
    // assertions...
  })
})
```

**Additional test guidelines:**

- Use descriptive test names starting with "should" (e.g., "should create document with custom ID")
- Add blank lines after variable declarations to improve readability
- Collection and global slugs should be kept in a shared file and re-used i.e. on relationship fields `relationTo: collectionSlug`
- One test should verify one behavior - keep tests focused
- When adding a new collection for testing, add it to both `collections/` directory and the config file import statements

### How to run tests

- `pnpm run test` - Run all tests (integration + components + e2e)
- `pnpm run test:int` - Integration tests (MongoDB, recommended)
- `pnpm run test:int <dir>` - Specific test suite (e.g. `fields`)
- `pnpm run test:int:postgres|sqlite` - Integration tests with other databases
- `pnpm run test:e2e` - Playwright tests (add `:headed` or `:debug` suffix)
- `pnpm run test:unit|components|types` - Other test suites

### Test Structure

Each test directory in `test/` follows this pattern:

```
test/<feature-name>/
├── config.ts        # Lightweight Payload config for testing
├── int.spec.ts      # Integration tests (Vitest)
├── e2e.spec.ts      # End-to-end tests (Playwright)
└── payload-types.ts # Generated types
```

Generate types for a test directory: `pnpm run dev:generate-types <directory_name>`

## Linting & Formatting

- `pnpm run lint` - Run linter across all packages
- `pnpm run lint:fix` - Fix linting issues

## Internationalization

- Translation files are in `packages/translations/src/languages/`
- Add new strings to English locale first, then translate to other languages
- Run `pnpm run translateNewKeys` to auto-translate new keys (requires `OPENAI_KEY` in `.env`)
- Lexical translations: `cd packages/richtext-lexical && pnpm run translateNewKeys`

## Commit & PR Guidelines

This repository follows [Conventional Commits](https://www.conventionalcommits.org/).

### PR Title Format

`<type>(<scope>): <title>`

- Title must start with lowercase letter
- Types: `build`, `chore`, `ci`, `docs`, `examples`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `templates`, `test`
- Prefer `feat` for new features, `fix` for bug fixes
- Scopes match package names: `db-*`, `richtext-*`, `storage-*`, `plugin-*`, `ui`, `next`, `graphql`, `translations`, etc.
- Choose most relevant scope if multiple packages modified, or omit scope entirely

Examples:

- `feat(db-mongodb): add support for transactions`
- `feat(richtext-lexical): add options to hide block handles`
- `fix(ui): json field type ignoring editorOptions`
- `feat: add new collection functionality`

### Commit Guidelines

- First commit of branch should follow PR title format
- Subsequent commits should use `chore` without scope unless specific package is being modified
- All commits in a PR are squashed on merge using PR title as commit message

## Additional Resources

- LLMS.txt: <https://payloadcms.com/llms.txt>
- LLMS-FULL.txt: <https://payloadcms.com/llms-full.txt>
- Node version: ^18.20.2 || >=20.9.0
- pnpm version: ^10.27.0
