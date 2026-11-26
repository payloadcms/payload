# @payloadcms/codemod

CLI for auto-migrating Payload projects across deprecations. Initial target: v3 -> v4.

## Usage

Run against your project root:

```bash
npx @payloadcms/codemod [path]
```

With no arguments, runs every registered transform against the current directory. Transforms are idempotent and no-op on code that doesn't match their pattern, so running the full set against a partially migrated project is safe.

### Flags

- `--transform <name>`: run a single transform by name.
- `--list`: print registered transforms.
- `--dry`: analyze only; write nothing.
- `--print`: print transformed sources to stdout instead of writing.
- `-h`, `--help`: print usage for all commands and exit. Works on any command, e.g. `upgrade run --help`.

## `upgrade` command

Run from the Payload project root. All three verbs detect the installed Payload version (or an unambiguous declared major when dependencies are not installed), then offer the latest release within that major separately from the CLI's latest release channel. Prerelease targets are labelled explicitly. Use `--tag <version-or-dist-tag>` to choose a target directly; this is required without an interactive terminal.

The package preview uses the core publish list for packages released together. Independently versioned plugins resolve to their own published releases compatible with the selected Payload version. Unrelated dependencies and independent overrides are preserved. Unresolved compatibility, conflicting pins, or unsupported local references stop the upgrade before files change.

### `upgrade` (choose how to run it)

```bash
npx @payloadcms/codemod upgrade
```

After choosing and reviewing the target, hand the project-specific prompt to an installed coding agent (`claude` or `codex`), run the mechanical steps, or print the prompt. `--agent <claude|codex>` selects an agent directly. Without a terminal, an explicit target prints the prompt. `--dry` previews the package changes without starting an agent, installing, or writing files.

### `upgrade run` (install the selected releases)

```bash
npx @payloadcms/codemod upgrade run --tag <version-or-dist-tag>
```

A same-major update changes the selected packages and installs them with the detected package manager. It does not run v3 -> v4 source transforms or raise the v4 toolchain floors.

For a v3 -> v4 migration, the command also previews and writes the TypeScript, `@types/node`, and Node engine floors. It verifies installed package versions before applying source transforms, then reports the remaining manual migration steps and bundled migration guide. With npm, this transitional install uses `--legacy-peer-deps`; framework upgrades and final peer verification remain required. If installation or verification fails, the command restores its own manifest changes when safe. Dependencies and the lockfile can still be partly changed, so reinstall with the original manifest before retrying.

For Next.js projects, the mechanical slice does not upgrade Next.js. Follow the project-specific prompt and report to complete the Next.js 16 migration. Pre-upgrade migrations such as Slate -> Lexical must run while the project is still on v3.

Flags:

- `--tag <version-or-dist-tag>`: choose an exact Payload release or release channel.
- `--dry`: preview package and toolchain changes; write and install nothing.
- `--force`: skip the dirty-git-tree warning.
- `--yes`: skip upgrade confirmation after the preview. This does not select a target or bypass compatibility checks. CPA supplies it after you confirm the complete package and toolchain preview; generated follow-up commands retain it.

### `upgrade prompt` (print the plan and prompt)

```bash
npx @payloadcms/codemod upgrade prompt --tag <version-or-dist-tag>
```

Detects the project and reads registry metadata to print the package preview and a prompt for the selected target. It does not install dependencies, write project files, or start an agent. Same-major updates get an update prompt; v3 -> v4 migrations get the migration sequence and applicable framework steps.

The follow-up command pins the selected target and re-invokes this CLI. A published install emits `npx @payloadcms/codemod@<running-cli-version>` to retain the selected tooling release; a source checkout emits `node <bin>`. Set `PAYLOAD_CODEMOD_COMMAND` to override that token.

## How it works

The tool loads your project via [ts-morph](https://ts-morph.com/), using your `tsconfig.json` when present, otherwise globbing `**/*.{ts,tsx,js,jsx}` (excluding `node_modules`, `dist`, `.next`, `build`). Each registered transform is applied in order against the shared project; changes are saved at the end unless `--dry` or `--print` is passed.

## Transforms

- `migrate-list-view-select-api`: Removes `admin.enableListViewSelectAPI` from Collection Configs. The List View's Select API is the default in v4.
- `migrate-disabled-fields`: migrates `field.admin.disableListColumn`, `disableListFilter`, `disableGroupBy`, `disableBulkEdit` and their equivalents on `imageSize.admin` into the consolidated `disabled` object form.
- `migrate-displayed-field-value-args`: converts direct `getDisplayedFieldValue(cellData, field, i18n)` calls imported from `@payloadcms/ui/utilities/getDisplayedFieldValue` to the object argument form. Handles named, aliased, and namespace imports. Indirect references and unsupported argument shapes are reported for manual migration.
- `globals-components-edit`: Globals: rename `admin.components.elements` to `admin.components.edit` and hoist `Description` to top-level `admin.components.Description` to match Collection conventions.
- `migrate-force-select`: migrates `forceSelect: { ... }` on Collection/Global configs to a `select` function that augments the caller's `select` when present and returns `undefined` (preserving full-document reads) when not. Shallow values become a spread (`{ ...select, ... }`); nested values use `deepMergeSimple` from `payload/shared` (auto-imported) to preserve the previous deep-merge semantics. Non-literal values, sibling `select` already present, and unsupported member kinds are surfaced as notes for manual review.
- `migrate-field-component-types`: replaces field component aliases—including concrete fields, canonical generics, labels, descriptions, errors, diffs, and block row labels—with the corresponding props types wrapped in `React.FC`. Generic arguments are preserved. Explicit class components, re-exports, namespace references, and inline imports are left unchanged with notes for manual migration.
- `rename-diff-value-props`: renames the `comparisonValue` and `versionValue` props read by custom Diff components to `valueFrom` and `valueTo`. Detects components whose props are typed with a Diff type imported from `payload`, in either the v3 component form (`TextFieldDiffClientComponent`) or the props form (`TextFieldDiffClientProps`), including same-file type aliases and interfaces built from one. Renames destructured props (along with the local variables they declare, unless the new name is already taken), `props.comparisonValue` and `props['comparisonValue']` reads, and `TextFieldDiffClientProps['comparisonValue']` indexed access types. Untyped components are not detected; remaining old prop names in property positions (e.g. JSX attributes passed to other components) are surfaced as notes in files that import a Diff type.
- `migrate-block-references-to-blocks`: renames blocks field `blockReferences` configs to `blocks`, and removes a sibling `blocks: []` placeholder when present. If a non-empty `blocks` sibling already exists, the transform leaves the field untouched and surfaces a note for manual review.
- `migrate-hide-api-url`: migrates `admin.hideAPIURL: true` to `admin.components.views.edit.api.tab.condition: () => false` on collection and global configs.
- `migrate-aliased-exports`: rewrites imports of types and utilities that used to be re-exported from `@payloadcms/ui` and `@payloadcms/next/utilities` to their canonical sources in `payload` / `payload/shared`.
- `migrate-payload-request-creation`: renames named request-helper and admin-context imports from `payload` and `payload/internal`. Calls migrate only with a plain identifier payload and either `{}` or an initialized local `const` options identifier whose type exposes all seven old option properties (or is `any`). The generated argument captures payload first and forwards only `context`, `depth`, `fallbackLocale`, `locale`, `req`, `urlSuffix`, and `user` through getters, preserving inherited getters, read order, and async rejection behavior. Existing `CreateLocalReqOptions` named imports from `payload` become options-only usages of `Omit<CreatePayloadRequestArgs, 'payload'>`; relative/private imports of that internal type require manual migration. Unsupported shapes, type usages, and collisions leave the affected binding unchanged with notes.
- `migrate-admin-context-properties`: rewrites reads of `headers` and `languageCode`, removed from `AdminContext` in v4, to `req.headers` and `req.i18n.language` (`i18n.language` on `PartialAdminContext`). Covers `initAdminContext()` results (property access, destructures, and `const` bindings), parameters and variables typed as `AdminContext`, and `Pick<AdminContext, ...>` and `AdminContext['...']` types. Drops both arguments from `getRootLayoutData()` calls, then drops destructured bindings that are no longer read. Element access such as `context['headers']` and `Pick` types that only pick removed properties are left unchanged with notes. Run after `migrate-payload-request-creation`; the default run order handles this.
- `migrate-document-title-context`: migrates `title` and `setDocumentTitle` destructured from `useDocumentInfo()` to `useDocumentTitle()`. They were removed from `DocumentInfoContext` in v4 and now live on `DocumentTitleContext`.
- `migrate-sharp-to-transformer`: moves a top-level `sharp` dependency and per-collection Sharp-specific `upload` options (`resizeOptions`, `imageSizes`, `formatOptions`, `trimOptions`, `constructorOptions`, `withMetadata`, `crop`, `focalPoint`) into `sharpTransformer({ collections })`, registered under `upload.transformers`. Appends to an existing `transformers` array instead of overwriting it, and no-ops if a `sharpTransformer` call is already present. **Limitations:** only inline `buildConfig({...})` object literals and inline collection/`upload` object literals are migrated; a dynamic `collections` array, an externally-defined collection, or a non-inline `upload` object are left untouched with a note for manual review. A collection's `upload` object built from a spread (e.g. `upload: { ...sharedUploadConfig }`) is noted for manual review, since Sharp-specific fields hidden inside the spread aren't visible to the transform and are left un-migrated. Surfaces a note reminding you to install `@payloadcms/transformer-sharp` (`pnpm add @payloadcms/transformer-sharp`). The transform preserves AST structure but does not re-format output. Run `prettier --write` (or your project's formatter) after applying.
- `migrate-storage-adapters-to-config`: moves storage adapter factory calls (`s3Storage`, `gcsStorage`, `azureStorage`, `r2Storage`, `vercelBlobStorage`) from `plugins` to the new top-level `storage` array. Removes `plugins` if it becomes empty after the move. **Limitations:** aliased imports (e.g. `import { s3Storage as myS3 }`) are not detected; rename any aliases to the canonical factory name before running, or migrate those calls manually. The transform preserves AST structure but does not re-format output. Run `prettier --write` (or your project's formatter) after applying.
- `rename-storage-adapters-to-storage`: renames the top-level `storageAdapters` config property to `storage`. Skips any object that already has a `storage` property. Run this if you previously ran `migrate-storage-adapters-to-config` and need to update the property name.
- `migrate-azure-chunk-large-files`: removes the `chunkLargeFiles` option from `azureStorage` `clientUploads` config. Chunked client uploads are the default in v4, so the flag no longer exists; `clientUploads: { chunkLargeFiles: true }` collapses to `clientUploads: true`. Surfaces a note when `chunkLargeFiles: false` was removed, since v4 can no longer disable chunking (and its broader CORS requirements apply).
- `remove-storage-always-insert-fields`: removes the obsolete `alwaysInsertFields` option from inline `cloudStoragePlugin`, `azureStorage`, `gcsStorage`, `r2Storage`, `s3Storage`, and `vercelBlobStorage` configs. The `prefix` field is now always inserted. Aliased named imports are supported; indirect or spread options must be updated manually.
- `migrate-import-export-hooks`: migrates the deprecated `toCSV` and `fromCSV` field options in `custom['plugin-import-export']` to `hooks.beforeExport` and `hooks.beforeImport`. If a `hooks` object already exists it is merged into; if `hooks.beforeExport`/`hooks.beforeImport` already exist the deprecated sibling is dropped without overwriting. Review argument shapes after migration: `beforeExport` uses `siblingData` (not `row`) and `data` is the top-level document (previously `doc`).
- `migrate-db-types-subpath`: rewrites imports from the removed `/types` subpath exports of `@payloadcms/drizzle`, `@payloadcms/db-postgres`, `@payloadcms/db-sqlite`, `@payloadcms/db-vercel-postgres`, and `@payloadcms/db-d1-sqlite` to their main entry points. Also handles re-export declarations and `declare module` augmentations.
- `migrate-next-subpath-exports`: rewrites imports, re-exports, and string-literal component paths from the removed `@payloadcms/next/client`, `@payloadcms/next/rsc`, and `@payloadcms/next/templates` subpaths to their canonical `@payloadcms/ui` or `@payloadcms/ui/rsc` sources. After running, regenerate the import map with `payload generate:importmap`.
- `migrate-next-generate-viewport-export`: adds a `generateViewport` export to app router layout files that already use Payload's shared Next.js layout, preserving Next.js viewport behavior without touching custom viewport implementations.
- `migrate-lexical-is-html-element`: rewrites imports of the removed `isHTMLElement` utility from `@payloadcms/richtext-lexical` (and `/client`) to its canonical source, `lexical`, splitting it out of mixed imports and merging into an existing `lexical` import when present. Surfaces a note reminding you that `lexical` is now a required dependency (`pnpm add lexical`).
- `migrate-after-operation-read`: rewrites `operation === 'read'` checks inside collection `afterOperation` hooks to handle the `find` and `findByID` operations (the deprecated `'read'` value was removed). Handles `===`/`!==`/`==`/`!=` against a destructured (or aliased) or property-accessed `operation` argument. Leaves `beforeOperation` (which still uses `'read'`) untouched, and surfaces notes for non-inline hooks and `switch` statements that need manual review.
- `migrate-versions-default`: adds `versions: false` to every `CollectionConfig` or `GlobalConfig` object that does not already have a `versions` property. Preserves the previous opt-in behaviour now that `versions` defaults to `true` for both collections and globals. Detects the three common annotation forms: `: CollectionConfig`, `satisfies GlobalConfig`, and `as CollectionConfig`.
- `migrate-authorship-default`: adds `authorship: false` to every `CollectionConfig` or `GlobalConfig` object that does not already have an `authorship` property. Preserves the previous behaviour now that authorship tracking (`createdBy` / `updatedBy`) is enabled by default for both collections and globals. Detects the three common annotation forms: `: CollectionConfig`, `satisfies GlobalConfig`, and `as CollectionConfig`.
- `remove-versions-true`: removes the now-redundant `versions: true` property from `CollectionConfig` and `GlobalConfig` objects. Only removes the bare boolean `true`; object-form configs (e.g. `versions: { drafts: true }`) are left untouched.
- `add-override-access-true`: adds an explicit `overrideAccess: true` to Local API calls (`payload.find(...)`, `req.payload.create(...)`, `payload.jobs.run()`, and the rest) that omit it, preserving the Payload 3 default of skipping access control now that Payload 4 changes the default to `false`. Detection is syntactic so it works on JavaScript projects with no `tsconfig.json`. Deliberately never touches internal operations such as `findOperation(...)`, where a missing value meant `false` and inserting `true` would disable access control. Skips `resetPassword` (no destructuring default to preserve), calls whose argument object contains a spread, and non-Payload receivers. Review each inserted `true` and switch to `false` wherever the operation acts on behalf of a user.
- `remove-group-by-true`: removes `admin.groupBy` from `CollectionConfig` objects. The experimental `groupBy` flag has been removed; groupBy is now an always-available per-user UI preference.
- `remove-default-locale-publish-option`: removes `localization.defaultLocalePublishOption` from Payload configs. The Admin UI Publish button now always defaults to publishing the active locale when localized fields exist, with "Publish all locales" available as a secondary dropdown option. Surfaces a note when the removed value was `'all'`, since that combination previously changed the default and now has no config equivalent.
- `remove-localize-status-config`: removes `localizeStatus: true` from `versions.drafts` objects and `experimental.localizeStatus: true` from the root Payload config. Per-locale status is now automatic when localization is configured and localized fields exist; an explicit `localizeStatus: false` opt-out is preserved.
- `remove-publish-specific-locale`: removes `publishSpecificLocale` from `payload.update()` and `payload.updateGlobal()` call-site options. If the options object lacks a `locale` the property is renamed to `locale` so the same value is preserved; otherwise it is dropped.
- `rename-typescript-schema-to-json-schema`: renames the `typescriptSchema` field-config property to `jsonSchema` (it always accepted JSON Schema, not TypeScript). Skips any object that already defines a `jsonSchema` sibling and surfaces it as a note for manual review.
- `migrate-build-script`: rewrites the `build` npm script in `package.json` from `next build` to `payload build`, so the Import Map (and types) are generated before the Next.js build. Matches the `next build` invocation only (leaves `next build-storybook` and the like untouched) and is a no-op when `build` is already `payload build`.
- `migrate-slug-field`: converts the removed experimental `slugField()` helper (imported from `payload`) into the native `{ type: 'slug' }` field, mapping `useAsSlug`/`fieldToUse`, `slugify`, `required`, `localized`, `disableUnique` (→ `unique: false`), and `position` (→ `admin.position`), and dropping the obsolete `checkboxName`. Removes the now-unused `slugField` import. Calls using `overrides` (or other unrecognized options) are left in place with a note for manual migration.
- `rename-experimental-table-feature`: renames imports of `EXPERIMENTAL_TableFeature` from `@payloadcms/richtext-lexical` to `TableFeature` (the table feature is now stable) and updates all local usages, e.g. `EXPERIMENTAL_TableFeature()` call sites.

## Contributing

To add a transform:

1. Create `src/transforms/<name>/` with `index.ts` exporting a `Transform`.
2. Add fixtures as `<case>.input.ts` and `<case>.output.ts` siblings of `index.ts`.
3. Add `index.spec.ts` verifying both the fixture pair and idempotency (running the transform on the output produces the output unchanged).
4. Register in `src/registry.ts`.
5. Update the transform list in this README.

Ship the transform in the same PR as the deprecation it migrates.
