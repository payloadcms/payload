# @payloadcms/codemod

CLI for auto-migrating Payload projects across deprecations. Initial target: v3 -> v4.

## Usage

Run against your project root:

```bash
npx @payloadcms/codemod [path]
```

With no arguments, runs every registered transform against the current directory. Transforms are idempotent and no-op on code that doesn't match their pattern, so running the full set against a partially migrated project is safe.

### Flags

- `--transform <name>` — run a single transform by name.
- `--list` — print registered transforms.
- `--dry` — analyze only; write nothing.
- `--print` — print transformed sources to stdout instead of writing.

## `upgrade` command

The `upgrade` command has three verbs.

### `upgrade` (pick how to run it)

`npx @payloadcms/codemod upgrade` is the front door. It detects installed coding-agent CLIs
(`claude`, `codex`) and asks how you want to run the full v3 -> v4 upgrade, Next.js 16 included:

- Hand the orchestration prompt to a detected agent. The agent runs the whole sequence, calling
  `upgrade run` for the mechanical slice as one step.
- Just print the prompt to run it yourself or paste it elsewhere.

Pin an agent with `--agent <claude|codex>` to skip the picker. When there is no TTY (CI) or no
agent is installed, it prints the prompt instead of prompting.

### `upgrade run` (mechanical slice)

`npx @payloadcms/codemod upgrade run` performs the deterministic v3 -> v4 slice against the current
directory (run it from your project root):

1. Resolves the current Payload canary from the npm registry (override with `--tag <dist-tag>`).
2. Rewrites `package.json`: pins `payload` + every `@payloadcms/*` to that exact version in
   lockstep, removes dependency overrides pinning them, converts their carets to exact, and writes
   the TypeScript / `@types/node` / `engines.node` floors. The `@payloadcms/eslint-*` packages are
   versioned independently, so they are set to `latest` rather than lockstep-pinned.
3. Installs with your detected package manager.
4. Runs every registered transform against the now-v4 tree.
5. Prints a report and points you at the bundled runbook for the rest.

It does NOT upgrade Next.js. Payload v4 requires Next 16; run Next's own recommended agent
workflow (linked from the bundled runbook) to bump Next and migrate the code together. The report
prints the required Next target.

Flags:

- `--tag <dist-tag>` — dist-tag to resolve Payload versions from (default `canary`).
- `--dry` — preview the `package.json` changes and planned steps; write and install nothing.
- `--force` — skip the dirty-git-tree warning.

### `upgrade prompt` (print the prompt)

`npx @payloadcms/codemod upgrade prompt` prints the orchestration prompt to stdout and exits. It is
offline and stateless: it writes nothing and makes no network calls. The text is project-agnostic,
so pipe it to any agent and run it from the project root. This is the same prompt the `upgrade`
picker hands off, minus the detection and spawn.

The prompt sequences the upgrade (mechanical slice via `upgrade run`, then Next.js via Next's own
codemods and agent workflow, then regeneration, judgment work, and verification) and points at the
bundled runbook and migration guide for detail rather than restating them.

## How it works

The tool loads your project via [ts-morph](https://ts-morph.com/), using your `tsconfig.json` when present, otherwise globbing `**/*.{ts,tsx,js,jsx}` (excluding `node_modules`, `dist`, `.next`, `build`). Each registered transform is applied in order against the shared project; changes are saved at the end unless `--dry` or `--print` is passed.

## Transforms

- `migrate-list-view-select-api` — Removes `admin.enableListViewSelectAPI` from Collection Configs. The List View's Select API is the default in v4.
- `migrate-disabled-fields` — migrates `field.admin.disableListColumn`, `disableListFilter`, `disableGroupBy`, `disableBulkEdit` and their equivalents on `imageSize.admin` into the consolidated `disabled` object form.
- `globals-components-edit` — Globals: rename `admin.components.elements` to `admin.components.edit` and hoist `Description` to top-level `admin.components.Description` to match Collection conventions.
- `migrate-force-select` — migrates `forceSelect: { ... }` on Collection/Global configs to a `select` function that augments the caller's `select` when present and returns `undefined` (preserving full-document reads) when not. Shallow values become a spread (`{ ...select, ... }`); nested values use `deepMergeSimple` from `payload/shared` (auto-imported) to preserve the previous deep-merge semantics. Non-literal values, sibling `select` already present, and unsupported member kinds are surfaced as notes for manual review.
- `migrate-block-references-to-blocks` — renames blocks field `blockReferences` configs to `blocks`, and removes a sibling `blocks: []` placeholder when present. If a non-empty `blocks` sibling already exists, the transform leaves the field untouched and surfaces a note for manual review.
- `migrate-hide-api-url` — migrates `admin.hideAPIURL: true` to `admin.components.views.edit.api.tab.condition: () => false` on collection and global configs.
- `migrate-aliased-exports` — rewrites imports of types and utilities that used to be re-exported from `@payloadcms/ui` and `@payloadcms/next/utilities` to their canonical sources in `payload` / `payload/shared`.
- `migrate-document-title-context` — migrates `title` and `setDocumentTitle` destructured from `useDocumentInfo()` to `useDocumentTitle()`. They were removed from `DocumentInfoContext` in v4 and now live on `DocumentTitleContext`.
- `migrate-storage-adapters-to-config` — moves storage adapter factory calls (`s3Storage`, `gcsStorage`, `azureStorage`, `r2Storage`, `vercelBlobStorage`) from `plugins` to the new top-level `storage` array. Removes `plugins` if it becomes empty after the move. **Limitations:** aliased imports (e.g. `import { s3Storage as myS3 }`) are not detected; rename any aliases to the canonical factory name before running, or migrate those calls manually. The transform preserves AST structure but does not re-format output — run `prettier --write` (or your project's formatter) after applying.
- `rename-storage-adapters-to-storage` — renames the top-level `storageAdapters` config property to `storage`. Skips any object that already has a `storage` property. Run this if you previously ran `migrate-storage-adapters-to-config` and need to update the property name.
- `migrate-azure-chunk-large-files` — removes the `chunkLargeFiles` option from `azureStorage` `clientUploads` config. Chunked client uploads are the default in v4, so the flag no longer exists; `clientUploads: { chunkLargeFiles: true }` collapses to `clientUploads: true`. Surfaces a note when `chunkLargeFiles: false` was removed, since v4 can no longer disable chunking (and its broader CORS requirements apply).
- `migrate-import-export-hooks` — migrates the deprecated `toCSV` and `fromCSV` field options in `custom['plugin-import-export']` to `hooks.beforeExport` and `hooks.beforeImport`. If a `hooks` object already exists it is merged into; if `hooks.beforeExport`/`hooks.beforeImport` already exist the deprecated sibling is dropped without overwriting. Review argument shapes after migration: `beforeExport` uses `siblingData` (not `row`) and `data` is the top-level document (previously `doc`).
- `migrate-db-types-subpath` — rewrites imports from the removed `/types` subpath exports of `@payloadcms/drizzle`, `@payloadcms/db-postgres`, `@payloadcms/db-sqlite`, `@payloadcms/db-vercel-postgres`, and `@payloadcms/db-d1-sqlite` to their main entry points. Also handles re-export declarations and `declare module` augmentations.
- `migrate-next-subpath-exports` — rewrites imports, re-exports, and string-literal component paths from the removed `@payloadcms/next/client`, `@payloadcms/next/rsc`, and `@payloadcms/next/templates` subpaths to their canonical `@payloadcms/ui` or `@payloadcms/ui/rsc` sources. After running, regenerate the import map with `payload generate:importmap`.
- `migrate-next-generate-viewport-export` — adds a `generateViewport` export to app router layout files that already use Payload's shared Next.js layout, preserving Next.js viewport behavior without touching custom viewport implementations.
- `migrate-lexical-is-html-element` — rewrites imports of the removed `isHTMLElement` utility from `@payloadcms/richtext-lexical` (and `/client`) to its canonical source, `lexical`, splitting it out of mixed imports and merging into an existing `lexical` import when present. Surfaces a note reminding you that `lexical` is now a required dependency (`pnpm add lexical`).
- `migrate-after-operation-read` — rewrites `operation === 'read'` checks inside collection `afterOperation` hooks to handle the `find` and `findByID` operations (the deprecated `'read'` value was removed). Handles `===`/`!==`/`==`/`!=` against a destructured (or aliased) or property-accessed `operation` argument. Leaves `beforeOperation` (which still uses `'read'`) untouched, and surfaces notes for non-inline hooks and `switch` statements that need manual review.
- `migrate-versions-default` — adds `versions: false` to every `CollectionConfig` or `GlobalConfig` object that does not already have a `versions` property. Preserves the previous opt-in behaviour now that `versions` defaults to `true` for both collections and globals. Detects the three common annotation forms: `: CollectionConfig`, `satisfies GlobalConfig`, and `as CollectionConfig`.
- `remove-versions-true` — removes the now-redundant `versions: true` property from `CollectionConfig` and `GlobalConfig` objects. Only removes the bare boolean `true`; object-form configs (e.g. `versions: { drafts: true }`) are left untouched.
- `remove-group-by-true` — removes `admin.groupBy` from `CollectionConfig` objects. The experimental `groupBy` flag has been removed; groupBy is now an always-available per-user UI preference.
- `rename-typescript-schema-to-json-schema` — renames the `typescriptSchema` field-config property to `jsonSchema` (it always accepted JSON Schema, not TypeScript). Skips any object that already defines a `jsonSchema` sibling and surfaces it as a note for manual review.
- `migrate-build-script` — rewrites the `build` npm script in `package.json` from `next build` to `payload build`, so the Import Map (and types) are generated before the Next.js build. Matches the `next build` invocation only (leaves `next build-storybook` and the like untouched) and is a no-op when `build` is already `payload build`.
- `migrate-slug-field` — converts the removed experimental `slugField()` helper (imported from `payload`) into the native `{ type: 'slug' }` field, mapping `useAsSlug`/`fieldToUse`, `slugify`, `required`, `localized`, `disableUnique` (→ `unique: false`), and `position` (→ `admin.position`), and dropping the obsolete `checkboxName`. Removes the now-unused `slugField` import. Calls using `overrides` (or other unrecognized options) are left in place with a note for manual migration.
- `rename-experimental-table-feature` — renames imports of `EXPERIMENTAL_TableFeature` from `@payloadcms/richtext-lexical` to `TableFeature` (the table feature is now stable) and updates all local usages, e.g. `EXPERIMENTAL_TableFeature()` call sites.

## Contributing

To add a transform:

1. Create `src/transforms/<name>/` with `index.ts` exporting a `Transform`.
2. Add fixtures as `<case>.input.ts` and `<case>.output.ts` siblings of `index.ts`.
3. Add `index.spec.ts` verifying both the fixture pair and idempotency (running the transform on the output produces the output unchanged).
4. Register in `src/registry.ts`.
5. Update the transform list in this README.

Ship the transform in the same PR as the deprecation it migrates.
