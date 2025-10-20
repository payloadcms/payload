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
  - `packages/richtext-*` - Rich text editors (Lexical, Slate)
  - `packages/storage-*` - Storage adapters (S3, Azure, GCS, Uploadthing, Vercel Blob)
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

## Build Commands

- `pnpm install` - Install all dependencies (pnpm required - run `corepack enable` first)
- `pnpm build` or `pnpm build:core` - Build core packages (excludes plugins and storage adapters)
- `pnpm build:all` - Build all packages
- `pnpm build:<directory_name>` - Build specific package (e.g. `pnpm build:db-mongodb`, `pnpm build:ui`)

## Development

### Running Dev Server

- `pnpm dev` - Start dev server with default config (`test/_community/config.ts`)
- `pnpm dev <directory_name>` - Start dev server with specific test config (e.g. `pnpm dev fields` loads `test/fields/config.ts`)
- `pnpm dev:postgres` - Run dev server with Postgres
- `pnpm dev:memorydb` - Run dev server with in-memory MongoDB

### Development Environment

- Auto-login is enabled by default with credentials: `dev@payloadcms.com` / `test`
- To disable: pass `--no-auto-login` flag or set `PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN=false`
- Default database is MongoDB (in-memory). Switch to Postgres with `PAYLOAD_DATABASE=postgres`
- Docker services: `pnpm docker:start` / `pnpm docker:stop` / `pnpm docker:restart`

## Testing

### Running Tests

- `pnpm test` - Run all tests (integration + components + e2e)
- `pnpm test:int` - Run integration tests (MongoDB, recommended for verifying local changes)
- `pnpm test:int <directory_name>` - Run specific integration test suite (e.g. `pnpm test:int fields`)
- `pnpm test:int:postgres` - Run integration tests with Postgres
- `pnpm test:int:sqlite` - Run integration tests with SQLite
- `pnpm test:unit` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests (Playwright)
- `pnpm test:e2e:headed` - Run e2e tests in headed mode
- `pnpm test:e2e:debug` - Run e2e tests in debug mode
- `pnpm test:components` - Run component tests (Jest)
- `pnpm test:types` - Run type tests (tstyche)

### Test Structure

Each test directory in `test/` follows this pattern:

```
test/<feature-name>/
├── config.ts        # Lightweight Payload config for testing
├── int.spec.ts      # Integration tests (Jest)
├── e2e.spec.ts      # End-to-end tests (Playwright)
└── payload-types.ts # Generated types
```

Generate types for a test directory: `pnpm dev:generate-types <directory_name>`

## Linting & Formatting

- `pnpm lint` - Run linter across all packages
- `pnpm lint:fix` - Fix linting issues

## Internationalization

- Translation files are in `packages/translations/src/languages/`
- Add new strings to English locale first, then translate to other languages
- Run `pnpm translateNewKeys` to auto-translate new keys (requires `OPENAI_KEY` in `.env`)
- Lexical translations: `cd packages/richtext-lexical && pnpm translateNewKeys`

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
- pnpm version: ^9.7.0
