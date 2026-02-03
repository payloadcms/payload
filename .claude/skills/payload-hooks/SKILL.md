---
name: payload-hooks
description: Use when implementing any Payload hook - quick reference for hook signatures, parameters, and availability
---

# Payload Hooks Reference

## Overview

Fast reference for Payload hook signatures and parameters. For hook **timing** and **lifecycle**, see payload-operations skill.

## Collection Hook Signatures

### beforeValidate / beforeChange

```typescript
({ collection, context, data, operation, originalDoc, req }) => data | void
```

- `operation`: `'create' | 'update'`
- `originalDoc`: undefined on create

### afterChange

```typescript
({ collection, context, data, doc, docWithLocales, operation, previousDoc, previousDocWithLocales, req }) => doc | void
```

### beforeDelete

```typescript
({ collection, context, id, req }) => void
```

### afterDelete

```typescript
({ collection, context, doc, id, req }) => void
```

### beforeRead / afterRead

```typescript
({ collection, context, doc, findMany?, query?, req }) => doc | void
```

- afterRead also has: `docWithLocales`

### beforeOperation / afterOperation

```typescript
beforeOperation: ({ args, collection, context, operation, req }) => args | void
afterOperation: ({ args, collection, operation, req, result }) => result
```

## Field Hook Signatures

All field hooks receive:

```typescript
({
  value,           // Current field value
  originalDoc,     // Original document (undefined on create)
  data,            // Full document data
  siblingData,     // Fields at same level
  siblingDocWithLocales,  // Sibling data with all locales
  previousValue,   // Value before this hook
  previousSiblingDoc,  // Original sibling data
  operation,       // 'create' | 'update' | 'read' | 'delete'
  req,             // PayloadRequest
  context,         // RequestContext

  // Structural info
  path,            // ['group', 'array', 0, 'field'] with indexes
  schemaPath,      // ['group', 'array', 'field'] without indexes
  indexPath,       // [0, 1, 2] array indexes only
  blockData,       // Parent block data (if in block)

  // Config
  field,           // Field configuration
  collection,      // Collection config (null if global)
  global,          // Global config (null if collection)
  siblingFields,   // Fields at same level

  // Flags
  overrideAccess,  // Access control bypassed?
  showHiddenFields,  // Show hidden fields?
  findMany         // Part of find operation?
}) => value | void
```

**Return:** Modified value or void (void keeps original)

## Parameter Availability Matrix

| Parameter               | create        | update     | delete | read | Notes                     |
| ----------------------- | ------------- | ---------- | ------ | ---- | ------------------------- |
| `originalDoc`           | ❌ undefined  | ✅         | N/A    | N/A  | Original before ANY hooks |
| `previousDoc`           | ✅ empty `{}` | ✅         | N/A    | N/A  | Document before change    |
| `data`                  | ✅            | ✅ partial | N/A    | N/A  | Incoming request data     |
| `doc`                   | ✅            | ✅         | ✅     | ✅   | Final/current document    |
| `value` (field)         | ✅            | ✅         | ✅     | ✅   | Current field value       |
| `previousValue` (field) | ✅            | ✅         | N/A    | N/A  | Value before hook         |

## Parameter Semantic Differences

| Parameter            | Scope        | When            | What It Contains                               |
| -------------------- | ------------ | --------------- | ---------------------------------------------- |
| **`data`**           | Full doc     | Before DB write | Incoming changes from request (may be partial) |
| **`siblingData`**    | Parent level | Field hooks     | Data of fields at same level (modifiable)      |
| **`originalDoc`**    | Full doc     | Update only     | Document before ANY hooks ran                  |
| **`previousDoc`**    | Full doc     | After DB write  | Document before THIS change (after hooks)      |
| **`doc`**            | Full doc     | After DB write  | Final document after change                    |
| **`docWithLocales`** | Full doc     | After DB write  | Document with ALL locale data                  |

### Key Distinction: originalDoc vs previousDoc

- `originalDoc`: State BEFORE any hooks modified it (raw from DB)
- `previousDoc`: State BEFORE this specific change (after previous hooks)

**Example:**

```typescript
beforeChange: [
  ({ originalDoc, previousDoc }) => {
    // originalDoc: {title: 'Original'}
    // previousDoc: {title: 'Modified by previous hook'}
  },
]
```

## Common Patterns

### Check if Field Changed

```typescript
afterChange: [
  ({ doc, previousDoc }) => {
    if (doc.status !== previousDoc.status) {
      // status changed
    }
  },
]
```

### Access Sibling Fields (Field Hooks)

```typescript
{
  name: 'finalPrice',
  hooks: {
    beforeChange: [
      ({ siblingData }) => siblingData.basePrice * 1.1
    ]
  }
}
```

### Handle Create vs Update

```typescript
beforeChange: [
  ({ operation, originalDoc }) => {
    if (operation === 'create') {
      // new document
    }
    if (operation === 'update' && originalDoc?.status === 'published') {
      // updating published doc
    }
  },
]
```

### Access Full Document in Field Hook

```typescript
{
  name: 'slug',
  hooks: {
    beforeChange: [
      ({ data }) => slugify(data.title)  // Access other fields via data
    ]
  }
}
```

## When Parameters Are Undefined

**Always check before accessing:**

- `originalDoc`: undefined during create
- `previousValue`: may be undefined for new fields
- `blockData`: undefined if not inside a block
- `findMany`: undefined if not a find operation

```typescript
// ✅ Safe access
if (originalDoc?.status === 'published') {
}

// ❌ Unsafe
if (originalDoc.status === 'published') {
} // Error on create
```

## Cross-Reference

- **Hook timing and lifecycle**: See payload-operations skill
- **Hook execution order**: See payload-operations skill (beforeChange → field hooks → DB write → afterChange)
- **Localized field data structure in hooks**: See payload-operations skill

## Type Definitions

Located in `packages/payload/src/collections/config/types.ts` and `packages/payload/src/fields/config/types.ts`
