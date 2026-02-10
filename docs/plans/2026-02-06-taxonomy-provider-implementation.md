# TaxonomyProvider Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement TaxonomyProvider that shares state between sidebar tree and main table using Payload's Hydrate Provider Pattern

**Architecture:** Provider wraps entire admin app at root level. Server components hydrate it with data via HydrateTaxonomyProvider. Both sidebar and list view access shared state via useTaxonomy() hook.

**Tech Stack:** React Context API, Next.js Server Components, Payload preferences API

---

## Task 1: Update TaxonomyProvider Types

**Files:**

- Modify: `packages/ui/src/providers/Taxonomy/types.ts`

**Step 1: Update types to match design**

Replace the entire file content with new type definitions:

```typescript
import type { PaginatedDocs } from 'payload'

export type TaxonomyDocument = {
  [key: string]: unknown
  _hasChildren?: boolean
  createdAt: string
  id: number | string
  updatedAt: string
}

export type InitialTreeData = {
  docs: TaxonomyDocument[]
  loadedParents: Record<string, { hasMore: boolean; totalDocs: number }>
}

export type TreeCacheEntry = {
  docs: TaxonomyDocument[]
  loadedParents: Record<string, { hasMore: boolean; totalDocs: number }>
}

export type HydrateData = {
  collectionSlug: string
  expandedNodes?: (number | string)[]
  parentFieldName?: string
  selectedParentId?: null | number | string
  tableData?: PaginatedDocs
  treeData?: InitialTreeData
  treeLimit?: number
}

export type TaxonomyContextValue = {
  collectionSlug: null | string
  expandedNodes: Set<number | string>
  getNodeChildren: (parentId: null | number | string) => TaxonomyDocument[]
  hydrate: (data: HydrateData) => void
  isLoadingMore: boolean
  loadingNodeId: null | number | string
  loadMoreChildren: (parentId: null | number | string) => Promise<void>
  parentFieldName: string
  reset: () => void
  selectParent: (id: null | number | string) => void
  selectedParentId: null | number | string
  toggleNode: (id: number | string) => void
  treeLimit: number
}

export type TaxonomyProviderProps = {
  children: React.ReactNode
}

export type HydrateTaxonomyProviderProps = {
  collectionSlug: string
  expandedNodes?: (number | string)[]
  parentFieldName?: string
  selectedParentId?: null | number | string
  tableData?: PaginatedDocs
  treeData?: InitialTreeData
  treeLimit?: number
}
```

**Step 2: Commit type updates**

```bash
git add packages/ui/src/providers/Taxonomy/types.ts
git commit -m "feat(ui): update TaxonomyProvider types for hydrate pattern"
```

---

## Task 2: Create TaxonomyProvider Implementation

**Files:**

- Create: `packages/ui/src/providers/Taxonomy/index.tsx`

**Step 1: Create provider skeleton**

```typescript
'use client'

import type { TaxonomyContextValue, TaxonomyProviderProps } from './types.js'

import { useRouter } from 'next/navigation.js'
import { DEFAULT_TAXONOMY_TREE_LIMIT } from 'payload'
import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import React, { createContext, use, useCallback, useMemo, useState } from 'react'

import { useConfig } from '../Config/index.js'
import { usePreferences } from '../Preferences/index.js'

const TaxonomyContext = createContext<TaxonomyContextValue | undefined>(undefined)

export function TaxonomyProvider({ children }: TaxonomyProviderProps) {
  // State will go here
  const [collectionSlug, setCollectionSlug] = useState<null | string>(null)
  const [selectedParentId, setSelectedParentId] = useState<null | number | string>(null)
  const [parentFieldName, setParentFieldName] = useState<string>('parent')
  const [treeLimit, setTreeLimit] = useState<number>(DEFAULT_TAXONOMY_TREE_LIMIT)

  // TODO: Add remaining state and methods

  const value: TaxonomyContextValue = {
    collectionSlug,
    expandedNodes: new Set(),
    getNodeChildren: () => [],
    hydrate: () => {},
    isLoadingMore: false,
    loadingNodeId: null,
    loadMoreChildren: async () => {},
    parentFieldName,
    reset: () => {},
    selectParent: () => {},
    selectedParentId,
    toggleNode: () => {},
    treeLimit,
  }

  return <TaxonomyContext value={value}>{children}</TaxonomyContext>
}

export function useTaxonomy(): TaxonomyContextValue {
  const context = use(TaxonomyContext)
  if (!context) {
    throw new Error('useTaxonomy must be used within TaxonomyProvider')
  }
  return context
}
```

**Step 2: Add tree cache state**

Add after the basic state declarations:

```typescript
const [treeCache, setTreeCache] = useState<Map<string, TreeCacheEntry>>(
  new Map(),
)
const [expandedNodesByCollection, setExpandedNodesByCollection] = useState<
  Map<string, Set<number | string>>
>(new Map())
const [isLoadingMore, setIsLoadingMore] = useState(false)
const [loadingNodeId, setLoadingNodeId] = useState<null | number | string>(null)
```

Import TreeCacheEntry type at top:

```typescript
import type {
  TaxonomyContextValue,
  TaxonomyProviderProps,
  TreeCacheEntry,
} from './types.js'
```

**Step 3: Implement getNodeChildren method**

```typescript
const getNodeChildren = useCallback(
  (parentId: null | number | string): TaxonomyDocument[] => {
    if (!collectionSlug) {
      return []
    }

    const cacheEntry = treeCache.get(collectionSlug)
    if (!cacheEntry) {
      return []
    }

    const parentKey = parentId === null ? 'null' : String(parentId)

    // Filter docs that belong to this parent
    return cacheEntry.docs.filter((doc) => {
      const docParent = doc[parentFieldName]
      const docParentKey =
        docParent === null || docParent === undefined
          ? 'null'
          : String(docParent)
      return docParentKey === parentKey
    })
  },
  [collectionSlug, parentFieldName, treeCache],
)
```

**Step 4: Commit provider skeleton**

```bash
git add packages/ui/src/providers/Taxonomy/index.tsx
git commit -m "feat(ui): add TaxonomyProvider skeleton with getNodeChildren"
```

---

## Task 3: Implement Hydrate Method

**Files:**

- Modify: `packages/ui/src/providers/Taxonomy/index.tsx`

**Step 1: Add hydrate method**

Add import at top:

```typescript
import type { HydrateData, TaxonomyDocument } from './types.js'
```

Add hydrate method:

```typescript
const hydrate = useCallback((data: HydrateData) => {
  const {
    collectionSlug: newCollectionSlug,
    expandedNodes,
    parentFieldName: newParentFieldName,
    selectedParentId: newSelectedParentId,
    tableData,
    treeData,
    treeLimit: newTreeLimit,
  } = data

  // Update collection metadata
  setCollectionSlug(newCollectionSlug)
  if (newParentFieldName) {
    setParentFieldName(newParentFieldName)
  }
  if (newTreeLimit) {
    setTreeLimit(newTreeLimit)
  }
  if (newSelectedParentId !== undefined) {
    setSelectedParentId(newSelectedParentId)
  }

  // Merge tree data into cache
  if (treeData) {
    setTreeCache((prev) => {
      const newCache = new Map(prev)
      const existing = newCache.get(newCollectionSlug)

      if (existing) {
        // Merge: append new docs, update loadedParents
        const mergedDocs = [...existing.docs]
        const seenIds = new Set(existing.docs.map((d) => d.id))

        for (const doc of treeData.docs) {
          if (!seenIds.has(doc.id)) {
            mergedDocs.push(doc)
          }
        }

        newCache.set(newCollectionSlug, {
          docs: mergedDocs,
          loadedParents: {
            ...existing.loadedParents,
            ...treeData.loadedParents,
          },
        })
      } else {
        // First hydration for this collection
        newCache.set(newCollectionSlug, {
          docs: treeData.docs,
          loadedParents: treeData.loadedParents,
        })
      }

      return newCache
    })
  }

  // Merge expanded nodes
  if (expandedNodes && expandedNodes.length > 0) {
    setExpandedNodesByCollection((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(newCollectionSlug) || new Set()
      const merged = new Set([...Array.from(existing), ...expandedNodes])
      newMap.set(newCollectionSlug, merged)
      return newMap
    })
  }
}, [])
```

**Step 2: Update value object**

Update the value object to use hydrate:

```typescript
const expandedNodes = collectionSlug
  ? expandedNodesByCollection.get(collectionSlug) || new Set()
  : new Set()

const value: TaxonomyContextValue = {
  collectionSlug,
  expandedNodes,
  getNodeChildren,
  hydrate,
  isLoadingMore,
  loadingNodeId,
  loadMoreChildren: async () => {}, // TODO
  parentFieldName,
  reset: () => {}, // TODO
  selectParent: () => {}, // TODO
  selectedParentId,
  toggleNode: () => {}, // TODO
  treeLimit,
}
```

**Step 3: Commit hydrate implementation**

```bash
git add packages/ui/src/providers/Taxonomy/index.tsx
git commit -m "feat(ui): implement TaxonomyProvider hydrate method"
```

---

## Task 4: Implement Toggle Node with Debounced Preferences

**Files:**

- Modify: `packages/ui/src/providers/Taxonomy/index.tsx`

**Step 1: Add debounced preference save**

Add imports at top:

```typescript
import { useDebouncedCallback } from 'use-debounce'
```

Add inside TaxonomyProvider function, before the hydrate method:

```typescript
const { setPreference } = usePreferences()

const savePreferences = useDebouncedCallback(
  async (slug: string, nodes: Set<number | string>) => {
    const preferenceKey = `${PREFERENCE_KEYS.TAXONOMY_TREE}-${slug}`
    await setPreference(preferenceKey, {
      expandedNodes: Array.from(nodes),
    })
  },
  500, // 500ms debounce
)
```

**Step 2: Implement toggleNode**

Add after hydrate method:

```typescript
const toggleNode = useCallback(
  (nodeId: number | string) => {
    if (!collectionSlug) {
      return
    }

    setExpandedNodesByCollection((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(collectionSlug) || new Set()
      const updated = new Set(current)

      if (updated.has(nodeId)) {
        updated.delete(nodeId)
      } else {
        updated.add(nodeId)
      }

      newMap.set(collectionSlug, updated)

      // Debounced save
      savePreferences(collectionSlug, updated)

      return newMap
    })
  },
  [collectionSlug, savePreferences],
)
```

**Step 3: Update value object**

Update the value object:

```typescript
const value: TaxonomyContextValue = {
  collectionSlug,
  expandedNodes,
  getNodeChildren,
  hydrate,
  isLoadingMore,
  loadingNodeId,
  loadMoreChildren: async () => {}, // TODO
  parentFieldName,
  reset: () => {}, // TODO
  selectParent: () => {}, // TODO
  selectedParentId,
  toggleNode,
  treeLimit,
}
```

**Step 4: Commit toggleNode implementation**

```bash
git add packages/ui/src/providers/Taxonomy/index.tsx
git commit -m "feat(ui): implement toggleNode with debounced preferences"
```

---

## Task 5: Implement SelectParent and Reset Methods

**Files:**

- Modify: `packages/ui/src/providers/Taxonomy/index.tsx`

**Step 1: Add selectParent method**

Add after toggleNode:

```typescript
const router = useRouter()
const {
  config: {
    routes: { admin: adminRoute },
  },
} = useConfig()

const selectParent = useCallback(
  (id: null | number | string) => {
    if (!collectionSlug) {
      return
    }

    setSelectedParentId(id)

    // Update URL
    const url = formatAdminURL({
      adminRoute,
      path: id
        ? `/collections/${collectionSlug}?parent=${id}`
        : `/collections/${collectionSlug}`,
    })

    router.push(url)
  },
  [adminRoute, collectionSlug, router],
)
```

**Step 2: Add reset method**

```typescript
const reset = useCallback(() => {
  setCollectionSlug(null)
  setSelectedParentId(null)
  setParentFieldName('parent')
  setTreeLimit(DEFAULT_TAXONOMY_TREE_LIMIT)
  setTreeCache(new Map())
  setExpandedNodesByCollection(new Map())
  setIsLoadingMore(false)
  setLoadingNodeId(null)
}, [])
```

**Step 3: Update value object**

```typescript
const value: TaxonomyContextValue = {
  collectionSlug,
  expandedNodes,
  getNodeChildren,
  hydrate,
  isLoadingMore,
  loadingNodeId,
  loadMoreChildren: async () => {}, // TODO
  parentFieldName,
  reset,
  selectParent,
  selectedParentId,
  toggleNode,
  treeLimit,
}
```

**Step 4: Commit selectParent and reset**

```bash
git add packages/ui/src/providers/Taxonomy/index.tsx
git commit -m "feat(ui): implement selectParent and reset methods"
```

---

## Task 6: Implement LoadMoreChildren Method

**Files:**

- Modify: `packages/ui/src/providers/Taxonomy/index.tsx`

**Step 1: Add API request logic**

Add imports:

```typescript
import { requests } from '../../utilities/api.js'
```

Add loadMoreChildren method:

```typescript
const loadMoreChildren = useCallback(
  async (parentId: null | number | string) => {
    if (!collectionSlug || isLoadingMore) {
      return
    }

    const cacheEntry = treeCache.get(collectionSlug)
    if (!cacheEntry) {
      return
    }

    const parentKey = parentId === null ? 'null' : String(parentId)
    const parentMeta = cacheEntry.loadedParents[parentKey]

    if (!parentMeta || !parentMeta.hasMore) {
      return
    }

    setIsLoadingMore(true)
    setLoadingNodeId(parentId)

    try {
      const currentChildren = getNodeChildren(parentId)
      const nextPage = Math.floor(currentChildren.length / treeLimit) + 1

      const whereClause =
        parentId === null
          ? { [parentFieldName]: { exists: false } }
          : { [parentFieldName]: { equals: parentId } }

      const response = await requests.get(
        `/${collectionSlug}?page=${nextPage}&limit=${treeLimit}&where=${JSON.stringify(whereClause)}&depth=0`,
      )

      if (!response.ok) {
        throw new Error('Failed to load more children')
      }

      const data = await response.json()

      // Merge new docs into cache
      setTreeCache((prev) => {
        const newCache = new Map(prev)
        const existing = newCache.get(collectionSlug)

        if (existing) {
          newCache.set(collectionSlug, {
            docs: [...existing.docs, ...data.docs],
            loadedParents: {
              ...existing.loadedParents,
              [parentKey]: {
                hasMore: data.hasNextPage,
                totalDocs: data.totalDocs,
              },
            },
          })
        }

        return newCache
      })
    } catch (error) {
      // Silent fail - UI will show stale state
      console.error('Failed to load more children:', error)
    } finally {
      setIsLoadingMore(false)
      setLoadingNodeId(null)
    }
  },
  [
    collectionSlug,
    getNodeChildren,
    isLoadingMore,
    parentFieldName,
    treeCache,
    treeLimit,
  ],
)
```

**Step 2: Update value object**

```typescript
const value: TaxonomyContextValue = {
  collectionSlug,
  expandedNodes,
  getNodeChildren,
  hydrate,
  isLoadingMore,
  loadingNodeId,
  loadMoreChildren,
  parentFieldName,
  reset,
  selectParent,
  selectedParentId,
  toggleNode,
  treeLimit,
}
```

**Step 3: Commit loadMoreChildren**

```bash
git add packages/ui/src/providers/Taxonomy/index.tsx
git commit -m "feat(ui): implement loadMoreChildren method"
```

---

## Task 7: Create HydrateTaxonomyProvider Component

**Files:**

- Create: `packages/ui/src/elements/HydrateTaxonomyProvider/index.tsx`

**Step 1: Create hydration component**

```typescript
'use client'

import type { HydrateTaxonomyProviderProps } from '../../providers/Taxonomy/types.js'

import { useEffect } from 'react'

import { useTaxonomy } from '../../providers/Taxonomy/index.js'

export function HydrateTaxonomyProvider({
  collectionSlug,
  expandedNodes,
  parentFieldName,
  selectedParentId,
  tableData,
  treeData,
  treeLimit,
}: HydrateTaxonomyProviderProps) {
  const { hydrate } = useTaxonomy()

  useEffect(() => {
    hydrate({
      collectionSlug,
      expandedNodes,
      parentFieldName,
      selectedParentId,
      tableData,
      treeData,
      treeLimit,
    })
  }, [
    collectionSlug,
    expandedNodes,
    hydrate,
    parentFieldName,
    selectedParentId,
    tableData,
    treeData,
    treeLimit,
  ])

  return null
}
```

**Step 2: Commit HydrateTaxonomyProvider**

```bash
git add packages/ui/src/elements/HydrateTaxonomyProvider/index.tsx
git commit -m "feat(ui): add HydrateTaxonomyProvider component"
```

---

## Task 8: Register TaxonomyProvider in Root

**Files:**

- Modify: `packages/ui/src/providers/Root/index.tsx`

**Step 1: Add TaxonomyProvider import**

Find the imports section and add:

```typescript
import { TaxonomyProvider } from '../Taxonomy/index.js'
```

**Step 2: Wrap content with TaxonomyProvider**

Find the AuthProvider wrapper (around line 106) and wrap it with TaxonomyProvider:

```typescript
<TaxonomyProvider>
  <AuthProvider permissions={permissions} user={user}>
    {/* existing content */}
  </AuthProvider>
</TaxonomyProvider>
```

The full nesting should look like:

```typescript
<ConfigProvider config={config}>
  <I18nProvider i18n={i18n}>
    <PreferencesProvider>
      <TaxonomyProvider>
        <AuthProvider permissions={permissions} user={user}>
          {/* ... rest of providers */}
        </AuthProvider>
      </TaxonomyProvider>
    </PreferencesProvider>
  </I18nProvider>
</ConfigProvider>
```

**Step 3: Commit Root provider registration**

```bash
git add packages/ui/src/providers/Root/index.tsx
git commit -m "feat(ui): register TaxonomyProvider in Root"
```

---

## Task 9: Export New Components and Hooks

**Files:**

- Modify: `packages/ui/src/exports/client/index.ts`

**Step 1: Add exports**

Find the providers section and add:

```typescript
export {
  TaxonomyProvider,
  useTaxonomy,
} from '../../providers/Taxonomy/index.js'
export type {
  HydrateData,
  HydrateTaxonomyProviderProps,
  InitialTreeData,
  TaxonomyContextValue,
  TaxonomyDocument,
  TaxonomyProviderProps,
  TreeCacheEntry,
} from '../../providers/Taxonomy/types.js'
```

Find the elements section and add:

```typescript
export { HydrateTaxonomyProvider } from '../../elements/HydrateTaxonomyProvider/index.js'
```

**Step 2: Commit exports**

```bash
git add packages/ui/src/exports/client/index.ts
git commit -m "feat(ui): export TaxonomyProvider and HydrateTaxonomyProvider"
```

---

## Task 10: Add HydrateTaxonomyProvider to Sidebar

**Files:**

- Modify: `packages/ui/src/elements/TaxonomyTree/TaxonomySidebarTab.server.tsx`

**Step 1: Add import**

Add at top:

```typescript
import { HydrateTaxonomyProvider } from '../HydrateTaxonomyProvider/index.js'
```

**Step 2: Wrap TaxonomySidebarTab with HydrateTaxonomyProvider**

Replace the return statement (around line 119):

```typescript
return (
  <>
    <HydrateTaxonomyProvider
      collectionSlug={collectionSlug}
      expandedNodes={initialExpandedNodes}
      parentFieldName={
        collectionConfig?.taxonomy && typeof collectionConfig.taxonomy === 'object'
          ? collectionConfig.taxonomy.parentFieldName || 'parent'
          : 'parent'
      }
      selectedParentId={searchParams?.parent ? String(searchParams.parent) : null}
      treeData={initialData}
      treeLimit={treeLimit}
    />
    <TaxonomySidebarTab
      collectionSlug={collectionSlug}
      initialData={initialData}
      initialExpandedNodes={initialExpandedNodes}
    />
  </>
)
```

**Step 3: Commit sidebar hydration**

```bash
git add packages/ui/src/elements/TaxonomyTree/TaxonomySidebarTab.server.tsx
git commit -m "feat(ui): add HydrateTaxonomyProvider to sidebar"
```

---

## Task 11: Add HydrateTaxonomyProvider to List View

**Files:**

- Modify: `packages/next/src/views/List/index.tsx`

**Step 1: Add import**

Add to imports:

```typescript
import { HydrateTaxonomyProvider } from '@payloadcms/ui'
```

**Step 2: Add hydration after HydrateAuthProvider**

Find where HydrateAuthProvider is rendered (line 441) and add after it:

```typescript
<HydrateAuthProvider permissions={permissions} />
{taxonomyData && (
  <HydrateTaxonomyProvider
    collectionSlug={collectionSlug}
    parentFieldName={taxonomyData.parentFieldName}
    selectedParentId={taxonomyData.parentId}
    treeLimit={
      collectionConfig?.taxonomy && typeof collectionConfig.taxonomy === 'object'
        ? collectionConfig.taxonomy.treeLimit
        : undefined
    }
  />
)}
```

**Step 3: Commit list view hydration**

```bash
git add packages/next/src/views/List/index.tsx
git commit -m "feat(next): add HydrateTaxonomyProvider to list view"
```

---

## Success Verification

After completing all tasks:

1. Start dev server: `pnpm run dev taxonomy`
2. Navigate to taxonomy collection with ?parent=X
3. Verify sidebar tree shows expanded ancestor path
4. Verify main table shows children of selected parent
5. Click different node in tree - verify URL updates and table refreshes
6. Expand/collapse nodes - verify state persists on page reload
7. Load more children - verify updates appear in tree

The provider should now be fully functional for sharing state between sidebar and main content.
