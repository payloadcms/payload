# Payload Field Type Guards Reference

Complete reference with detailed examples and patterns. See [FIELDS.md](FIELDS.md#field-type-guards) for quick reference table of all guards.

## Structural Guards

### fieldHasSubFields

Checks if field contains nested fields (group, array, row, or collapsible).

```ts
import type { Field } from 'payload'
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

**Signature:**

```ts
fieldHasSubFields<TField extends ClientField | Field>(
  field: TField
): field is TField & (FieldWithSubFieldsClient | FieldWithSubFields)
```

**Common Pattern - Exclude Arrays:**

```ts
if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
  // Groups, rows, collapsibles only (not arrays)
}
```

### fieldIsArrayType

Checks if field type is `'array'`.

```ts
import { fieldIsArrayType } from 'payload'

if (fieldIsArrayType(field)) {
  // field.type === 'array'
  console.log(`Min rows: ${field.minRows}`)
  console.log(`Max rows: ${field.maxRows}`)
}
```

**Signature:**

```ts
fieldIsArrayType<TField extends ClientField | Field>(
  field: TField
): field is TField & (ArrayFieldClient | ArrayField)
```

### fieldIsBlockType

Checks if field type is `'blocks'`.

```ts
import { fieldIsBlockType } from 'payload'

if (fieldIsBlockType(field)) {
  // field.type === 'blocks'
  field.blocks.forEach((block) => {
    console.log(`Block: ${block.slug}`)
  })
}
```

**Signature:**

```ts
fieldIsBlockType<TField extends ClientField | Field>(
  field: TField
): field is TField & (BlocksFieldClient | BlocksField)
```

**Common Pattern - Distinguish Containers:**

```ts
if (fieldIsArrayType(field)) {
  // Handle array rows
} else if (fieldIsBlockType(field)) {
  // Handle block types
}
```

### fieldIsGroupType

Checks if field type is `'group'`.

```ts
import { fieldIsGroupType } from 'payload'

if (fieldIsGroupType(field)) {
  // field.type === 'group'
  console.log(`Interface: ${field.interfaceName}`)
}
```

**Signature:**

```ts
fieldIsGroupType<TField extends ClientField | Field>(
  field: TField
): field is TField & (GroupFieldClient | GroupField)
```

## Capability Guards

### fieldSupportsMany

Checks if field can have multiple values (select, relationship, or upload with `hasMany`).

```ts
import { fieldSupportsMany } from 'payload'

if (fieldSupportsMany(field)) {
  // field.type is 'select' | 'relationship' | 'upload'
  // Safe to check field.hasMany
  if (field.hasMany) {
    console.log('Field accepts multiple values')
  }
}
```

**Signature:**

```ts
fieldSupportsMany<TField extends ClientField | Field>(
  field: TField
): field is TField & (FieldWithManyClient | FieldWithMany)
```

### fieldHasMaxDepth

Checks if field is relationship/upload/join with numeric `maxDepth` property.

```ts
import { fieldHasMaxDepth } from 'payload'

if (fieldHasMaxDepth(field)) {
  // field.type is 'upload' | 'relationship' | 'join'
  // AND field.maxDepth is number
  const remainingDepth = field.maxDepth - currentDepth
}
```

**Signature:**

```ts
fieldHasMaxDepth<TField extends ClientField | Field>(
  field: TField
): field is TField & (FieldWithMaxDepthClient | FieldWithMaxDepth)
```

### fieldShouldBeLocalized

Checks if field needs localization handling (accounts for parent localization).

```ts
import { fieldShouldBeLocalized } from 'payload'

function processField(field: Field, parentIsLocalized: boolean) {
  if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
    // Create locale-specific table or index
  }
}
```

**Signature:**

```ts
fieldShouldBeLocalized({
  field,
  parentIsLocalized,
}: {
  field: ClientField | ClientTab | Field | Tab
  parentIsLocalized: boolean
}): boolean
```

```ts
// Accounts for parent localization
if (fieldShouldBeLocalized({ field, parentIsLocalized: false })) {
  /* ... */
}
```

### fieldIsVirtual

Checks if field is virtual (computed or virtual relationship).

```ts
import { fieldIsVirtual } from 'payload'

if (fieldIsVirtual(field)) {
  // field.virtual is truthy
  if (typeof field.virtual === 'string') {
    // Virtual relationship path
    console.log(`Virtual path: ${field.virtual}`)
  } else {
    // Computed virtual field (uses hooks)
  }
}
```

**Signature:**

```ts
fieldIsVirtual(field: Field | Tab): boolean
```

## Data Guards

### fieldAffectsData

**Most commonly used guard.** Checks if field stores data (has name and is not UI-only).

```ts
import { fieldAffectsData } from 'payload'

function generateSchema(fields: Field[]) {
  fields.forEach((field) => {
    if (fieldAffectsData(field)) {
      // Safe to access field.name
      schema[field.name] = getFieldType(field)
    }
  })
}
```

**Signature:**

```ts
fieldAffectsData<TField extends ClientField | Field | TabAsField | TabAsFieldClient>(
  field: TField
): field is TField & (FieldAffectingDataClient | FieldAffectingData)
```

**Pattern - Data Fields Only:**

```ts
const dataFields = fields.filter(fieldAffectsData)
```

### fieldIsPresentationalOnly

Checks if field is UI-only (type `'ui'`).

```ts
import { fieldIsPresentationalOnly } from 'payload'

if (fieldIsPresentationalOnly(field)) {
  // field.type === 'ui'
  // Skip in data operations, GraphQL schema, etc.
  return
}
```

**Signature:**

```ts
fieldIsPresentationalOnly<TField extends ClientField | Field | TabAsField | TabAsFieldClient>(
  field: TField
): field is TField & (UIFieldClient | UIField)
```

### fieldIsID

Checks if field name is exactly `'id'`.

```ts
import { fieldIsID } from 'payload'

if (fieldIsID(field)) {
  // field.name === 'id'
  // Special handling for ID field
}
```

**Signature:**

```ts
fieldIsID<TField extends ClientField | Field>(
  field: TField
): field is { name: 'id' } & TField
```

### fieldIsHiddenOrDisabled

Checks if field is hidden or admin-disabled.

```ts
import { fieldIsHiddenOrDisabled } from 'payload'

const visibleFields = fields.filter((field) => !fieldIsHiddenOrDisabled(field))
```

**Signature:**

```ts
fieldIsHiddenOrDisabled<TField extends ClientField | Field | TabAsField | TabAsFieldClient>(
  field: TField
): field is { admin: { hidden: true } } & TField
```

## Layout Guards

### fieldIsSidebar

Checks if field is positioned in sidebar.

```ts
import { fieldIsSidebar } from 'payload'

const [mainFields, sidebarFields] = fields.reduce(
  ([main, sidebar], field) => {
    if (fieldIsSidebar(field)) {
      return [main, [...sidebar, field]]
    }
    return [[...main, field], sidebar]
  },
  [[], []],
)
```

**Signature:**

```ts
fieldIsSidebar<TField extends ClientField | Field | TabAsField | TabAsFieldClient>(
  field: TField
): field is { admin: { position: 'sidebar' } } & TField
```

## Tab & Group Guards

### tabHasName

Checks if tab is named (stores data under tab name).

```ts
import { tabHasName } from 'payload'

tabs.forEach((tab) => {
  if (tabHasName(tab)) {
    // tab.name exists
    dataPath.push(tab.name)
  }
  // Process tab.fields
})
```

**Signature:**

```ts
tabHasName<TField extends ClientTab | Tab>(
  tab: TField
): tab is NamedTab & TField
```

### groupHasName

Checks if group is named (stores data under group name).

```ts
import { groupHasName } from 'payload'

if (groupHasName(group)) {
  // group.name exists
  return data[group.name]
}
```

**Signature:**

```ts
groupHasName(group: Partial<NamedGroupFieldClient>): group is NamedGroupFieldClient
```

## Option & Value Guards

### optionIsObject

Checks if option is object format `{label, value}` vs string.

```ts
import { optionIsObject } from 'payload'

field.options.forEach((option) => {
  if (optionIsObject(option)) {
    console.log(`${option.label}: ${option.value}`)
  } else {
    console.log(option) // string value
  }
})
```

**Signature:**

```ts
optionIsObject(option: Option): option is OptionObject
```

### optionsAreObjects

Checks if entire options array contains objects.

```ts
import { optionsAreObjects } from 'payload'

if (optionsAreObjects(field.options)) {
  // All options are OptionObject[]
  const labels = field.options.map((opt) => opt.label)
}
```

**Signature:**

```ts
optionsAreObjects(options: Option[]): options is OptionObject[]
```

### optionIsValue

Checks if option is string value (not object).

```ts
import { optionIsValue } from 'payload'

if (optionIsValue(option)) {
  // option is string
  const value = option
}
```

**Signature:**

```ts
optionIsValue(option: Option): option is string
```

### valueIsValueWithRelation

Checks if relationship value is polymorphic format `{relationTo, value}`.

```ts
import { valueIsValueWithRelation } from 'payload'

if (valueIsValueWithRelation(fieldValue)) {
  // fieldValue.relationTo exists
  // fieldValue.value exists
  console.log(`Related to ${fieldValue.relationTo}: ${fieldValue.value}`)
}
```

**Signature:**

```ts
valueIsValueWithRelation(value: unknown): value is ValueWithRelation
```

## Common Patterns

### Recursive Field Traversal

```ts
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

```ts
import { fieldAffectsData, fieldIsPresentationalOnly, fieldIsHiddenOrDisabled } from 'payload'

const dataFields = fields.filter(
  (field) =>
    fieldAffectsData(field) && !fieldIsPresentationalOnly(field) && !fieldIsHiddenOrDisabled(field),
)
```

### Container Type Switching

```ts
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

```ts
import { fieldSupportsMany, fieldHasMaxDepth } from 'payload'

// Without guard - TypeScript error
// if (field.hasMany) { /* ... */ }

// With guard - safe access
if (fieldSupportsMany(field) && field.hasMany) {
  console.log('Multiple values supported')
}

if (fieldHasMaxDepth(field)) {
  const depth = field.maxDepth // TypeScript knows this is number
}
```

## Type Preservation

All guards preserve the original type constraint:

```ts
import type { ClientField, Field } from 'payload'
import { fieldHasSubFields } from 'payload'

function processServerField(field: Field) {
  if (fieldHasSubFields(field)) {
    // field is Field & FieldWithSubFields (not ClientField)
  }
}

function processClientField(field: ClientField) {
  if (fieldHasSubFields(field)) {
    // field is ClientField & FieldWithSubFieldsClient
  }
}
```
