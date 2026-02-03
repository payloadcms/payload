---
name: payload-operations
description: Use when working with Payload operations (create, update, delete), especially when dealing with hooks, localized fields, draft versions, or version snapshots
---

# Payload Operations Lifecycle

## Overview

Payload operations follow a strict lifecycle with defined phases. Understanding when data transformations occur—especially for localized fields and versions—prevents common mistakes with hook timing and data structure assumptions.

**Note:** This skill focuses on operation lifecycle timing and data transformations. Hook signatures (parameters like `req`, `operation`, `originalDoc`) are simplified in examples for clarity. For complete hook parameter reference, see payload-hooks skill (if available).

## When to Use

Use this skill when:

- Adding hooks to collections (beforeChange, afterChange, etc.)
- Working with localized fields in hooks
- Using draft versions or version snapshots
- Debugging why data transformations aren't working
- Implementing features that interact with Payload's operation system

## Operation Lifecycle Phases

All Payload operations (create, update, delete) follow this sequence:

```
1. beforeOperation hook
2. Access control check
3. beforeValidate hook (Collection → Fields)
4. beforeChange hook (Collection → Fields)
   └─ Locale unflattening happens HERE during field processing
5. Database Write (CREATE/UPDATE/DELETE)
   └─ SKIPPED if draft: true on updates
6. saveVersion() - if versions enabled
7. afterRead hook (Fields → Collection)
8. afterChange hook (Fields → Collection)
9. afterOperation hook
```

**Critical timing:**

- `beforeChange`: Last chance to modify data BEFORE database write
- `afterChange`: Runs AFTER database write (cannot modify persisted data)
- Locale unflattening: Happens DURING `beforeChange` field processing

## Localized Field Data Structure

Localized fields transform during the operation lifecycle:

### In Collection Hooks (beforeChange)

Data comes in as **single-locale values**:

```typescript
// Collection-level beforeChange receives:
{
  title: 'Bonjour',    // Single value
  locale: 'fr'         // User's current locale
}

// Work with data.title as a string:
hooks: {
  beforeChange: [
    ({ data }) => {
      data.title = data.title.toUpperCase()  // ✅ Correct
      return data
    }
  ]
}
```

### After Field Processing

Localized fields are "unflattened" to multi-locale structure:

```typescript
// After field hooks process and unflatten:
{
  title: {
    en: 'Hello',     // Existing locale preserved
    fr: 'BONJOUR'    // Updated locale
  }
}

// This is what gets stored in the database
```

### In Field Hooks

Field-level hooks see the field's direct value:

```typescript
{
  name: 'title',
  type: 'text',
  localized: true,
  hooks: {
    beforeChange: [
      ({ value }) => {
        // value is the string 'Bonjour', not an object
        return value.toUpperCase()
      }
    ]
  }
}
```

## Draft Operations

When `draft: true` is passed to update operations:

```typescript
await payload.update({
  collection: 'posts',
  where: { id: { equals: 123 } },
  data: { title: 'Updated' },
  draft: true, // Changes behavior significantly
})
```

**What happens:**

1. All hooks run normally (beforeChange, etc.)
2. Database write is **SKIPPED** (`payload.db.updateOne()` not called)
3. A version record is created instead with `_status: 'draft'`
4. The main document remains unchanged

**Why:** Drafts are separate version records, not updates to the published document.

## Version Snapshots

When updating specific locales with versions enabled:

```typescript
await payload.update({
  collection: 'posts',
  id: 123,
  data: { title: 'Hola' },
  locale: 'es',
  publishSpecificLocale: 'es', // Publish only Spanish
})
```

**What happens:**

1. `mergeLocalizedData()` merges new `es` data with existing locales
2. Main document is updated with merged data
3. Regular version record is created with all locales
4. **Snapshot version** is created with ONLY the published locale
5. Snapshot marked with `snapshot: true` field

**Why:** Snapshot preserves the state of the specific locale that was published, allowing other locales to remain as drafts.

## Common Mistakes

| Mistake                                                   | Why It Fails                                       | Solution                                               |
| --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Modifying data in `afterChange`                           | DB write already complete                          | Use `beforeChange`                                     |
| Assuming localized fields are objects in collection hooks | Unflattening hasn't happened yet                   | Work with single-locale values                         |
| Handling both string/object formats "defensively"         | Shows uncertainty about when transformation occurs | Know the lifecycle - single values in collection hooks |
| Expecting `draft: true` to update main doc                | Draft operations skip DB write                     | Drafts create version records only                     |
| Manually setting `_status` per locale                     | Complex merge logic required                       | Use `publishSpecificLocale` parameter                  |

## Red Flags

These thoughts mean you need to review this skill:

| Thought                                    | Reality                                                |
| ------------------------------------------ | ------------------------------------------------------ |
| "I'll handle both formats to be safe"      | You should know which format to expect at each phase   |
| "Payload resolves locales automatically"   | You need to understand the unflattening mechanism      |
| "afterChange can modify the data"          | afterChange runs AFTER database write                  |
| "Draft updates should persist to main doc" | Draft operations intentionally skip main doc writes    |
| "I'll merge locale data manually"          | Use `mergeLocalizedData()` and `publishSpecificLocale` |

## Quick Reference

### Hook Timing

| Hook              | When              | Can Modify Data? | DB Written? |
| ----------------- | ----------------- | ---------------- | ----------- |
| `beforeOperation` | First             | Yes              | No          |
| `beforeValidate`  | Before validation | Yes              | No          |
| `beforeChange`    | Before DB write   | Yes              | No          |
| `afterRead`       | After DB write    | For display only | Yes         |
| `afterChange`     | After DB write    | No effect on DB  | Yes         |
| `afterOperation`  | Last              | No effect on DB  | Yes         |

### Data Structure by Phase

#### Example: Updating French translation of existing post

**Existing document in database:**

```typescript
{
  id: 123,
  title: {
    en: 'Hello World',
    fr: 'Bonjour le Monde'
  }
}
```

**User updates French translation:**

| Phase                            | What You See                       | Full Document Structure                                                   | Notes                                             |
| -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| **1. API Call**                  | User sends update                  | `data: { title: 'Bonjour Tout Le Monde' }` with `locale: 'fr'` in request | Single-locale input                               |
| **2. Collection `beforeChange`** | Hook receives single value         | `{ id: 123, title: 'Bonjour Tout Le Monde' }`                             | Work with `data.title` as string                  |
| **3. Field `beforeChange`**      | Field hook receives value directly | `value = 'Bonjour Tout Le Monde'`                                         | No document wrapper, just the value               |
| **4. After Field Processing**    | Unflattening complete              | `{ id: 123, title: { en: 'Hello World', fr: 'Bonjour Tout Le Monde' } }`  | NEW: Object structure created, old `en` preserved |
| **5. Database Storage**          | Same as #4                         | `{ id: 123, title: { en: 'Hello World', fr: 'Bonjour Tout Le Monde' } }`  | Multi-locale object persisted                     |
| **6. Collection `afterChange`**  | Hook receives full structure       | `{ id: 123, title: { en: 'Hello World', fr: 'Bonjour Tout Le Monde' } }`  | Cannot modify DB at this point                    |

**Key transformation:** Between phases 3→4, the field value `'Bonjour Tout Le Monde'` is "unflattened" into the object `{ en: 'Hello World', fr: 'Bonjour Tout Le Monde' }` by merging with existing locale data.

## Key Implementation Files

Located in Payload monorepo at `packages/payload/src/`:

- `collections/operations/create.ts` - Create operation flow
- `collections/operations/update.ts` - Update operation flow
- `fields/hooks/beforeChange/` - Field-level hook processing
- `utilities/mergeLocalizedData.ts` - Locale merging logic
- `versions/saveVersion.ts` - Version creation logic
- `versions/drafts/replaceWithDraftIfAvailable.ts` - Draft loading
