# Path Builder Utility

A fluent, type-safe API for building field paths in Payload.

## Overview

Payload uses two types of paths:

- **Data Path (`path`)**: Accesses actual data values, includes array indices (e.g., `content.0.title`)
- **Schema Path (`schemaPath`)**: Accesses field schemas, uses block slugs and `_index-` notation for unnamed layout fields (e.g., `content.heroBlock.title` or `_index-0-1.field`)

## Basic Usage

```ts
import { getPathBuilder } from 'payload'
```

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

Use the `prefix` option to include collection/global context:

### `prefix: 'entityType.entity'` - Full prefix with type

```ts
const { indexPath, path, schemaPath } = getPathBuilder({ prefix: 'entityType.entity' })
  .collections('pages')
  .id(123) // or .noId()
  .text('title')
  .build()
// Result: { indexPath: '', path: 'collection.pages.123.title', schemaPath: 'collection.pages.title' }
```

```ts
const { indexPath, path, schemaPath } = getPathBuilder({ prefix: 'entityType.entity' })
  .globals('settings')
  .text('siteName')
  .build()
// Result: { indexPath: '', path: 'global.settings.siteName', schemaPath: 'global.settings.siteName' }
```

### `prefix: 'entity'` - Entity slug only

```ts
const { indexPath, path, schemaPath } = getPathBuilder({ prefix: 'entity' })
  .collections('pages')
  .id(123)
  .text('title')
  .build()
// Result: { indexPath: '', path: 'pages.123.title', schemaPath: 'pages.title' }
```

### `prefix: false` (default) - No prefix

Without prefix, start directly with fields:

```ts
const { indexPath, path, schemaPath } = getPathBuilder().group('hero').text('title').build()
// Result: { indexPath: '', path: 'hero.title', schemaPath: 'hero.title' }
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
