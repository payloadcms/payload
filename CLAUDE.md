# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents

### [Project Structure](#project-structure-1)

- [Key Directories](#key-directories)
- [Architecture Notes](#architecture-notes)

### [Quick Start](#quick-start-1)

### [Build Commands](#build-commands-1)

### [Development](#development-1)

- [Coding Patterns and Best Practices](#coding-patterns-and-best-practices)
- [Running Dev Server](#running-dev-server)
- [Development Environment](#development-environment)

### [Testing](#testing-1)

- [Writing Tests - Required Practices](#writing-tests---required-practices)
- [How to run tests](#how-to-run-tests)
- [Test Structure](#test-structure)

### [Linting & Formatting](#linting--formatting-1)

### [Internationalization](#internationalization-1)

### [Commit & PR Guidelines](#commit--pr-guidelines-1)

- [PR Title Format](#pr-title-format)
- [Commit Guidelines](#commit-guidelines)

### [Additional Resources](#additional-resources-1)

### [Admin UI](#admin-ui-1)

- [Component Architecture](#component-architecture)
- [CSS Variables](#css-variables)
- [Component Styling Patterns](#component-styling-patterns)
- [Icons](#icons)
- [Best Practices](#best-practices)

### [Config-Defined Components & Server/Client Architecture](#config-defined-components--serverclient-architecture)

- [Server-to-Client Field Transformation](#server-to-client-field-transformation)
- [Import Map System](#import-map-system)
- [Form State Generation](#form-state-generation)
- [Client-Side Form Management](#client-side-form-management)
- [Field Component Implementation](#field-component-implementation)
- [Architecture Summary](#architecture-summary)

### [List View Architecture](#list-view-architecture)

- [Core Components](#core-components)
- [Provider System](#provider-system)
- [Data Flow](#data-flow-1)
- [Table Implementation](#table-implementation)
- [Column System](#column-system)
- [Bulk Operations](#bulk-operations)
- [Custom Cell Renderers](#custom-cell-renderers)

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

```ts
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

#### Component Architecture

##### File Structure

Standard component organization:

```
ComponentName/
├── index.tsx          # Main component implementation
├── index.scss         # Component styles (if needed)
├── types.ts           # Type definitions (if complex)
└── SubComponent/      # Nested components (if needed)
```

**Key conventions:**

- Use named exports only (no default exports)
- Client Components (75% of codebase) start with `'use client'` directive
- Server Components for static content, layout, data fetching
- Simple components can be single-file

**Export pattern:**

```ts
export const Button: React.FC<Props> = (props) => { ... }
export type Props = { ... }
```

##### React Patterns

**State Management:**

- **useState** - For local UI state only (toggles, visibility, hover states)
  - NOT for form data (use `useField` hook instead)
- **useReducer** - Rare, only for complex state machines (forms, bulk operations)
- **Context** - Primary mechanism for shared state across components
  - Use `use-context-selector` for performance-critical contexts
  - Split contexts by concern (Auth, Config, DocumentInfo, Form, etc.)

**useEffect - Use sparingly:**

```ts
// ✅ GOOD: External system sync (timers, subscriptions)
useEffect(() => {
  const timeout = setTimeout(callback, delay)
  return () => clearTimeout(timeout)
}, [delay])

// ✅ GOOD: Side effects on mount
useEffect(() => {
  void fetchData()
}, [])

// ❌ BAD: Derived state (use useMemo instead)
useEffect(() => {
  setDisplayValue(formatValue(value))
}, [value])

// ❌ BAD: Event propagation (use callbacks directly)
useEffect(() => {
  onValueChange(value)
}, [value])
```

**Action-based, not effect-based:**

- Prefer event handlers and callbacks over useEffect
- Let actions trigger changes directly
- Use `useMemo` for computed values
- Use `useCallback` for stable callback references

**Custom hooks:**

- Always start with `use*`
- Export as named exports
- Common hooks: `useField`, `useForm`, `useFormFields`, `useAuth`, `useConfig`
- Utility hooks: `useEffectEvent`, `useDebouncedEffect`, `useThrottledValue`

##### Component Composition

**Props pattern:**

```ts
// Single object parameter (preferred)
export const Component: React.FC<Props> = (props) => {
  const { field, path, readOnly } = props
  // Destructure after function signature
}

// Component injection via props
type Props = {
  Label?: React.ReactNode
  Description?: React.ReactNode
  Error?: React.ReactNode
  BeforeInput?: React.ReactNode
  AfterInput?: React.ReactNode
}
```

**Custom component rendering:**

```ts
// Use RenderCustomComponent helper
<RenderCustomComponent
  CustomComponent={Label}
  Fallback={<FieldLabel label={label} required={required} />}
/>
// Note: undefined renders Fallback, null renders nothing
```

**Provider pattern:**

```ts
// Compound components with context
<CollapsibleProvider isCollapsed={isCollapsed} toggle={toggle}>
  {children}
</CollapsibleProvider>

// Access via custom hook
const { isCollapsed, toggle } = useCollapsible()
```

##### Data Flow

**Event handling:**

```ts
// Simple: inline handlers
<button onClick={() => toggle()}>Toggle</button>

// Complex: named handlers
const handleClick = (event) => {
  event.preventDefault()
  onClick?.(event)
}

// Passed down: useCallback for stability
const handleSubmit = useCallback(async (data) => {
  await onSubmit(data)
}, [onSubmit])
```

**Context vs Props:**

- Use props for 1-2 levels deep, component-specific values
- Use context for app-wide state, deeply nested consumers

##### Form State Management (Document Views)

**Architecture:**

- Mainly used in "collection-edit", "global-edit" views/drawers
- Centralized form state via reducer pattern
- Performance-optimized with `use-context-selector` package
- All field state lives in form context, NOT local component state

**Core hooks:**

```ts
// In field components
const { setValue, value, showError } = useField<T>({
  path: 'fieldName',
  validate: memoizedValidate,
})

// Access form-level operations
const { submit, reset, getData } = useForm()

// Select specific fields for performance
const email = useFormFields(([fields]) => fields.email?.value)
```

**Key principles:**

- Pass values to `setValue(value)`, never events: `setValue(value)` not `setValue(event)`
- Field registration happens automatically via `useField`
- Validation runs on field blur and form submit
- Use `useFormFields` with selector to avoid unnecessary re-renders

**Field component pattern:**

```ts
'use client'

export const MyField: React.FC<Props> = (props) => {
  const { path, validate, required } = props

  const memoizedValidate = useCallback(
    (value, options) => validate(value, { ...options, required }),
    [validate, required]
  )

  const { setValue, value, showError, errorMessage } = useField({
    path,
    validate: memoizedValidate
  })

  const handleChange = (newValue) => {
    setValue(newValue)  // Dispatches to form reducer
  }

  return (
    <div>
      <input value={value} onChange={(e) => handleChange(e.target.value)} />
      {showError && <Error message={errorMessage} />}
    </div>
  )
}
```

##### Anti-Patterns to Avoid

1. **Don't use useEffect for derived state** - Use `useMemo` instead
2. **Don't mutate state directly** - Return new objects/arrays
3. **Don't pass events to setValue** - Pass values directly: `setValue(value)` not `setValue(event)`
4. **Don't use useEffect to watch prop changes** - Use callbacks in event handlers
5. **Don't add 'use client' unnecessarily** - Only when you need hooks, state, or events
6. **Don't use default exports** - Always use named exports
7. **Don't use interfaces for component props** - Use types (except when extending external types)

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
```

#### Best Practices

1. **Choose semantic elevation values** - Use based on purpose (background, border, text), not absolute lightness
2. **Use theme variables, not color primitives** - `--theme-elevation-X`, not `--color-base-X`
3. **Spacing with --base** - Always use multiples of `--base` for consistency
4. **Component-scoped variables** - Define local CSS variables for component-specific theming
5. **Standard transitions** - Use the cubic-bezier timing pattern
6. **Layer system** - Wrap styles in `@layer payload-default`
7. **Dark mode awareness** - Variables automatically adapt; test both themes

## Config-Defined Components & Server/Client Architecture

Understanding how Payload's server/client boundary works is critical for implementing UI features and working with config-defined components (components defined in the Payload config, plugins can add these as well as users).

### Server-to-Client Field Transformation

Server-side field configurations contain functions, hooks, and validation logic that cannot be serialized to the client. The `createClientField()` function strips server-only properties before sending field configs to the client.

**Server-Only Properties (Stripped):**

- `hooks`, `access`, `validate`, `defaultValue` (can be functions)
- `filterOptions` (relationship/select filters)
- `editor` (RichText config)
- `custom`, `dbName`, `enumName`, `graphQL`
- Admin properties: `condition`, `components` (converted separately)

**What Gets Sent to Client:**

- Field type, name, label (resolved if function)
- Admin UI config (className, placeholder, description if not a function)
- Validation constraints (minLength, maxLength, required) - values only, not functions
- Options for select/radio (with labels resolved)
- Nested field structures (recursively processed)

**Key Files:**

- [packages/payload/src/fields/config/client.ts](packages/payload/src/fields/config/client.ts) - `createClientField()`, `createClientFields()`, `createClientBlocks()`

### Import Map System

Payload uses an import map to handle component references across the server/client boundary.

**User Configuration:**

```ts
{
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        components: {
          Label: './MyCustomLabel.tsx#MyCustomLabel',
        },
      },
    },
  ]
}
```

**Build & Resolution:**

- Build process scans config for component references
- Generates import map in `.next/server`
- `getFromImportMap()` resolves string references to React components at runtime

**RenderServerComponent vs RenderCustomComponent:**

- **RenderServerComponent** - Server-side rendering, auto-detects RSC vs client components, passes server props (req, data, permissions) only to RSCs
- **RenderCustomComponent** - Client-side rendering, simpler, `undefined` renders Fallback, `null` renders nothing

**Key Files:**

- [packages/ui/src/elements/RenderServerComponent/index.tsx](packages/ui/src/elements/RenderServerComponent/index.tsx)
- [packages/payload/src/bin/generateImportMap/](packages/payload/src/bin/generateImportMap/)

### Form State Generation

When opening a document, `fieldSchemasToFormState()` transforms the database document into form state.

**Process:**

1. Collects field schemas, document data, permissions, preferences
2. `iterateFields()` walks each field: calculates initial value, runs validation (server-side), checks read access, optionally renders RSC components, recursively processes nested fields
3. Outputs `FormState` with structure: `{ fieldName: { value, initialValue, valid, errorMessage, passesReadAccess, customComponents } }`

**Dual Schema Maps:**

- **FieldSchemaMap** (server) - Full configs with functions, used during form state generation
- **ClientFieldSchemaMap** (client) - Stripped configs with rendered RSC components
- Both support path-based lookups: `schemaMap.get('arrayField.0.nestedField')`

**Key Concepts:**

- Server-side validation runs first, results included in form state
- Custom RSC components pre-rendered on server, included in form state
- Nested data maintains parent context through `fullData` vs `data` separation
- Read access checked per-field, stored in `passesReadAccess`

**Key Files:**

- [packages/ui/src/forms/fieldSchemasToFormState/index.tsx](packages/ui/src/forms/fieldSchemasToFormState/index.tsx)
- [packages/ui/src/forms/fieldSchemasToFormState/iterateFields.ts](packages/ui/src/forms/fieldSchemasToFormState/iterateFields.ts)
- [packages/ui/src/utilities/buildClientFieldSchemaMap/index.ts](packages/ui/src/utilities/buildClientFieldSchemaMap/index.ts)

### Client-Side Form Management

Form state on the client is managed through a reducer pattern with performance optimizations.

**Form Context:**

- **FormProvider** - Wraps document edit views, holds form state in reducer
- **use-context-selector** - Prevents unnecessary re-renders, components subscribe only to needed fields
- **useField()** - Primary interface for field components

**useField() Hook:**

```ts
const {
  setValue, // Dispatch value updates (pass values, never events)
  value, // Current field value
  showError, // Should error be shown (true after touch/submit)
  errorMessage, // Validation error
  customComponents, // Pre-rendered RSC components (Label, Description, Error, etc.)
  disabled, // Computed disabled state
  path, // Resolved field path
} = useField({
  path: 'fieldName',
  validate: memoizedValidate,
})
```

**Reading Other Fields:**

```ts
// Use selector to avoid re-renders
const email = useFormFields(([fields]) => fields.email?.value)
const { title, status } = useFormFields(([fields]) => ({
  title: fields.title?.value,
  status: fields.status?.value,
}))
```

**Form-Level Operations:**

```ts
const { submit, reset, getData, setModified, fields } = useForm()
```

**Critical:** Never use local `useState()` for field values. Form context is the single source of truth. Always use `useField()`.

**Key Files:**

- [packages/ui/src/forms/useField/index.tsx](packages/ui/src/forms/useField/index.tsx)
- [packages/ui/src/forms/Form/index.tsx](packages/ui/src/forms/Form/index.tsx)

### Field Component Implementation

Field components follow a consistent two-layer pattern.

**Server Config:**

```ts
// packages/payload/src/admin/fields/Text.ts
export const textFieldConfig = {
  Component: '@payloadcms/ui/fields/Text#TextField',
}
```

**Client Component:**

```ts
// packages/ui/src/fields/Text/index.tsx
'use client'

const TextFieldComponent: TextFieldClientComponent = (props) => {
  const { field, path: pathFromProps, readOnly, validate } = props

  // 1. Memoize validation with field-specific rules
  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, maxLength, minLength, required })
      }
    },
    [validate, minLength, maxLength, required]
  )

  // 2. Connect to form state
  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  })

  // 3. Render presentation component
  return (
    <TextInput
      Label={Label}
      value={value || ''}
      onChange={(e) => setValue(e.target.value)}
      readOnly={readOnly || disabled}
      showError={showError}
    />
  )
}

// 4. Wrap with withCondition for conditional logic support
export const TextField = withCondition(TextFieldComponent)
```

**Two-Component Pattern:**
Many fields split into:

- **index.tsx** - Smart component with `useField()`, validation memoization, form logic (`'use client'`)
- **Input.tsx** - Presentation component, UI only, no form state dependency

**Component Injection Points:**
Fields support custom components at multiple points:

- `Label`, `Description`, `Error` - Replace defaults
- `BeforeInput`, `AfterInput` - Content around input

**How Injection Works:**

1. User defines in config: `admin: { components: { Label: './CustomLabel.tsx#CustomLabel' } }`
2. Server renders as RSCs during form state generation with server props
3. Client receives pre-rendered via `useField()` as `customComponents`
4. Field renders with `RenderCustomComponent`

**Critical Patterns:**

**DO:**

- Always use `'use client'` directive
- Always wrap with `withCondition()`
- Always memoize validation with `useCallback()` including all field config dependencies
- Pass values to `setValue()`: `setValue(e.target.value)`
- Use `useField()` for all field state management

**DON'T:**

- Pass events to `setValue()`: ~~`setValue(event)`~~
- Use local `useState()` for field values
- Forget field config in validation memoization deps
- Use `useEffect` to watch value changes
- Access form state directly without `useField()` or `useFormFields()`

**Key Files:**

- [packages/ui/src/fields/](packages/ui/src/fields/) - All field component implementations
- [packages/payload/src/admin/fields/](packages/payload/src/admin/fields/) - Server-side field configs
- [packages/ui/src/forms/withCondition/index.tsx](packages/ui/src/forms/withCondition/index.tsx) - Conditional logic wrapper

### Architecture Summary

**Key Insight:** Payload pre-processes everything on the server (validation, permissions, component rendering) and ships results to the client, keeping the client lightweight and performant.

This architecture is crucial for:

- Implementing new field types
- Adding custom component support
- Debugging form state issues
- Understanding server vs client data availability
- Building performant UI components

## List View Architecture

The List View is the main collection browsing interface, displaying documents in a table with sorting, filtering, searching, column management, and bulk operations. Built on a provider-based architecture with clear separation of concerns.

### Core Components

**DefaultListView** ([packages/ui/src/views/List/index.tsx](packages/ui/src/views/List/index.tsx))

- Main client component orchestrating the entire list view
- Manages layout: header → list controls → table → pagination
- Wraps with three core providers: `TableColumnsProvider`, `SelectionProvider`, `RelationshipProvider`
- Handles bulk upload, trash view, collection-specific configurations

**Table** ([packages/ui/src/elements/Table/index.tsx](packages/ui/src/elements/Table/index.tsx))

- Presentational component rendering HTML table
- Receives pre-built `columns` with rendered cells
- Filters to show only `active` columns
- Maps through data; cells come pre-rendered from `column.renderedCells`

**ListControls** ([packages/ui/src/elements/ListControls/index.tsx](packages/ui/src/elements/ListControls/index.tsx))

- Toolbar above table with search, filters, column selector, sort, group-by
- Integrates: SearchBar, WhereBuilder, ColumnSelector, GroupByBuilder
- Dispatches changes through `ListQueryProvider` handlers

### Provider System

**ListQueryProvider** ([packages/ui/src/providers/ListQuery/index.tsx](packages/ui/src/providers/ListQuery/index.tsx))

- Manages query state (page, limit, sort, where, search, groupBy, columns)
- Key handlers: `handlePageChange`, `handlePerPageChange`, `handleSearchChange`, `handleSortChange`, `handleWhereChange`
- Core method: `refineListData(incomingQuery)` merges incoming query with current state
- Updates URL search params or calls `onQueryChange` callback
- Use via `useListQuery()` hook

**SelectionProvider** ([packages/ui/src/providers/Selection/index.tsx](packages/ui/src/providers/Selection/index.tsx))

- Manages row selection state for bulk operations
- Selection states: `None | AllInPage | AllAvailable | Some`
- Key methods:
  - `setSelection(id)` - toggles individual row
  - `toggleAll(allAvailable?)` - selects all on page or across all pages
  - `getQueryParams()` - generates query for bulk actions
  - `getSelectedIds()` - returns array of selected IDs
- Smart selection checks for locked documents
- Resets on query change

**TableColumnsProvider** ([packages/ui/src/providers/TableColumns/index.tsx](packages/ui/src/providers/TableColumns/index.tsx))

- Manages visible columns and their order
- Key methods:
  - `toggleColumn(accessor)` - toggles column visibility
  - `moveColumn({ fromIndex, toIndex })` - reorders columns
  - `setActiveColumns(columnNames)` - batch activate columns
  - `resetColumnsState()` - reverts to defaultColumns
- Changes persist via `refineListData` → URL search params
- Uses `React.useOptimistic` for instant UI feedback

### Data Flow

**Server → Client:**

```
1. Server computes: docs + columns (via buildColumnState) + permissions
2. Passes to DefaultListView as props
3. URL/query state passed as searchParams
```

**Client Rendering:**

```
1. parseSearchParams → ListQuery object
2. ListQueryProvider initializes with query state
3. TableColumnsProvider builds column metadata
4. SelectionProvider initializes empty selection
5. DefaultListView renders ListControls + Table
6. Any handler (search, sort, filter) → refineListData
   → mergeQuery → URL update → data re-fetch
```

**Example: User sorts by "Name"**

```
1. User clicks "Name" column heading (SortColumn)
2. Calls handleSortChange("name")
3. refineListData({ sort: "name" })
4. URL updates: ?sort=name
5. Server re-fetches docs sorted by "name"
6. New Table rendered with updated data
```

### Table Implementation

**Column Object Structure:**

```ts
type Column = {
  accessor: string // field path ("name", "status")
  active: boolean // whether column is visible
  field: ClientField // field definition with type, label
  CustomLabel?: React.Node // custom heading component
  Heading: React.Node // heading with SortColumn wrapper
  renderedCells: React.Node[] // pre-rendered cell JSX for each row
}
```

**buildColumnState** ([packages/ui/src/providers/TableColumns/buildColumnState/index.tsx](packages/ui/src/providers/TableColumns/buildColumnState/index.tsx))

- Server-side function constructing Column[] from collection config
- Process:
  1. Filters fields using permissions
  2. Places `id` field first, then `useAsTitle` field
  3. Sorts fields to match user's column preference
  4. Determines if column is active via `isColumnActive()`
  5. Renders all cells via `renderCell()` for active columns only
- Returns Column[] with rendered cells pre-computed

**renderCell** ([packages/ui/src/providers/TableColumns/buildColumnState/renderCell.tsx](packages/ui/src/providers/TableColumns/buildColumnState/renderCell.tsx))

- Pre-renders all cells at build time
- Cell priority:
  1. Custom field Cell component (`serverField.admin.components.Cell`)
  2. Field-specific cell (Array, Blocks, Date, Relationship, etc.)
  3. DefaultCell for basic rendering
- Linked column: First active column opens document on click
  - Override with `LinkedCellOverride` prop
  - Custom URLs via `formatDocURL()` hook

### Column System

**Configuration:**

Collection-level:

- `defaultColumns`: default visible columns (e.g., `['id', 'name', 'status']`)
- `listSearchableFields`: fields searched in search bar
- `enableQueryPresets`: save/load filter presets
- `groupBy`: field to group results by

Per-field:

- `admin.components.Label`: custom heading component
- `admin.components.Cell`: custom cell renderer
- `admin.className`: CSS class on cell wrapper
- `admin.disableListColumn`: hide field from column selector

### Custom Cell Renderers

**DefaultCell** ([packages/ui/src/elements/Table/DefaultCell/index.tsx](packages/ui/src/elements/Table/DefaultCell/index.tsx))

- Renders cell based on field type
- ID fields wrapped in CodeCell
- Converts value to display format via `getDisplayedFieldValue()`
- Wraps in Link (if linked column) or button (if onClick)
- Special handling for select/radio fields (adds `selected--{value}` class)

**Field-specific cells** ([packages/ui/src/elements/Table/DefaultCell/fields/](packages/ui/src/elements/Table/DefaultCell/fields/))

- Array, Blocks, Checkbox, Code, Date, File, JSON, Relationship, Select, Textarea
- Each renders preview/summary of field data

**RenderDefaultCell** ([packages/ui/src/providers/TableColumns/RenderDefaultCell/index.tsx](packages/ui/src/providers/TableColumns/RenderDefaultCell/index.tsx))

- Wrapper applying linked column behavior
- Provides cell props context via `useCellProps()` hook
- Enables custom cells to access column index, linked status

**Creating custom cell renderer:**

```ts
// In collection config
{
  name: 'status',
  type: 'select',
  admin: {
    components: {
      Cell: './CustomStatusCell.tsx#CustomStatusCell'
    }
  }
}

// In CustomStatusCell.tsx
export const CustomStatusCell: React.FC<DefaultCellComponentProps> = (props) => {
  const { cellData, rowData, field, collectionSlug } = props
  // Render custom cell JSX
  return <div className="custom-status">{cellData}</div>
}
```

### Bulk Operations

**ListSelection** ([packages/ui/src/views/List/ListSelection/index.tsx](packages/ui/src/views/List/ListSelection/index.tsx))

- Shows selection count and bulk action buttons
- Actions: EditMany, PublishMany, UnpublishMany, DeleteMany, RestoreMany
- "Select All" behavior:
  - Page-level: `toggleAll()` selects current page (`SelectAllStatus.AllInPage`)
  - Across pages: `toggleAll(true)` sets `SelectAllStatus.AllAvailable`
  - Bulk actions use `getQueryParams()` to target selection

### Key Patterns

1. **Query as source of truth** - Column visibility, sort, filters, pagination all in URL query params
2. **Pre-rendered cells** - Performance optimization; cells rendered once on server
3. **Provider nesting** - ListQuery → SelectionProvider → TableColumnsProvider (order matters)
4. **Optimistic updates** - Column changes use `React.useOptimistic` for instant feedback
5. **Smart reset** - Page resets to 1 when search/filter changes; selection clears on query change
6. **Linked column** - First visible column becomes clickable link to document
7. **Lazy cell rendering** - Only rendered if column is active

**Key Files:**

- [packages/ui/src/views/List/](packages/ui/src/views/List/) - Main list view component
- [packages/ui/src/elements/Table/](packages/ui/src/elements/Table/) - Table and cell components
- [packages/ui/src/elements/ListControls/](packages/ui/src/elements/ListControls/) - List controls toolbar
- [packages/ui/src/providers/ListQuery/](packages/ui/src/providers/ListQuery/) - Query state management
- [packages/ui/src/providers/Selection/](packages/ui/src/providers/Selection/) - Selection management
- [packages/ui/src/providers/TableColumns/](packages/ui/src/providers/TableColumns/) - Column management
