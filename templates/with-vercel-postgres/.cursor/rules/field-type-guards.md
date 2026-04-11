---
title: Field Type Guards
description: Runtime field type checking and safe type narrowing
tags: [payload, typescript, type-guards, fields]
---

# Payload Field Type Guards

Type guards for runtime field type checking and safe type narrowing.

## Most Common Guards

### fieldAffectsData

**Most commonly used guard.** Checks if field stores data (has name and is not UI-only).

```typescript
import { fieldAffectsData } from 'payload'

function generateSchema(fields: Field[]) {
  fields.forEach((field) => {
    if (fieldAffectsData(field)) {
      // Safe to access field.name
      schema[field.name] = getFieldType(field)
    }
  })
}

// Filter data fields
const dataFields = fields.filter(fieldAffectsData)
```

### fieldHasSubFields

Checks if field contains nested fields (group, array, row, or collapsible).

```typescript
import { fieldHasSubFields } from 'payload'

function traverseFields(fields: Field[]): void {
  fields.forEach((field) => {
    if (fieldHasSubFields(field)) {
      // Safe to access field.fields
      traverseFields(field.fields)
    }
  })
}
```

### fieldIsArrayType

Checks if field type is `'array'`.

```typescript
import { fieldIsArrayType } from 'payload'

if (fieldIsArrayType(field)) {
  // field.type === 'array'
  console.log(`Min rows: ${field.minRows}`)
  console.log(`Max rows: ${field.maxRows}`)
}
```

## Capability Guards

### fieldSupportsMany

Checks if field can have multiple values (select, relationship, or upload with `hasMany`).

```typescript
import { fieldSupportsMany } from 'payload'

if (fieldSupportsMany(field)) {
  // field.type is 'select' | 'relationship' | 'upload'
  if (field.hasMany) {
    console.log('Field accepts multiple values')
  }
}
```

### fieldHasMaxDepth

Checks if field is relationship/upload/join with numeric `maxDepth` property.

```typescript
import { fieldHasMaxDepth } from 'payload'

if (fieldHasMaxDepth(field)) {
  // field.type is 'upload' | 'relationship' | 'join'
  // AND field.maxDepth is number
  const remainingDepth = field.maxDepth - currentDepth
}
```

### fieldIsVirtual

Checks if field is virtual (computed or virtual relationship).

```typescript
import { fieldIsVirtual } from 'payload'

if (fieldIsVirtual(field)) {
  // field.virtual is truthy
  if (typeof field.virtual === 'string') {
    console.log(`Virtual path: ${field.virtual}`)
  }
}
```

## Type Checking Guards

### fieldIsBlockType

```typescript
import { fieldIsBlockType } from 'payload'

if (fieldIsBlockType(field)) {
  // field.type === 'blocks'
  field.blocks.forEach((block) => {
    console.log(`Block: ${block.slug}`)
  })
}
```

### fieldIsGroupType

```typescript
import { fieldIsGroupType } from 'payload'

if (fieldIsGroupType(field)) {
  // field.type === 'group'
  console.log(`Interface: ${field.interfaceName}`)
}
```

### fieldIsPresentationalOnly

```typescript
import { fieldIsPresentationalOnly } from 'payload'

if (fieldIsPresentationalOnly(field)) {
  // field.type === 'ui'
  // Skip in data operations, GraphQL schema, etc.
  return
}
```

## Common Patterns

### Recursive Field Traversal

```typescript
import { fieldAffectsData, fieldHasSubFields } from 'payload'

function traverseFields(fields: Field[], callback: (field: Field) => void) {
  fields.forEach((field) => {
    if (fieldAffectsData(field)) {
      callback(field)
    }

    if (fieldHasSubFields(field)) {
      traverseFields(field.fields, callback)
    }
  })
}
```

### Filter Data-Bearing Fields

```typescript
import { fieldAffectsData, fieldIsPresentationalOnly, fieldIsHiddenOrDisabled } from 'payload'

const dataFields = fields.filter(
  (field) =>
    fieldAffectsData(field) && !fieldIsPresentationalOnly(field) && !fieldIsHiddenOrDisabled(field),
)
```

### Container Type Switching

```typescript
import { fieldIsArrayType, fieldIsBlockType, fieldHasSubFields } from 'payload'

if (fieldIsArrayType(field)) {
  // Handle array-specific logic
} else if (fieldIsBlockType(field)) {
  // Handle blocks-specific logic
} else if (fieldHasSubFields(field)) {
  // Handle group/row/collapsible
}
```

### Safe Property Access

```typescript
import { fieldSupportsMany, fieldHasMaxDepth } from 'payload'

// With guard - safe access
if (fieldSupportsMany(field) && field.hasMany) {
  console.log('Multiple values supported')
}

if (fieldHasMaxDepth(field)) {
  const depth = field.maxDepth // TypeScript knows this is number
}
```

## All Available Guards

| Type Guard                  | Checks For                        | Use When                                 |
| --------------------------- | --------------------------------- | ---------------------------------------- |
| `fieldAffectsData`          | Field stores data (has name)      | Need to access field data or name        |
| `fieldHasSubFields`         | Field contains nested fields      | Recursively traverse fields              |
| `fieldIsArrayType`          | Field is array type               | Distinguish arrays from other containers |
| `fieldIsBlockType`          | Field is blocks type              | Handle blocks-specific logic             |
| `fieldIsGroupType`          | Field is group type               | Handle group-specific logic              |
| `fieldSupportsMany`         | Field can have multiple values    | Check for `hasMany` support              |
| `fieldHasMaxDepth`          | Field supports depth control      | Control relationship/upload/join depth   |
| `fieldIsPresentationalOnly` | Field is UI-only                  | Exclude from data operations             |
| `fieldIsSidebar`            | Field positioned in sidebar       | Separate sidebar rendering               |
| `fieldIsID`                 | Field name is 'id'                | Special ID field handling                |
| `fieldIsHiddenOrDisabled`   | Field is hidden or disabled       | Filter from UI operations                |
| `fieldShouldBeLocalized`    | Field needs localization          | Proper locale table checks               |
| `fieldIsVirtual`            | Field is virtual                  | Skip in database transforms              |
| `tabHasName`                | Tab is named (stores data)        | Distinguish named vs unnamed tabs        |
| `groupHasName`              | Group is named (stores data)      | Distinguish named vs unnamed groups      |
| `optionIsObject`            | Option is `{label, value}`        | Access option properties safely          |
| `optionsAreObjects`         | All options are objects           | Batch option processing                  |
| `optionIsValue`             | Option is string value            | Handle string options                    |
| `valueIsValueWithRelation`  | Value is polymorphic relationship | Handle polymorphic relationships         |
