import type { PaginatedDocs, TypeWithID } from 'payload'

export type HierarchyDocument = {
  [key: string]: unknown
  _hasChildren?: boolean
} & TypeWithID

export type HierarchyInitialData = {
  docs: HierarchyDocument[]
  loadedParents: Record<string, { hasMore: boolean; loadedCount?: number; totalDocs: number }>
}

export type HierarchyTreeCacheEntry = {
  docs: HierarchyDocument[]
  loadedParents: Record<string, { hasMore: boolean; loadedCount?: number; totalDocs: number }>
}

export type AllowedCollection = { label: string; slug: string }

export type HierarchyHydrateData = {
  allowedCollections?: AllowedCollection[] | null
  collectionSlug: string
  expandedNodes?: (number | string)[]
  /** The full data of the current parent (for accessing id, collectionSpecific values, etc.) */
  parent?: null | Record<string, unknown>
  parentFieldName?: string
  /** Initial selected filters from preferences */
  selectedFilters?: string[]
  tableData?: PaginatedDocs
  treeData?: HierarchyInitialData
  treeLimit?: number
  /** Field name for collection-specific restrictions (e.g., 'hierarchyType') */
  typeFieldName?: string
  useAsTitle?: string
  /** When set, updates the viewCollectionSlug in context (used by list view to indicate current collection) */
  viewCollectionSlug?: string
}

export type HierarchyContextValue = {
  allowedCollections: AllowedCollection[] | null
  collectionSlug: null | string
  expandedNodes: Set<number | string>
  /** Get expanded nodes for a specific collection (use this in tabs to avoid cross-tab state conflicts) */
  getExpandedNodesForCollection: (collectionSlug: string) => Set<number | string>
  getNodeChildren: (parentId: null | number | string) => HierarchyDocument[]
  /** Get tree data for a specific collection (returns null if not hydrated or cleared by refresh) */
  getTreeDataForCollection: (collectionSlug: string) => HierarchyInitialData | null
  hydrate: (data: HierarchyHydrateData) => void
  isLoadingMore: boolean
  loadingNodeId: null | number | string
  loadMoreChildren: (parentId: null | number | string) => Promise<void>
  /** The full data of the current parent (for accessing id, collectionSpecific values, etc.) */
  parent: null | (Record<string, unknown> & TypeWithID)
  parentFieldName: string
  /** Refresh the tree by clearing cache and incrementing refreshKey to force remount */
  refreshTree: () => void
  reset: () => void
  /** Selected collection type filters for the sidebar tree */
  selectedFilters: string[]
  selectParent: (id: null | number | string) => void
  /** Update selected filters (persists to preferences) */
  setSelectedFilters: (filters: string[]) => void
  toggleNode: (id: number | string) => void
  /** Toggle node expansion for a specific collection (use this in tabs to avoid cross-tab state conflicts) */
  toggleNodeForCollection: (collectionSlug: string, id: number | string) => void
  treeLimit: number
  /** Key that changes when tree should remount (incremented by refreshTree) */
  treeRefreshKey: number
  /** Field name for collection-specific restrictions (e.g., 'hierarchyType') */
  typeFieldName: null | string
  useAsTitle: null | string
  /** The collection slug of the currently viewed list (set by list view, used by sidebar tabs) */
  viewCollectionSlug: null | string
}

export type HierarchyProviderProps = {
  children: React.ReactNode
}

export type HydrateHierarchyProviderProps = {
  allowedCollections?: AllowedCollection[] | null
  collectionSlug: string
  expandedNodes?: (number | string)[]
  /** The full data of the current parent (for accessing id, collectionSpecific values, etc.) */
  parent?: null | Record<string, unknown>
  parentFieldName?: string
  /** Initial selected filters from preferences */
  selectedFilters?: string[]
  tableData?: PaginatedDocs
  treeData?: HierarchyInitialData
  treeLimit?: number
  /** Field name for collection-specific restrictions (e.g., 'hierarchyType') */
  typeFieldName?: string
  useAsTitle?: string
  /** When set, updates the viewCollectionSlug in context (used by list view to indicate current collection) */
  viewCollectionSlug?: string
}
