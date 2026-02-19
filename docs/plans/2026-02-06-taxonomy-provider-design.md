# TaxonomyProvider Design

**Date:** 2026-02-06
**Status:** Approved

## Overview

Implement a TaxonomyProvider that follows Payload's Hydrate Provider Pattern to share state between the sidebar tree and main content table, even though they render in separate parts of the DOM.

## Architecture

### 1. Provider Hierarchy

**TaxonomyProvider (Root Level)**

- Registered in `packages/ui/src/providers/Root/index.tsx` alongside AuthProvider
- Wraps the entire admin app
- Holds state for tree data, expanded nodes, and selected nodes
- Provides context methods for updating state

**HydrateTaxonomyProvider (View Level)**

- Used in views/components that need taxonomy data
- Takes server props (initialData, expandedNodes, selectedParentId)
- Calls context setters to hydrate the provider with fresh data
- Returns null (side-effects only)

**Usage Pattern**

- **Sidebar**: `TaxonomySidebarTabServer` renders `<HydrateTaxonomyProvider>` with tree data
- **List View**: Renders `<HydrateTaxonomyProvider>` with table data when taxonomy mode is active
- Both components use `useTaxonomy()` hook to access/update shared state

## Provider State Structure

```typescript
{
  // Collection metadata
  collectionSlug: string | null
  parentFieldName: string
  treeLimit: number

  // Tree data (cached by collection)
  treeCache: Map<
    string,
    {
      docs: TaxonomyDocument[]
      loadedParents: Record<string, { hasMore: boolean; totalDocs: number }>
    }
  >

  // UI state per collection
  expandedNodesByCollection: Map<string, Set<number | string>>
  selectedParentId: number | string | null

  // Loading states
  isLoadingMore: boolean
  loadingNodeId: number | string | null
}
```

### Key Context Methods

- `hydrate(data)` - Called by HydrateTaxonomyProvider to update state with server data
- `toggleNode(id)` - Expand/collapse a node, persists to preferences
- `selectParent(id)` - Update selected parent (also updates URL)
- `loadMoreChildren(parentId)` - Fetch more children for a node
- `getNodeChildren(parentId)` - Get cached children for a node
- `reset()` - Clear state when navigating away from taxonomy view

**Why Map for caching?**

- Supports multiple taxonomy collections in the same session
- Keyed by collectionSlug for O(1) lookups
- Can be cleared per-collection or entirely

## Hydration & Data Flow

### Server → Client Flow

**1. Initial Page Load (with ?parent=X)**

```
TaxonomySidebarTabServer (server)
  ├─ Fetches preferences + ancestor chain
  ├─ Calls getInitialTreeData(expandedNodes)
  └─ Renders: <HydrateTaxonomyProvider
                collectionSlug="tags"
                initialTreeData={...}
                expandedNodes={[...]}
                selectedParentId="123" />

List View Server Component (server)
  ├─ Calls handleTaxonomy(parentId)
  └─ Renders: <HydrateTaxonomyProvider
                collectionSlug="tags"
                selectedParentId="123"
                tableData={...} />
```

**2. Hydration (client)**

```tsx
// HydrateTaxonomyProvider runs useEffect
useEffect(() => {
  const { hydrate } = useTaxonomy()

  hydrate({
    collectionSlug,
    treeData: initialTreeData,
    expandedNodes,
    selectedParentId,
    tableData, // optional, from list view
  })
}, [collectionSlug, initialTreeData, expandedNodes, selectedParentId])

return null // Just side effects
```

**3. Components Read from Context**

```tsx
// In TaxonomyTree
const { expandedNodes, toggleNode, getNodeChildren } = useTaxonomy()

// In TaxonomyTable
const { selectedParentId } = useTaxonomy()
```

### Merge Strategy

When both sidebar and list view hydrate with data:

- **Tree data**: Append new docs, update loadedParents metadata
- **Expanded nodes**: Union of both sets
- **Selected parent**: Take most recent (last hydrate wins)

## Client-Side Interactions

### 1. Expanding/Collapsing Nodes

```tsx
// In TaxonomyTree component
const { toggleNode, expandedNodes } = useTaxonomy()

const handleToggle = (nodeId) => {
  toggleNode(nodeId) // Updates context state

  // Provider automatically:
  // - Toggles node in expandedNodes Set
  // - Persists to preferences API
  // - If expanding & children not cached: triggers loadMoreChildren()
}
```

### 2. Selecting a Parent (Navigation)

```tsx
// In TaxonomyTree when clicking a node
const { selectParent } = useTaxonomy()

const handleNodeClick = (nodeId) => {
  selectParent(nodeId) // Updates context + URL

  // Provider automatically:
  // - Updates selectedParentId state
  // - Pushes to router: /collections/tags?parent=123
  // - Server re-renders with new data
  // - HydrateTaxonomyProvider updates context again
}
```

### 3. Loading More Children

```tsx
// In LoadMore component
const { loadMoreChildren, isLoadingMore } = useTaxonomy()

const handleLoadMore = async () => {
  await loadMoreChildren(parentId)

  // Provider:
  // - Fetches next page from API
  // - Merges new docs into treeCache
  // - Updates loadedParents metadata (hasMore, totalDocs)
}
```

### Optimistic Updates

- **Toggle expand**: Immediate UI update, async preference save
- **Load more**: Show loading state, append results when ready
- **Select parent**: Update URL immediately, let server re-hydrate

## Preference Persistence

### Debounced Preference Updates

```tsx
// Inside TaxonomyProvider
const savePreferences = useDebouncedCallback(
  async (collectionSlug: string, expandedNodes: Set<number | string>) => {
    const preferenceKey = `${PREFERENCE_KEYS.TAXONOMY_TREE}-${collectionSlug}`

    await setPreference(preferenceKey, {
      expandedNodes: Array.from(expandedNodes),
    })
  },
  500, // Wait 500ms after last toggle before saving
)

const toggleNode = (nodeId: number | string) => {
  const currentExpanded =
    expandedNodesByCollection.get(collectionSlug) || new Set()
  const newExpanded = new Set(currentExpanded)

  if (newExpanded.has(nodeId)) {
    newExpanded.delete(nodeId)
  } else {
    newExpanded.add(nodeId)
  }

  setExpandedNodesByCollection((prev) =>
    new Map(prev).set(collectionSlug, newExpanded),
  )
  savePreferences(collectionSlug, newExpanded)
}
```

### Preference Lifecycle

- **Load**: Server reads preferences → passes to client
- **Update**: Client toggles node → debounced save to API
- **Reload**: Next page load reads updated preferences

## Implementation Files

### New Files

- `packages/ui/src/providers/Taxonomy/index.tsx` - TaxonomyProvider implementation
- `packages/ui/src/elements/HydrateTaxonomyProvider/index.tsx` - Hydration component

### Modified Files

- `packages/ui/src/providers/Root/index.tsx` - Add TaxonomyProvider wrapper
- `packages/ui/src/elements/TaxonomyTree/TaxonomySidebarTab.server.tsx` - Add HydrateTaxonomyProvider
- `packages/next/src/views/List/index.tsx` - Add HydrateTaxonomyProvider when taxonomy mode active
- `packages/ui/src/elements/TaxonomyTree/index.tsx` - Use useTaxonomy() hook
- `packages/ui/src/views/TaxonomyList/TaxonomyTable/index.tsx` - Use useTaxonomy() hook
- `packages/ui/src/exports/client/index.ts` - Export new components and hooks

## Success Criteria

1. Sidebar tree and main table can both read/write shared state
2. Expanded nodes persist across page navigation
3. Selecting a node in tree updates URL and main table view
4. Loading more children updates cache for both components
5. Multiple taxonomy collections can coexist without state conflicts
