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

### Admin UI

**Location:** All UI components and styles live in `packages/ui/`

**Core principles:**

- Never use Tailwind classes
- Always use Payload's built-in CSS variables
- All styles use `@layer payload-default` for proper cascading
- Components automatically adapt to dark mode via CSS variables

#### CSS Variables

All CSS variable definitions are in `packages/ui/src/scss/`:

- `colors.scss` - Color system
- `app.scss` - Spacing, layout, typography
- `vars.scss` - SCSS mixins and baseline grid
- `type.scss` - Typography scale

##### Color System

Colors use a **0-1000 scale in 50-unit increments**. The scale **reverses in dark mode**:

**Elevation (Grayscale):**

- `--theme-elevation-0` through `--theme-elevation-1000`
- Light mode: 0 = white → 1000 = black
- Dark mode: 0 = dark gray → 1000 = white
- Common usage: backgrounds (50, 100, 150), borders (150, 200, 250), text (600, 700, 800)

**Success (Blue):**

- `--theme-success-0` through `--theme-success-950`
- Reverses in dark mode

**Warning (Orange):**

- `--theme-warning-0` through `--theme-warning-950`
- Reverses in dark mode

**Error (Red):**

- `--theme-error-0` through `--theme-error-950`
- Reverses in dark mode

**Semantic color variables:**

- `--theme-bg: var(--theme-elevation-0)` - Main background
- `--theme-input-bg: var(--theme-elevation-0)` - Input backgrounds (elevation-50 in dark mode)
- `--theme-text: var(--theme-elevation-800)` - Main text (elevation-1000 in dark mode)
- `--theme-border-color: var(--theme-elevation-150)` - Default borders

##### Spacing System

**Base unit:** `--base` = 24px (calculated as `calc((20 / 13) * 1rem)`)

Always use `var(--base)` with `calc()` for spacing:

```scss
padding: calc(var(--base) * 0.5); // 12px
margin: calc(var(--base) * 1); // 24px
gap: calc(var(--base) * 0.25); // 6px
```

**Layout spacing:**

- `--gutter-h: 60px` - Horizontal gutter (responsive: 40px medium, 16px small)
- `--app-header-height: calc(var(--base) * 2.8)` - ~67px (responsive: 2.4 medium)
- `--doc-controls-height: calc(var(--base) * 2.8)` - ~67px
- `--nav-width: 275px` - Side navigation (100vw on small screens)

##### Typography

**Font families:**

- `--font-body` - System font stack (San Francisco, Segoe UI, Roboto, etc.)
- `--font-serif` - Georgia, Bitstream Charter
- `--font-mono` - SF Mono, Menlo, Consolas

**Preferred patterns:**

- Use semantic HTML elements (`<h1>` through `<h6>`) - they are globally styled with appropriate sizes
- Body text inherits base styles (13px/20px) from parent
- For small text (labels, pills, metadata), use `@extend %small` (12px/20px) in SCSS files
- Only add explicit font-size when you need non-standard sizing
- For custom sizes, use `calc(var(--base) * X)` to maintain consistency

**Available SCSS placeholders:**

- `%small` - Small text (12px/20px) for labels, pills, and metadata
- `%large-body` - Larger body text with responsive sizing
- `%code` - Code text styling

##### Border Radius

- `--style-radius-s: 3px` - Small radius
- `--style-radius-m: 4px` - Medium radius (most common)
- `--style-radius-l: 8px` - Large radius

##### Shadows (SCSS Mixins)

```scss
@include shadow-sm; // Subtle shadow
@include shadow-m; // Medium shadow
@include shadow-lg; // Large shadow (bottom)
@include shadow-lg-top; // Large shadow (top)
@include soft-shadow-bottom; // Soft bottom shadow
```

##### Z-Index

- `--z-popup: 60` - Highest layer
- `--z-status: 40` - Status indicators
- `--z-modal: 30` - Modal overlays
- `--z-nav: 20` - Navigation

##### Transitions

Standard transition pattern:

```scss
transition-property: border, color, box-shadow, background;
transition-duration: 100ms;
transition-timing-function: cubic-bezier(0, 0.2, 0.2, 1);
```

##### Breakpoints

- `--breakpoint-xs-width: 400px`
- `--breakpoint-s-width: 768px`
- `--breakpoint-m-width: 1024px`
- `--breakpoint-l-width: 1440px`

**Responsive design mixins** (`packages/ui/src/scss/queries.scss`):

```scss
@include extra-small-break {
} // max-width: 400px
@include small-break {
} // max-width: 768px
@include mid-break {
} // max-width: 1024px
@include large-break {
} // max-width: 1440px
```

##### Additional SCSS Mixins

**Backdrop blur effects:**

```scss
@include blur-bg; // Default blur with theme background
@include blur-bg($color, $opacity); // Custom color and opacity
@include blur-bg-light; // Light blur variant
```

**Form input mixins:**

```scss
@include formInput; // Standard input styling
@include inputShadow; // Input focus shadow effect
@include lightInputError; // Light mode error state
@include darkInputError; // Dark mode error state
@include readOnly; // Read-only styling
```

#### Component Styling Patterns

**Button example** (`packages/ui/src/elements/Button/`):

- Use component-scoped CSS variables for theming
- Example: `--btn-bg: var(--theme-elevation-100)`, `--btn-hover-bg: var(--theme-elevation-150)`
- Spacing: `padding: calc(var(--base) * 0.5) calc(var(--base) * 1);`

**Card example** (`packages/ui/src/elements/Card/`):

- Background: `var(--theme-elevation-50)`
- Border: `1px solid var(--theme-border-color)`
- Padding: `calc(var(--base) * 0.8)`
- Border radius: `var(--style-radius-m)`

**Form inputs** (via SCSS mixins):

```scss
@include formInput; // Standard input styling
@include lightInputError; // Light mode error state
@include darkInputError; // Dark mode error state
@include readOnly; // Read-only styling
```

#### Icons

**Location:** `packages/ui/src/icons/`

All icons are React components that export as named exports. Import icons directly from their paths:

```tsx
import { CheckIcon } from '@payloadcms/ui/icons/Check'
import { XIcon } from '@payloadcms/ui/icons/X'
import { EditIcon } from '@payloadcms/ui/icons/Edit'
```

**Available icons include:**
Calendar, Check, Chevron, CloseMenu, CodeBlock, Copy, Document, Dots, DragHandle, Edit, ExternalLink, Eye, Folder, Gear, GridView, Line, Link, ListView, Lock, LogOut, Menu, MinimizeMaximize, More, MoveFolder, People, Plus, Search, Sort, Swap, ThreeDots, Trash, X

**Usage patterns:**

- Icons are SVG components with the `icon` class (e.g., `icon--check`)
- Size is controlled by parent container or CSS (default: `$baseline` = 20px)
- Color customization via `.stroke` and `.fill` classes:
  - `.stroke` - Uses `stroke: currentColor` by default, inherits text color
  - `.fill` - Uses `fill: currentColor` or specific theme colors

**Customizing icon colors:**

```scss
.my-button {
  // Change icon stroke color on hover
  &:hover .icon .stroke {
    stroke: var(--theme-success-500);
  }

  // Change icon fill color when disabled
  &:disabled .icon .fill {
    fill: var(--theme-elevation-400);
  }
}

#### Best Practices

1. **Choose semantic elevation values** - Use based on purpose (background, border, text), not absolute lightness
2. **Use theme variables, not color primitives** - `--theme-elevation-X`, not `--color-base-X`
3. **Spacing with --base** - Always use multiples of `--base` for consistency
4. **Component-scoped variables** - Define local CSS variables for component-specific theming
5. **Standard transitions** - Use the cubic-bezier timing pattern
6. **Layer system** - Wrap styles in `@layer payload-default`
7. **Dark mode awareness** - Variables automatically adapt; test both themes
```
