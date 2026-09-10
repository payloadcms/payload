# Type-safe Admin Page Model Design

**Written with AI**

## Goal

Create a shared Playwright utility that derives collection, field, nested row, block, and relationship drawer types from Payload's evaluated configuration. Use the Text field E2E suite as the first full migration.

## Scope

The first pull request will:

- Generate an Admin page-model descriptor in a separate TypeScript module from the evaluated test configuration.
- Generate descriptors for `text-fields`, `relationship-fields`, and the polymorphic relationship target `array-fields` in the fields test suite.
- Add the utility in `test/__helpers/e2e/adminPageModel/`.
- Add TSTyche tests for the public type surface.
- Add focused runtime and Playwright tests for selectors, row and block lookup, value assertions, and error output.
- Migrate the Text E2E suite from `AdminUrlUtil` and raw field selectors.
- Add one relationship drawer test that edits Text data inside an array and a block.
- Remove the stale Text-suite test for `disableListColumnText`, which is absent from the Text schema.

It will not add a public Payload configuration option or migrate other suites.

## Generated descriptor

`createAdminPageModelSource` will receive the evaluated `SanitizedConfig` and return a standalone module that exports a plain `adminPageModel` constant. Keeping the descriptor separate from `payload-types.ts` prevents an Admin test helper change from rewriting unrelated generated database types.

The fields suite will generate the module explicitly:

```ts
const sanitizedConfig = await config

const source = createAdminPageModelSource(sanitizedConfig, {
  collections: ['array-fields', 'relationship-fields', 'text-fields'],
})

await writeFile(
  'admin-page-model.generated.ts',
  await format(source, prettierOptions),
)
```

The generated value will contain only serializable test metadata:

```ts
export const adminPageModel = {
  collections: {
    'text-fields': {
      fields: {
        text: { hasMany: false, path: 'text', type: 'text' },
        array: {
          fields: {
            texts: { hasMany: true, path: 'array.texts', type: 'text' },
          },
          path: 'array',
          type: 'array',
        },
        blocks: {
          blocks: {
            blockWithText: {
              fields: {
                texts: { hasMany: true, path: 'blocks.texts', type: 'text' },
              },
              label: 'Block With Text',
              slug: 'blockWithText',
            },
          },
          path: 'blocks',
          type: 'blocks',
        },
      },
      slug: 'text-fields',
    },
  },
} as const
```

Unnamed rows, tabs, and collapsible fields will expose their named children at the parent level. Named groups and tabs will retain their data-path segment. Unsupported field types will retain their type, path, and relationship targets so the model can provide locators without claiming unsupported high-level actions.

## Public API

Suite setup will create the Admin model once after the shared page is initialized:

```ts
let admin: PayloadAdmin<typeof adminPageModel>
let textFields: PayloadCollection<typeof adminPageModel, 'text-fields'>

beforeAll(async ({ browser }, testInfo) => {
  ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  const context = await browser.newContext()
  ;({ page } = await initPage({ context, serverURL }))

  admin = createPayloadAdmin({ model: adminPageModel, page, serverURL })
  textFields = admin.collection('text-fields')
})
```

The collection object will replace `AdminUrlUtil` for normal collection navigation:

```ts
await textFields.create.goto()
await textFields.list.goto()
await textFields.document(documentID).goto()
```

Opening a document from the current list will remain an independent helper. It will use a zero-based index and default to the first row:

```ts
await textFields.list.goto()
await openListDocument({ page })

await textFields.list.goto()
await openListDocument({ index: 2, page })
```

This helper will not replace `document(id).goto()`. Direct navigation by ID remains on the collection model.

Text fields will expose typed actions, assertions, and raw access:

```ts
await textFields.fields.text.fill('Example')
await textFields.fields.text.expectValue('Example')
const value = await textFields.fields.text.getValue()

textFields.fields.text.wrapper
textFields.fields.text.input
textFields.fields.text.selectors.wrapper
textFields.fields.text.selectors.input
textFields.fields.text.inputID
```

`wrapper` and `input` are Playwright `Locator` objects. `selectors` contains the exact selector strings used to create them. `inputID` is present only when the field adapter can guarantee a stable ID. Custom controls will not claim a stable input ID.

List-view access will remain close to Playwright:

```ts
await expect(textFields.fields.text.cell(0)).toHaveText('Example')
await expect(textFields.fields.text.heading).toBeVisible()
```

## Arrays and blocks

Lookup functions are asynchronous because selecting an item is also an assertion that it exists:

```ts
const existingRow = await textFields.fields.array.row(0)
const newRow = await textFields.fields.array.addRow()

await newRow.fields.texts.addValue('Array value')
await newRow.fields.texts.expectValues(['Array value'])
```

Blocks use the block slug as a type discriminator:

```ts
const existingBlock = await textFields.fields.blocks.block(0, 'blockWithText')
const newBlock = await textFields.fields.blocks.addBlock('blockWithText')

await newBlock.fields.texts.addValue('Block value')
```

`block(index, slug)` will first assert that the index exists, then assert that the rendered block matches the requested slug. It will return a model whose fields are limited to that block type.

## Relationship drawers and modal scope

A schema-backed drawer returns a collection model scoped to the drawer root. All child selectors start from that root, so a field behind the drawer cannot match a field inside it.

```ts
const relationshipFields = admin.collection('relationship-fields')
const textDrawer =
  await relationshipFields.fields.relationship.createInDrawer('text-fields')

await textDrawer.fields.text.fill('Drawer document')
await textDrawer.save()
await textDrawer.close()
```

For a single-target relationship, the target slug argument is optional and inferred. For a polymorphic relationship, TypeScript requires one of the configured `relationTo` slugs.

General modals that do not render a Payload document are outside the generated field model. They can receive small hand-written models later.

## Error contract

The utility must not replace useful Playwright errors.

- Direct actions such as `fill()` and `click()` will not catch errors. The original Playwright error will propagate.
- `save()` will observe matching failed API responses instead of waiting only for successful responses. The following Playwright assertion remains responsible for reporting the visible result.
- `row()`, `block()`, and `value()` will use Playwright assertions with custom messages. The normal expected value, received value, locator, call log, and stack will remain in the error.
- `openListDocument()` will use the same pattern when the requested list row does not exist. Its context will include the current URL, requested index, available row count, and valid index range.
- The custom message will add the collection slug, field path, scope, selector, requested index, available count, and valid index range.
- If counting or locating fails before the custom assertion, the original error will propagate without wrapping.

An out-of-range row error will include information equivalent to:

```text
Could not resolve row 5 for "array".
Collection: text-fields
Scope: document drawer
Field path: array
Available rows: 5
Valid indexes: 0-4
```

Tests will catch the failure and verify that both the additional context and Playwright's standard assertion details are present.

## Selector contract

The first migration will adapt the selectors already used by the fields suite:

- Scalar text input: `#field-${instancePath}`.
- Text `hasMany` control: `.field-${instancePath}`.
- Array and blocks wrapper: `#field-${instancePath}`.
- Array row: the direct `.array-field__row` descendants of the array wrapper.
- Block row: the direct `.blocks-field__row` descendants of the blocks wrapper.
- List heading: `#heading-${schemaPath}`.
- List cell: `.row-${oneBasedRow} .cell-${schemaPath}`.

Paths will replace dots with double underscores where the current Admin UI does so. Each field model will expose its wrapper and input selectors as strings and locators.

The migration will record controls for which a stable wrapper cannot be derived. A later change can add `data-payload-field-path` and `data-payload-field-schema-path` to field wrappers. That DOM change is not part of this pull request.

## Test strategy

TSTyche tests will prove:

- Collection slug completion and rejection of unknown slugs.
- Field property completion and rejection of removed fields.
- Scalar and `hasMany` text actions.
- Nested array row fields.
- Block slug narrowing.
- Relationship target narrowing and drawer return types.
- Optional input IDs on controls without a guaranteed ID.

Focused runtime tests will prove descriptor generation, selector construction, path handling, URL construction, and custom error context.

Playwright tests in the fields suite will prove:

- `openListDocument()` opens the first document by default and supports an explicit zero-based index.
- An out-of-range list-document lookup retains Playwright's assertion details and adds the available row count and valid index range.
- Original Playwright assertion details remain present after a failed row lookup.
- The extra row count and field context are present.
- `addRow()` returns the new row.
- `addBlock()` returns the selected block.
- A Text document can be edited through a relationship drawer with array and block values.

The unchanged baseline on 8 September 2026 produced 12 passes, 1 skip, and 7 failures. The first failure was an existing Mongoose deprecation warning treated as a browser console error; later filter tests ended early. Final verification will report this baseline separately from failures introduced by the branch.

## Research basis

This design follows the current guidance from the primary project documentation:

- [Playwright page object models](https://playwright.dev/docs/pom) recommend a higher-level application API that keeps selectors in one place.
- [Playwright locators](https://playwright.dev/docs/locators) resolve the current DOM element for every action and support narrowing from an existing locator. This supports live row models and drawer-root scoping.
- [Playwright assertions](https://playwright.dev/docs/test-assertions) support custom messages while retaining auto-retrying locator assertions and their normal call logs.
- [TypeScript mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html), [`keyof`](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html), and [`const` assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions) provide the literal collection, field, block, and relationship target keys used for completion and rejection tests.
- [Payload configuration](https://payloadcms.com/docs/configuration/overview) defines `SanitizedConfig` as the fully evaluated configuration, while the [field overview](https://payloadcms.com/docs/fields/overview) explains that fields define both stored document structure and generated Admin UI. The generator therefore reads the evaluated field configuration instead of database result types.

Playwright recommends user-facing locators or explicit test contracts over DOM-dependent CSS. This first migration must use existing field path classes and IDs because they are the Admin UI contract already available from the schema. A later Admin UI change can add dedicated field-path test attributes without changing the page-model API.

## Migration result

The Text E2E suite will keep one `textFields` model created in `beforeAll`. Tests will use collection navigation and generated field handles. Raw locators will remain only for UI that is not represented by the Payload field schema, such as the custom schema-path component, bulk-edit controls, and list-filter controls.
