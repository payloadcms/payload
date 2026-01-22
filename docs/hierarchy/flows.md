# Hierarchy Data Flows

High-level visual flows showing how hierarchy data is created and maintained.

---

## Flow 1: Creating a Root Page

**User Action:**

```ts
await payload.create({
  collection: 'pages',
  data: {
    title: 'Products',
    parent: null,
  },
})
```

**Result:**

```
┌─────────────────────────────────────┐
│ Document Created (id: '1')          │
├─────────────────────────────────────┤
│ title: 'Products'                   │
│ parent: null                        │
│ _h_parentTree: []                   │
│ _h_depth: 0                         │
│ _h_slugPath: 'products'             │
│ _h_titlePath: 'Products'            │
└─────────────────────────────────────┘
```

**What happened:**

- No parent → root document
- `_h_parentTree` is empty (no ancestors)
- `_h_depth` is 0 (root level)
- Paths are just the slugified/actual title

---

## Flow 2: Creating a Child Page

**User Action:**

```ts
await payload.create({
  collection: 'pages',
  data: {
    title: 'Clothing',
    parent: '1', // Products
  },
})
```

**Steps:**

1. **System fetches parent data:**

```
┌─────────────────────────────────────┐
│ Parent: Products (id: '1')          │
├─────────────────────────────────────┤
│ _h_parentTree: []                   │
│ _h_slugPath: 'products'             │
│ _h_titlePath: 'Products'            │
└─────────────────────────────────────┘
```

2. **System calculates child hierarchy:**

- `_h_parentTree` = parent's tree + parent ID = `[] + ['1']` = `['1']`
- `_h_depth` = length of tree = `1`
- `_h_slugPath` = parent slug + `/` + child slug = `'products/clothing'`
- `_h_titlePath` = parent title + `/` + child title = `'Products/Clothing'`

**Result:**

```
┌─────────────────────────────────────┐
│ Document Created (id: '2')          │
├─────────────────────────────────────┤
│ title: 'Clothing'                   │
│ parent: '1'                         │
│ _h_parentTree: ['1']                │
│ _h_depth: 1                         │
│ _h_slugPath: 'products/clothing'    │
│ _h_titlePath: 'Products/Clothing'   │
└─────────────────────────────────────┘
```

---

## Flow 3: Creating a Grandchild Page

**User Action:**

```ts
await payload.create({
  collection: 'pages',
  data: {
    title: 'Shirts',
    parent: '2', // Clothing
  },
})
```

**Steps:**

1. **System fetches parent data:**

```
┌─────────────────────────────────────┐
│ Parent: Clothing (id: '2')          │
├─────────────────────────────────────┤
│ _h_parentTree: ['1']                │
│ _h_slugPath: 'products/clothing'    │
│ _h_titlePath: 'Products/Clothing'   │
└─────────────────────────────────────┘
```

2. **System calculates grandchild hierarchy:**

- `_h_parentTree` = parent's tree + parent ID = `['1'] + ['2']` = `['1', '2']`
- `_h_depth` = length of tree = `2`
- `_h_slugPath` = `'products/clothing/shirts'`
- `_h_titlePath` = `'Products/Clothing/Shirts'`

**Result:**

```
┌──────────────────────────────────────────────┐
│ Document Created (id: '3')                   │
├──────────────────────────────────────────────┤
│ title: 'Shirts'                              │
│ parent: '2'                                  │
│ _h_parentTree: ['1', '2']                    │
│ _h_depth: 2                                  │
│ _h_slugPath: 'products/clothing/shirts'      │
│ _h_titlePath: 'Products/Clothing/Shirts'     │
└──────────────────────────────────────────────┘
```

---

## Flow 4: Moving a Child to Another Parent

**Setup - Tree structure:**

```
Categories (id: 4)          Products (id: 1)
                            └── Clothing (id: 2)
                                └── Shirts (id: 3)
```

**BEFORE STATE:**

```
┌─────────────────────────────────────┐
│ Categories (id: '4')                │
├─────────────────────────────────────┤
│ parent: null                        │
│ _h_parentTree: []                   │
│ _h_slugPath: 'categories'           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Products (id: '1')                  │
├─────────────────────────────────────┤
│ parent: null                        │
│ _h_parentTree: []                   │
│ _h_slugPath: 'products'             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Clothing (id: '2')                  │
├─────────────────────────────────────┤
│ parent: '1'                         │
│ _h_parentTree: ['1']                │
│ _h_slugPath: 'products/clothing'    │
└─────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Shirts (id: '3')                             │
├──────────────────────────────────────────────┤
│ parent: '2'                                  │
│ _h_parentTree: ['1', '2']                    │
│ _h_slugPath: 'products/clothing/shirts'      │
└──────────────────────────────────────────────┘
```

**User Action:**

```ts
// Move Clothing from Products to Categories
await payload.update({
  collection: 'pages',
  id: '2',
  data: { parent: '4' },
})
```

**What Happens:**

1. **System detects parent change** for Clothing (id: '2')

2. **System fetches new parent** (Categories):

   - `_h_parentTree: []`
   - `_h_slugPath: 'categories'`

3. **System updates Clothing:**

   - Calculate new tree: `[] + ['4']` = `['4']`
   - Calculate new path: `'categories' + '/' + 'clothing'` = `'categories/clothing'`

4. **System finds descendants:**

   - Query: `where: { _h_parentTree: { in: ['2'] } }`
   - Found: Shirts (id: '3')

5. **System updates Shirts:**
   - **IMPORTANT:** `parent` field stays `'2'` (Shirts is still directly under Clothing!)
   - New tree: Take Clothing's new tree `['4']` + add Shirts' unchanged part `['2']` = `['4', '2']`
   - New path: `'categories/clothing/shirts'`

**AFTER STATE:**

```
┌─────────────────────────────────────┐
│ Categories (id: '4')                │
├─────────────────────────────────────┤
│ parent: null                        │
│ _h_parentTree: []                   │
│ _h_slugPath: 'categories'           │
└─────────────────────────────────────┘
    │
    └── Clothing (id: '2') ✨ UPDATED
        └── Shirts (id: '3') ✨ UPDATED

┌─────────────────────────────────────┐
│ Products (id: '1')                  │
├─────────────────────────────────────┤
│ parent: null                        │
│ _h_parentTree: []                   │
│ _h_slugPath: 'products'             │
└─────────────────────────────────────┘
    (now empty - Clothing moved away)

┌─────────────────────────────────────┐
│ Clothing (id: '2') ✨               │
├─────────────────────────────────────┤
│ parent: '4'          ← CHANGED      │
│ _h_parentTree: ['4'] ← CHANGED      │
│ _h_slugPath: 'categories/clothing'  │
│                      ← CHANGED      │
└─────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Shirts (id: '3') ✨                          │
├──────────────────────────────────────────────┤
│ parent: '2'          ← UNCHANGED!            │
│ _h_parentTree: ['4', '2']    ← CHANGED       │
│ _h_slugPath: 'categories/clothing/shirts'    │
│                              ← CHANGED       │
└──────────────────────────────────────────────┘
```

**Key Insight:**

- Descendants DON'T change their immediate `parent` relationship
- Only their `_h_parentTree` and paths are updated to reflect new position
- Shirts still knows its parent is Clothing (parent: '2')
- But now it knows the full ancestor chain includes Categories (tree: ['4', '2'])

---

## Flow 5: Moving with Draft Versions

**Setup:**

```
Products (id: '1')
└── Clothing (id: '2') - has both published and draft versions
```

**BEFORE STATE:**

_Main Collection (published data):_

```
┌─────────────────────────────────────┐
│ Clothing (id: '2')                  │
├─────────────────────────────────────┤
│ _status: 'published'                │
│ title: 'Clothing'                   │
│ _h_slugPath: 'products/clothing'    │
└─────────────────────────────────────┘
```

_Versions Table (\_pages_versions):_

```
┌─────────────────────────────────────┐
│ Version Record                      │
├─────────────────────────────────────┤
│ parent: '2'                         │
│ version: {                          │
│   _status: 'draft',                 │
│   title: 'Apparel',                 │
│   _h_slugPath: 'products/apparel'   │
│ }                                   │
└─────────────────────────────────────┘
```

**User Action:**

```ts
// Move Products to Categories
await payload.update({
  collection: 'pages',
  id: '1',
  data: { parent: '4' },
})
```

**What Happens:**

1. **System detects Clothing is a descendant**

2. **System checks:** Does Clothing have both published + draft?

   - Published query: `payload.find({ draft: false })` → Yes, found
   - Draft query: `payload.find({ draft: true })` → Yes, found

3. **System updates BOTH versions separately:**

   **Update 1: Published version** (`draft: false`)

   - Uses published title: 'Clothing'
   - Calculates path: `'categories/products/clothing'`

   **Update 2: Draft version** (`draft: true`)

   - Uses draft title: 'Apparel'
   - Calculates path: `'categories/products/apparel'`

**AFTER STATE:**

_Main Collection (published data):_

```
┌─────────────────────────────────────────────┐
│ Clothing (id: '2') ✨                       │
├─────────────────────────────────────────────┤
│ _status: 'published'                        │
│ title: 'Clothing'                           │
│ _h_slugPath: 'categories/products/clothing' │
│                                  ← CHANGED  │
└─────────────────────────────────────────────┘
```

_Versions Table (\_pages_versions):_

```
┌─────────────────────────────────────────────┐
│ Version Record ✨                            │
├─────────────────────────────────────────────┤
│ parent: '2'                                 │
│ version: {                                  │
│   _status: 'draft',                         │
│   title: 'Apparel',                         │
│   _h_slugPath: 'categories/products/apparel'│
│                                  ← CHANGED  │
│ }                                           │
└─────────────────────────────────────────────┘
```

**Key Insight:**

- Both versions stay in sync with new parent location
- But each version maintains its own path based on its own title
- Published uses 'Clothing' → `'categories/products/clothing'`
- Draft uses 'Apparel' → `'categories/products/apparel'`

---

## Flow 6: Draft-Only Title Change

**BEFORE STATE:**

_Main Collection (published data):_

```
┌─────────────────────────────────────┐
│ Clothing (id: '2')                  │
├─────────────────────────────────────┤
│ _status: 'published'                │
│ title: 'Clothing'                   │
│ _h_slugPath: 'products/clothing'    │
└─────────────────────────────────────┘
```

_Versions Table (\_pages_versions):_

```
┌─────────────────────────────────────┐
│ Version Record                      │
├─────────────────────────────────────┤
│ parent: '2'                         │
│ version: {                          │
│   _status: 'draft',                 │
│   title: 'Clothing',                │
│   _h_slugPath: 'products/clothing'  │
│ }                                   │
└─────────────────────────────────────┘
```

**User Action:**

```ts
// Change draft title (not published)
await payload.update({
  collection: 'pages',
  id: '2',
  data: { title: 'Apparel' },
  draft: true,
})
```

**What Happens:**

1. **System detects:** Draft-only title change

   - `operation === 'update'`
   - `doc._status === 'draft'`
   - `titleChanged === true`
   - `parentChanged === false`

2. **System skips main collection update**

   - Draft documents don't live in main collection
   - Only versions table needs updating

3. **System queries versions table:**

```ts
db.findVersions({
  where: {
    parent: { equals: '2' },
    'version._status': { equals: 'draft' },
  },
})
```

4. **System updates draft version record:**

```ts
db.updateVersion({
  versionData: {
    version: {
      ...existing,
      _h_slugPath: 'products/apparel', // New path with new title
    },
  },
})
```

**AFTER STATE:**

_Main Collection (published data):_

```
┌─────────────────────────────────────┐
│ Clothing (id: '2')                  │
├─────────────────────────────────────┤
│ _status: 'published'                │
│ title: 'Clothing'                   │
│ _h_slugPath: 'products/clothing'    │
└─────────────────────────────────────┘
     ↑
  UNCHANGED - Published version not affected
```

_Versions Table (\_pages_versions):_

```
┌─────────────────────────────────────┐
│ Version Record ✨                    │
├─────────────────────────────────────┤
│ parent: '2'                         │
│ version: {                          │
│   _status: 'draft',                 │
│   title: 'Apparel',      ← CHANGED │
│   _h_slugPath: 'products/apparel'   │
│                          ← CHANGED │
│ }                                   │
└─────────────────────────────────────┘
```

**Key Insight:**

- Draft-only changes ONLY affect versions table
- Main collection (published data) is completely untouched
- This allows draft and published to have independent paths
- When draft is eventually published, its data becomes the new published data

---

## Summary Table

| Action             | What Gets Updated                             | Key Fields Changed                                                  |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------- |
| Create root        | 1 new document                                | `_h_parentTree: []`, `_h_depth: 0`, paths                           |
| Create child       | 1 new document                                | `_h_parentTree: [parent]`, `_h_depth: 1`, paths                     |
| Create grandchild  | 1 new document                                | `_h_parentTree: [gp, p]`, `_h_depth: 2`, paths                      |
| Move document      | 1 document + all descendants                  | `parent`, `_h_parentTree`, paths (descendants keep their `parent`!) |
| Move with drafts   | Published + draft versions of all descendants | Both versions get separate updates                                  |
| Draft title change | Only draft version record                     | Only `version.version` in versions table                            |
