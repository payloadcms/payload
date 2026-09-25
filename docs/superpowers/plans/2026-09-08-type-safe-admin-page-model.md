# Type-safe Admin Page Model Implementation Plan

**Written with AI**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a schema-generated, type-safe Playwright Admin page model and migrate the Text field E2E suite to it.

**Architecture:** A focused generator converts selected collections from `SanitizedConfig` into a standalone literal `adminPageModel` module for the fields suite. A shared runtime factory maps that descriptor to root-scoped collection and field models while TypeScript mapped types provide completion and field-specific actions.

**Tech Stack:** TypeScript 6, Playwright 1.59.1, TSTyche 7.2.1, Vitest 4.1.6, Payload test configuration and generated types.

**Spec:** `docs/superpowers/specs/2026-09-08-type-safe-admin-page-model-design.md`

## Global Constraints

- Work only in `/Users/ppopus/projects/payload/core-codex/.worktrees/type-safe-admin-page-model` on `codex/type-safe-admin-page-model`.
- Write and run each failing test before its implementation.
- Keep code and documentation in US English.
- Do not hide or replace Playwright errors.
- Do not import full Payload server or React configuration into Playwright workers.
- Keep the utility in `test/__helpers/e2e/adminPageModel/`.
- Do not add a public Payload configuration option in this pull request.
- Include `Written with AI` in team-facing documents and pull request text.
- Do not commit, push, or open the pull request until the user gives a separate explicit instruction.

## Current Status

- Tasks 1-6 are implemented and covered by focused tests.
- The generated descriptor, public type tests, runtime tests, Text migration, nested array/block test, and relationship drawer test are complete.
- Final static checks and repeat verification are complete.
- The complete SQLite Text run has 19 passes, 1 skip, and 1 existing `hasMany not_in` filter failure.
- The focused relationship drawer run passes.
- The branch is intentionally uncommitted until the user approves the commit and pull request actions.

---

### Task 1: Generate a serializable Admin page-model descriptor

**Files:**

- Create: `test/__helpers/e2e/adminPageModel/types.ts`
- Create: `test/__helpers/e2e/adminPageModel/generate.ts`
- Create: `test/__helpers/e2e/adminPageModel/generate.int.spec.ts`
- Create: `test/fields/generateAdminPageModel.ts`
- Create: `test/fields/admin-page-model.generated.ts`

**Interfaces:**

- Produces: `createAdminPageModelSource(config, { collections })` and the descriptor types `AdminPageModelDescriptor`, `AdminCollectionDescriptor`, and `AdminFieldDescriptor`.
- Produces: generated `adminPageModel` for `array-fields`, `relationship-fields`, and `text-fields`.

- [x] **Step 1: Write the failing descriptor-generation tests**

Create a small evaluated-config fixture with scalar text, `hasMany` text, unnamed row fields, named group fields, arrays, blocks, and relationships. Assert literal output values rather than using the generator to build the expected result.

```ts
test('generates nested field and relationship metadata', () => {
  const descriptor = createAdminPageModelDescriptor(config, {
    collections: ['articles'],
  })

  expect(descriptor.collections.articles.fields).toEqual({
    title: { hasMany: false, path: 'title', type: 'text' },
    items: {
      fields: {
        labels: { hasMany: true, path: 'items.labels', type: 'text' },
      },
      path: 'items',
      type: 'array',
    },
  })
})
```

- [x] **Step 2: Run the test and verify the missing export fails**

Run: `pnpm exec vitest run --project int test/__helpers/e2e/adminPageModel/generate.int.spec.ts`

Expected: FAIL because `createAdminPageModelDescriptor` does not exist.

- [x] **Step 3: Implement recursive descriptor and module generation**

Implement field traversal with schema paths. Flatten unnamed layout fields, preserve named group and tab paths, preserve block slugs and labels, and emit relationship targets as string arrays. Runtime models will add array and block indexes to create instance paths.

```ts
export const createAdminPageModelSource = (
  config: SanitizedConfig,
  options: Options,
): string => {
  const descriptor = createAdminPageModelDescriptor(config, options)
  return `export const adminPageModel = ${JSON.stringify(descriptor, null, 2)} as const\n`
}
```

- [x] **Step 4: Run the generator tests and verify they pass**

Run: `pnpm exec vitest run --project int test/__helpers/e2e/adminPageModel/generate.int.spec.ts`

Expected: PASS.

- [x] **Step 5: Add and run the fields-suite generator**

Add `test/fields/generateAdminPageModel.ts`, then run:

`pnpm runts ./test/fields/generateAdminPageModel.ts`

Expected: `test/fields/admin-page-model.generated.ts` exports `adminPageModel` with `array-fields`, `relationship-fields`, and `text-fields`.

- [x] **Step 6: Prepare the descriptor generator checkpoint**

The files are ready for review. Commit them only after explicit user approval.

### Task 2: Define and verify the type-safe public API

**Files:**

- Create: `test/__helpers/e2e/adminPageModel/modelTypes.ts`
- Create: `test/__helpers/e2e/adminPageModel/types.spec.ts`
- Create: `test/__helpers/e2e/adminPageModel/index.ts`

**Interfaces:**

- Consumes: `AdminPageModelDescriptor` and generated `adminPageModel`.
- Produces: `PayloadAdmin<Model>`, `PayloadCollection<Model, Slug>`, `FieldsModel<Fields>`, `TextFieldModel`, `HasManyTextFieldModel`, `ArrayFieldModel`, `BlockFieldModel`, and `RelationshipFieldModel`.

- [x] **Step 1: Write failing TSTyche tests for collection and field completion**

```ts
declare const admin: PayloadAdmin<typeof adminPageModel>

const textFields = admin.collection('text-fields')
expect(textFields.fields.text).type.toBeAssignableTo<TextFieldModel>()
expect(textFields.fields.hasMany).type.toBeAssignableTo<HasManyTextFieldModel>()
expect(textFields.fields).type.not.toHaveProperty('disableListColumnText')
expect(admin.collection).type.not.toBeCallableWith('missing-collection')
```

- [x] **Step 2: Write failing TSTyche tests for arrays, blocks, and drawers**

```ts
expect(textFields.fields.array.addRow()).type.toBe<
  Promise<ArrayRowModel<unknown>>
>()
expect(textFields.fields.blocks.addBlock('blockWithText')).type.toBe<
  Promise<BlockRowModel<unknown>>
>()

const relationships = admin.collection('relationship-fields')
expect(
  relationships.fields.relationship.createInDrawer('text-fields'),
).type.toBe<Promise<PayloadCollection<typeof adminPageModel, 'text-fields'>>>()
expect(
  relationships.fields.relationship.createInDrawer,
).type.not.toBeCallableWith('users')
```

- [x] **Step 3: Run TSTyche and verify the missing types fail**

Run: `pnpm exec tstyche adminPageModel --root .`

Expected: FAIL because the public mapped types do not exist.

- [x] **Step 4: Implement the minimum mapped types**

Map descriptor discriminants to field model interfaces. Use the descriptor's literal collection keys, field keys, block keys, and relationship targets. Keep unsupported fields on a base locator model without high-level actions.

- [x] **Step 5: Run TSTyche and verify the API tests pass**

Run: `pnpm exec tstyche adminPageModel --root .`

Expected: PASS.

- [x] **Step 6: Prepare the type API checkpoint**

The files are ready for review. Commit them only after explicit user approval.

### Task 3: Build selector, navigation, and text field models

**Files:**

- Create: `test/__helpers/e2e/adminPageModel/selectors.ts`
- Create: `test/__helpers/e2e/adminPageModel/createPayloadAdmin.ts`
- Create: `test/__helpers/e2e/adminPageModel/collection.ts`
- Create: `test/__helpers/e2e/adminPageModel/fields/base.ts`
- Create: `test/__helpers/e2e/adminPageModel/fields/text.ts`
- Create: `test/__helpers/e2e/adminPageModel/runtime.int.spec.ts`

**Interfaces:**

- Consumes: mapped model types from Task 2.
- Produces: `createPayloadAdmin({ model, page, routes, serverURL })`.
- Produces: scalar text methods `fill`, `getValue`, and `expectValue` and `hasMany` methods `addValue`, `expectValues`, and `value(index)`.

- [x] **Step 1: Write failing URL and selector tests**

Assert hand-written expected strings for collection URLs, nested paths, scalar inputs, `hasMany` controls, headings, and cells.

```ts
expect(selectors.textInput('array.0.texts')).toBe('#field-array__0__texts')
expect(selectors.listHeading('i18nText')).toBe('#heading-i18nText')
expect(selectors.listCell('i18nText', 0)).toBe('.row-1 .cell-i18nText')
```

- [x] **Step 2: Run runtime tests and verify missing implementations fail**

Run: `pnpm exec vitest run --project int test/__helpers/e2e/adminPageModel/runtime.int.spec.ts`

Expected: FAIL because the selector and model functions do not exist.

- [x] **Step 3: Implement selector builders and collection navigation**

Use `formatAdminURL` for collection URLs. Scope all field locators through the collection model's root locator. Expose `wrapper`, `input`, `selectors`, `inputID`, `heading`, and `cell(index)`.

- [x] **Step 4: Implement text actions without wrapping Playwright failures**

`fill()` must call `input.fill(value)` directly. `getValue()` must call `input.inputValue()`. `expectValue()` must call Playwright's `expect(input, context).toHaveValue(value)`.

- [x] **Step 5: Run runtime and TSTyche tests**

Run:

```bash
pnpm exec vitest run --project int test/__helpers/e2e/adminPageModel/runtime.int.spec.ts
pnpm exec tstyche adminPageModel --root .
```

Expected: PASS.

- [x] **Step 6: Prepare the navigation and text-model checkpoint**

The files are ready for review. Commit them only after explicit user approval.

### Task 4: Add row, block, and error-context behavior

**Files:**

- Create: `test/__helpers/e2e/adminPageModel/errors.ts`
- Create: `test/__helpers/e2e/adminPageModel/fields/array.ts`
- Create: `test/__helpers/e2e/adminPageModel/fields/blocks.ts`
- Modify: `test/__helpers/e2e/adminPageModel/runtime.int.spec.ts`
- Modify: `test/fields/collections/Text/e2e.spec.ts`

**Interfaces:**

- Produces: `array.row(index)`, `array.addRow()`, `blocks.block(index, slug)`, and `blocks.addBlock(slug)`.
- Produces: `formatLocatorContext` for Playwright custom assertion messages.

- [x] **Step 1: Write failing runtime tests for row and block context text**

Use literal expected messages and cover zero rows, one row, five rows, and a mismatched block slug.

- [x] **Step 2: Write a failing Playwright test that checks the full row error**

On the Text create page, call `await textFields.fields.array.row(5)`, catch the error, and assert that it contains the standard Playwright locator assertion output plus:

```text
Could not resolve row 5 for "array".
Available rows: 0
Collection: text-fields
```

- [x] **Step 3: Run the focused Playwright test and verify the context is absent**

Run: `PORT=3010 pnpm test:e2e fields__collections__Text --workers=1 --grep "reports an out-of-range array row"`

Expected: FAIL because `row()` and its context do not exist.

- [x] **Step 4: Implement asynchronous row and block lookup**

Count current rows, then use a Playwright locator assertion with the formatted context. `addRow()` and `addBlock()` must record the old count, perform the UI action, assert the new count, and return the newly added typed row or block.

- [x] **Step 5: Run focused runtime, type, and Playwright tests**

Run:

```bash
pnpm exec vitest run --project int test/__helpers/e2e/adminPageModel/runtime.int.spec.ts
pnpm exec tstyche adminPageModel --root .
PORT=3010 pnpm test:e2e fields__collections__Text --workers=1 --grep "reports an out-of-range array row"
```

Expected: PASS.

- [x] **Step 6: Prepare the row, block, and error-handling checkpoint**

The files are ready for review. Commit them only after explicit user approval.

### Task 5: Add relationship drawer scoping

**Files:**

- Create: `test/__helpers/e2e/adminPageModel/fields/relationship.ts`
- Modify: `test/__helpers/e2e/adminPageModel/createPayloadAdmin.ts`
- Modify: `test/__helpers/e2e/adminPageModel/collection.ts`
- Modify: `test/__helpers/e2e/adminPageModel/runtime.int.spec.ts`
- Modify: `test/fields/collections/Relationship/e2e.spec.ts`

**Interfaces:**

- Produces: `relationship.createInDrawer(targetSlug)` returning a collection model scoped to the new document drawer.
- Produces: drawer collection methods `save()` and `close()`.

- [x] **Step 1: Write failing selector and scope tests**

Assert that a drawer collection model creates every field locator from the provided drawer root, not from `page`.

- [x] **Step 2: Write the failing relationship drawer E2E test**

Extend the existing inline relationship creation test. Create a `text-fields` document in its drawer, add a Text array row and `blockWithText` block, fill their nested `texts` fields, save and close the drawer, then save the relationship document.

- [x] **Step 3: Run the focused drawer test and verify the method is missing**

Run: `PORT=3011 pnpm test:e2e fields__collections__Relationship --workers=1 --grep "creates nested text data in a relationship drawer"`

Expected: FAIL because `createInDrawer()` is not implemented.

- [x] **Step 4: Implement typed drawer creation and root scoping**

Use the relationship descriptor's `relationTo` list to select the target. Wait for the top document drawer, construct the returned collection model with that drawer as its root, and implement drawer-local save and close actions.

- [x] **Step 5: Run focused runtime, type, and drawer tests**

Run:

```bash
pnpm exec vitest run --project int test/__helpers/e2e/adminPageModel/runtime.int.spec.ts
pnpm exec tstyche adminPageModel --root .
PORT=3011 pnpm test:e2e fields__collections__Relationship --workers=1 --grep "creates nested text data in a relationship drawer"
```

Expected: PASS.

- [x] **Step 6: Prepare the drawer-support checkpoint**

The files are ready for review. Commit them only after explicit user approval.

### Task 6: Migrate the complete Text E2E suite

**Files:**

- Modify: `test/fields/collections/Text/e2e.spec.ts`

**Interfaces:**

- Consumes: the generated `adminPageModel` and shared `createPayloadAdmin` factory.
- Removes: Text-suite dependency on `AdminUrlUtil` and raw selectors for generated fields.

- [x] **Step 1: Add `admin` and `textFields` setup in `beforeAll`**

Create the collection model after `page` and `serverURL` are initialized. Keep the existing shared page lifecycle.

- [x] **Step 2: Migrate create, list, heading, cell, label, description, and input access**

Replace field selectors with generated handles. Keep raw selectors only for controls that are not schema fields.

- [x] **Step 3: Run the non-filter Text tests**

Run: `PORT=3010 pnpm test:e2e fields__collections__Text --workers=1 --grep-invert "collection list view"`

Expected: all enabled non-filter tests pass except any recorded baseline environment failure that still occurs before migrated assertions.

- [x] **Step 4: Migrate scalar and `hasMany` text actions**

Use `fill`, `expectValue`, `addValue`, `value(index)`, and `expectValues`. Preserve the existing user behavior assertions.

- [x] **Step 5: Delete the stale `disableListColumnText` test**

The generated descriptor intentionally does not expose that removed field. Delete the test rather than adding a field that commit `270ac10fb4a3fb763f16f6cc0a96046ef95cf4f7` removed during list-view test consolidation.

- [x] **Step 6: Run the complete Text suite and compare it with baseline**

Run: `PORT=3010 pnpm test:e2e fields__collections__Text --workers=1`

Expected: no new failure compared with the recorded 12-pass, 1-skip, 7-failure baseline. If the Mongoose warning does not occur, all remaining enabled tests pass.

- [x] **Step 7: Prepare the Text-migration checkpoint**

The files are ready for review. Commit them only after explicit user approval.

### Task 7: Final verification and pull request preparation

**Files:**

- Modify: `docs/superpowers/specs/2026-09-08-type-safe-admin-page-model-design.md` only if implementation decisions changed.
- Verify: `test/fields/admin-page-model.generated.ts` is current and stable.

**Interfaces:**

- Verifies all interfaces from Tasks 1-6.

- [x] **Step 1: Regenerate the fields suite types and check for stable output**

Run `pnpm runts ./test/fields/generateAdminPageModel.ts` twice and compare the generated file after each run.

Expected: generation succeeds and produces identical output on the second run.

- [x] **Step 2: Run focused type and runtime tests**

Run:

```bash
pnpm exec tstyche adminPageModel --root .
pnpm exec vitest run --project int test/__helpers/e2e/adminPageModel/generate.int.spec.ts test/__helpers/e2e/adminPageModel/runtime.int.spec.ts
```

Expected: PASS.

- [x] **Step 3: Run the Text and drawer E2E coverage**

Run:

```bash
PORT=3010 pnpm test:e2e fields__collections__Text --workers=1
PORT=3011 pnpm test:e2e fields__collections__Relationship --workers=1 --grep "creates nested text data in a relationship drawer"
```

Result: the drawer test passes. The Text suite has 19 passes, 1 skip, and the existing SQLite `hasMany not_in` filter failure. No page-model test fails.

- [x] **Step 4: Run formatting, lint, and targeted TypeScript checks**

Run:

```bash
pnpm exec prettier --check test/__helpers/e2e/adminPageModel test/fields/generateAdminPageModel.ts test/fields/admin-page-model.generated.ts test/fields/adminPageModel.int.spec.ts test/fields/collections/Text/e2e.spec.ts test/fields/collections/Relationship/e2e.spec.ts docs/superpowers
pnpm exec eslint test/__helpers/e2e/adminPageModel test/fields/generateAdminPageModel.ts test/fields/adminPageModel.int.spec.ts
pnpm exec tsc --noEmit --project test/tsconfig.json --pretty false
```

Result: formatting, focused lint, TSTyche, and all changed-file TypeScript diagnostics pass. The full test TypeScript project still reports unrelated cross-suite configuration errors.

- [x] **Step 5: Review the branch diff and source state**

Run:

```bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
git log --oneline origin/main..HEAD
```

Expected: only planned files are present and no internal research-source file is staged.

- [ ] **Step 6: Prepare and open the draft pull request after approval**

Write a raw Markdown description with the visible label `Written with AI`. Summarize the generated descriptor, typed models, error guarantees, Text migration, drawer example, baseline failure, and verification commands. After explicit user approval, commit, push the branch, and create the draft pull request.

### Task 8: Add an independent list-document helper

**Files:**

- Create: `test/__helpers/e2e/openListDocument.ts`
- Modify: `test/fields/collections/Text/e2e.spec.ts`
- Modify: `docs/superpowers/specs/2026-09-08-type-safe-admin-page-model-design.md`

**Interfaces:**

- `openListDocument({ page })` opens the first document on the current collection list.
- `openListDocument({ index, page })` opens the document at a zero-based row index.
- `document(id).goto()` remains unchanged for direct navigation by ID.

- [x] **Step 1: Add Playwright coverage and confirm that it fails before implementation**

Add Text-suite coverage for the default first row, an explicit index, and an out-of-range index. Run the focused tests and confirm that they fail because `openListDocument` does not exist.

- [x] **Step 2: Implement the helper**

Select standard collection-list rows and their `.cell--linked` document links. Use Playwright assertions with added context. Do not catch or replace Playwright errors.

- [x] **Step 3: Run the focused Playwright tests**

Run: `PAYLOAD_DATABASE=sqlite SQLITE_URL=file:./payload.db PORT=3116 pnpm test:e2e fields__collections__Text --workers=1 --grep "list document"`

Result: 2 passed.

- [x] **Step 4: Run final formatting, lint, type, and diff checks**

Result: focused Prettier, ESLint, standalone TypeScript, TSTyche, and `git diff --check` all pass.
