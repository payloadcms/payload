# Path Builder Utility

A fluent, type-safe API for building field paths in Payload CMS.

## Overview

Payload uses two types of paths:

- **Data Path (`path`)**: Accesses actual data values, includes array indices (e.g., `content.0.title`)
- **Schema Path (`schemaPath`)**: Accesses field schemas, uses block slugs and `_index-` notation for unnamed layout fields (e.g., `content.heroBlock.title` or `_index-0-1.field`)

## Installation

```ts
import { getPathBuilder } from 'payload'
```

## Basic Usage

### Simple Fields

```ts
const { path, schemaPath } = getPathBuilder().text('title').build()
// Result: { path: 'title', schemaPath: 'title' }
```

### Nested Fields

```ts
const { path, schemaPath } = getPathBuilder().group('hero').richText('description').build()
// Result: { path: 'hero.description', schemaPath: 'hero.description' }
```

### Terminal vs Nesting Fields

Only certain fields allow nesting:

```ts
// ✅ Valid: group, tabs/tab, collapsible, row, array, blocks allow nesting
getPathBuilder().group('hero').text('title').build()

// ❌ Invalid: text, number, etc. are terminal - only .build() allowed
getPathBuilder().text('hero').text('title') // TypeScript error!
```

**Nesting-capable fields**: `group`, `tabs`/`tab`, `collapsible`, `row`, `array`, `blocks`

**Terminal fields**: `text`, `textarea`, `richText`, `number`, `date`, `checkbox`, `select`, `radio`, `code`, `json`, `point`, `relationship`, `upload`

## Entity Context (Optional)

Use `withEntity: true` to include collection/global context:

```ts
const { path, schemaPath } = getPathBuilder({ withEntity: true })
  .collections('pages')
  .id(123) // or .noId()
  .text('title')
  .build()
// Result: { path: 'title', schemaPath: 'title' }
```

```ts
const { path, schemaPath } = getPathBuilder({ withEntity: true })
  .globals('settings')
  .text('siteName')
  .build()
// Result: { path: 'siteName', schemaPath: 'siteName' }
```

Without `withEntity`, start directly with fields:

```ts
const { path, schemaPath } = getPathBuilder().group('hero').text('title').build()
```

## Array Fields

### With Index

```ts
const { path, schemaPath } = getPathBuilder().array('items').index(2).text('name').build()
// Result:
// {
//   path: 'items.2.name',      // includes index
//   schemaPath: 'items.name'   // no index
// }
```

### Without Index (Schema Only)

```ts
const { path, schemaPath } = getPathBuilder().array('items').noIndex().text('name').build()
// Result: { path: 'items.name', schemaPath: 'items.name' }
```

## Blocks Fields

Blocks use slugs in schema paths but numeric indices in data paths.

```ts
const { path, schemaPath } = getPathBuilder()
  .blocks('content')
  .block('heroBlock')
  .index(0)
  .text('title')
  .build()
// Result:
// {
//   path: 'content.0.title',              // numeric index
//   schemaPath: 'content.heroBlock.title' // block slug
// }
```

### Without Index

```ts
const { path, schemaPath } = getPathBuilder()
  .blocks('content')
  .block('heroBlock')
  .noIndex()
  .richText('body')
  .build()
// Result:
// {
//   path: 'content.body',
//   schemaPath: 'content.heroBlock.body'
// }
```

## Layout Fields with Schema Indices

Unnamed layout fields (tabs, rows, collapsibles, unnamed groups) use schema indices and generate `_index-` notation in schema paths.

### Tabs

```ts
const { path, schemaPath } = getPathBuilder()
  .tabs(0) // schema index of tabs field
  .tab('general') // named tab
  .text('title')
  .build()
// Result: { path: 'general.title', schemaPath: 'general.title' }
```

```ts
const { path, schemaPath } = getPathBuilder()
  .tabs(3) // schema index of tabs field
  .tab(0) // unnamed tab, also by schema index
  .text('field')
  .build()
// Result: { path: 'field', schemaPath: '_index-3-0.field' }
```

### Nested Unnamed Tabs

Indices accumulate into a single `_index-` segment:

```ts
const { path, schemaPath } = getPathBuilder().tabs(3).tab(0).tabs(1).tab(0).text('field').build()
// Result: { path: 'field', schemaPath: '_index-3-0-1-0.field' }
```

### Groups

```ts
// Named group
getPathBuilder().group('hero').text('title').build()
// Result: { path: 'hero.title', schemaPath: 'hero.title' }

// Unnamed group (by schema index)
getPathBuilder().group(0).text('field').build()
// Result: { path: 'field', schemaPath: '_index-0.field' }
```

### Rows

```ts
const { path, schemaPath } = getPathBuilder()
  .row(0) // schema index
  .group('column1')
  .text('content')
  .build()
// Result: { path: 'column1.content', schemaPath: '_index-0.column1.content' }
```

### Collapsibles

```ts
const { path, schemaPath } = getPathBuilder()
  .collapsible(2) // schema index (collapsibles have no names)
  .text('hidden')
  .build()
// Result: { path: 'hidden', schemaPath: '_index-2.hidden' }
```

## Complex Examples

### Nested Blocks and Arrays

```ts
const { path, schemaPath } = getPathBuilder()
  .blocks('sections')
  .block('featureList')
  .index(0)
  .array('features')
  .index(2)
  .text('title')
  .build()
// Result:
// {
//   path: 'sections.0.features.2.title',
//   schemaPath: 'sections.featureList.features.title'
// }
```

### Row Within Array

```ts
const { path, schemaPath } = getPathBuilder()
  .array('items')
  .index(0)
  .row(1) // schema index of row within array item
  .text('field')
  .build()
// Result:
// {
//   path: 'items.0.field',
//   schemaPath: 'items._index-1.field'
// }
```

### Mix of Named and Unnamed Groups

```ts
const { path, schemaPath } = getPathBuilder()
  .group(0) // unnamed group
  .group('named')
  .group(2) // another unnamed group
  .text('field')
  .build()
// Result:
// {
//   path: 'named.field',
//   schemaPath: '_index-0.named._index-2.field'
// }
```

## Field Type Methods

### Nesting-Capable Fields

```ts
.group(nameOrSchemaIndex: string | number)  // named or unnamed group
.tabs(schemaIndex: number)                   // tabs container
.tab(nameOrIndex: string | number)           // named or unnamed tab
.collapsible(schemaIndex: number)            // collapsible (no names)
.row(schemaIndex: number)                    // row (no names)
.array(name: string)                         // array field
.blocks(name: string)                        // blocks field
```

### Terminal Fields

```ts
.text(name)         .textarea(name)      .richText(name)
.number(name)       .date(name)          .checkbox(name)
.select(name)       .radio(name)         .code(name)
.json(name)         .point(name)         .relationship(name)
.upload(name)
```

## Type Safety

The builder enforces correct chaining at compile time:

```ts
// ✅ After array, must call .index() or .noIndex()
getPathBuilder().array('items').index(0).text('name')

// ❌ Cannot access fields without index/noIndex
getPathBuilder().array('items').text('name') // TypeScript error!

// ✅ After blocks, must call .block()
getPathBuilder().blocks('content').block('hero').index(0)

// ✅ After block, must call .index(), .noIndex(), or .build()
getPathBuilder().blocks('content').block('hero').index(0).text('title')

// ❌ Terminal fields can only call .build()
getPathBuilder().text('title').text('subtitle') // TypeScript error!
```

## API Reference

### Core Methods

#### `getPathBuilder(options?)`

Create a new path builder instance.

**Options:**

- `withEntity?: boolean` - Enable `.collections()` and `.globals()` methods

#### `.build()`

Returns `{ path: string, schemaPath: string }`

### Array/Blocks Methods

#### `.array(name: string)`

Add an array field (must be followed by `.index()` or `.noIndex()`).

#### `.blocks(name: string)`

Add a blocks field (must be followed by `.block()`).

#### `.block(slug: string)`

Specify a block type (must be followed by `.index()`, `.noIndex()`, or `.build()`).

#### `.index(i: number)`

Add array/block index to data path only.

#### `.noIndex()`

Skip array/block index (useful for schema-only paths).

### Entity Methods (with `withEntity: true`)

#### `.collections(slug: string)`

Start with a collection context (must be followed by `.id()` or `.noId()`).

#### `.globals(slug: string)`

Start with a global context.

#### `.id(id: number | string)` / `.noId()`

Provide or skip document ID context (doesn't modify paths).

## Use Cases

### Form State Building

```ts
const pathInfo = getPathBuilder()
  .blocks('content')
  .block('heroBlock')
  .index(blockIndex)
  .richText('title')
  .build()

const fieldState = formState[pathInfo.path]
const fieldSchema = fieldSchemaMap[pathInfo.schemaPath]
```

### Validation Error Paths

```ts
const errorPath = getPathBuilder()
  .array('variants')
  .index(variantIndex)
  .number('price')
  .build().path
```

### Schema Lookup

```ts
const { schemaPath } = getPathBuilder()
  .array('items')
  .noIndex() // skip index for schema lookup
  .text('name')
  .build()

const fieldSchema = fieldSchemaMap[schemaPath]
```

## Testing

```bash
pnpm test:unit pathBuilder.spec
```

## Tips

1. **Use specific field methods** for better clarity: `.richText('title')` over generic field access
2. **Store the result** if you need both paths: `const paths = builder.build()`
3. **Use `.noIndex()`** for schema-only lookups
4. **Terminal fields** can only call `.build()` - this prevents invalid nesting at compile time
