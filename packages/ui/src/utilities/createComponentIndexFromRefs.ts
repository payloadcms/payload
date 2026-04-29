import type { ComponentIndex, IndexedComponent } from 'payload'

import { filterRefsToSubtree } from 'payload'

/**
 * Wraps a flat `IndexedComponent[]` (typically `clientConfig.componentRefs`)
 * with the same `componentsAt(subtreePath)` API exposed by the server-side
 * `ComponentIndex` returned from `buildComponentIndex`. Reuses
 * `filterRefsToSubtree` so wildcard specialization stays bit-for-bit identical
 * across the server and client.
 */
export function createComponentIndexFromRefs(refs: IndexedComponent[]): ComponentIndex {
  const owned = refs.slice()
  return {
    all: () => owned.slice(),
    componentsAt: (subtreePath) => filterRefsToSubtree(owned, subtreePath),
  }
}
