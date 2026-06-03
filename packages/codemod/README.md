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

## How it works

The tool loads your project via [ts-morph](https://ts-morph.com/), using your `tsconfig.json` when present, otherwise globbing `**/*.{ts,tsx,js,jsx}` (excluding `node_modules`, `dist`, `.next`, `build`). Each registered transform is applied in order against the shared project; changes are saved at the end unless `--dry` or `--print` is passed.

## Transforms

- `migrate-list-view-select-api` — Removes `admin.enableListViewSelectAPI` from Collection Configs. The List View's Select API is the default in v4.
- `migrate-disabled-fields` — migrates `field.admin.disableListColumn`, `disableListFilter`, `disableGroupBy`, `disableBulkEdit` and their equivalents on `imageSize.admin` into the consolidated `disabled` object form.
- `globals-components-edit` — Globals: rename `admin.components.elements` to `admin.components.edit` and hoist `Description` to top-level `admin.components.Description` to match Collection conventions.
- `migrate-force-select` — migrates `forceSelect: { ... }` on Collection/Global configs to a `select` function that augments the caller's `select` when present and returns `undefined` (preserving full-document reads) when not. Shallow values become a spread (`{ ...select, ... }`); nested values use `deepMergeSimple` from `payload/shared` (auto-imported) to preserve the previous deep-merge semantics. Non-literal values, sibling `select` already present, and unsupported member kinds are surfaced as notes for manual review.
- `migrate-hide-api-url` — migrates `admin.hideAPIURL: true` to `admin.components.views.edit.api.tab.condition: () => false` on collection and global configs.
- `migrate-aliased-exports` — rewrites imports of types and utilities that used to be re-exported from `@payloadcms/ui` and `@payloadcms/next/utilities` to their canonical sources in `payload` / `payload/shared`.
- `migrate-document-title-context` — migrates `title` and `setDocumentTitle` destructured from `useDocumentInfo()` to `useDocumentTitle()`. They were removed from `DocumentInfoContext` in v4 and now live on `DocumentTitleContext`.
- `migrate-storage-adapters-to-config` — moves storage adapter factory calls (`s3Storage`, `gcsStorage`, `azureStorage`, `r2Storage`, `vercelBlobStorage`, `uploadthingStorage`) from `plugins` to the new top-level `storage` array. Removes `plugins` if it becomes empty after the move. **Limitations:** aliased imports (e.g. `import { s3Storage as myS3 }`) are not detected; rename any aliases to the canonical factory name before running, or migrate those calls manually. The transform preserves AST structure but does not re-format output — run `prettier --write` (or your project's formatter) after applying.
- `rename-storage-adapters-to-storage` — renames the top-level `storageAdapters` config property to `storage`. Skips any object that already has a `storage` property. Run this if you previously ran `migrate-storage-adapters-to-config` and need to update the property name.
- `migrate-import-export-hooks` — migrates the deprecated `toCSV` and `fromCSV` field options in `custom['plugin-import-export']` to `hooks.beforeExport` and `hooks.beforeImport`. If a `hooks` object already exists it is merged into; if `hooks.beforeExport`/`hooks.beforeImport` already exist the deprecated sibling is dropped without overwriting. Review argument shapes after migration: `beforeExport` uses `siblingData` (not `row`) and `data` is the top-level document (previously `doc`).
- `migrate-db-types-subpath` — rewrites imports from the removed `/types` subpath exports of `@payloadcms/drizzle`, `@payloadcms/db-postgres`, `@payloadcms/db-sqlite`, `@payloadcms/db-vercel-postgres`, and `@payloadcms/db-d1-sqlite` to their main entry points. Also handles re-export declarations and `declare module` augmentations.
- `migrate-next-subpath-exports` — rewrites imports, re-exports, and string-literal component paths from the removed `@payloadcms/next/client`, `@payloadcms/next/rsc`, and `@payloadcms/next/templates` subpaths to their canonical `@payloadcms/ui` or `@payloadcms/ui/rsc` sources. After running, regenerate the import map with `payload generate:importmap`.
- `rename-typescript-schema-to-json-schema` — renames the `typescriptSchema` field-config property to `jsonSchema` (it always accepted JSON Schema, not TypeScript). Skips any object that already defines a `jsonSchema` sibling and surfaces it as a note for manual review.

## Contributing

To add a transform:

1. Create `src/transforms/<name>/` with `index.ts` exporting a `Transform`.
2. Add fixtures as `<case>.input.ts` and `<case>.output.ts` siblings of `index.ts`.
3. Add `index.spec.ts` verifying both the fixture pair and idempotency (running the transform on the output produces the output unchanged).
4. Register in `src/registry.ts`.
5. Update the transform list in this README.

Ship the transform in the same PR as the deprecation it migrates.
