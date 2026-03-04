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

export type HierarchyHydrateData = {
  allowedCollections?: null | string[]
  collectionSlug: string
  expandedNodes?: (number | string)[]
  /** The full data of the current parent (for accessing id, collectionSpecific values, etc.) */
  parent?: null | Record<string, unknown>
  parentFieldName?: string
  tableData?: PaginatedDocs
  treeData?: HierarchyInitialData
  treeLimit?: number
  useAsTitle?: string
}

export type HierarchyContextValue = {
  allowedCollections: null | string[]
  collectionSlug: null | string
  expandedNodes: Set<number | string>
  getNodeChildren: (parentId: null | number | string) => HierarchyDocument[]
  hydrate: (data: HierarchyHydrateData) => void
  isLoadingMore: boolean
  loadingNodeId: null | number | string
  loadMoreChildren: (parentId: null | number | string) => Promise<void>
  /** The full data of the current parent (for accessing id, collectionSpecific values, etc.) */
  parent: null | Record<string, unknown>
  parentFieldName: string
  reset: () => void
  selectParent: (id: null | number | string) => void
  toggleNode: (id: number | string) => void
  treeLimit: number
  useAsTitle: null | string
}

export type HierarchyProviderProps = {
  children: React.ReactNode
}

export type HydrateHierarchyProviderProps = {
  allowedCollections?: null | string[]
  collectionSlug: string
  expandedNodes?: (number | string)[]
  /** The full data of the current parent (for accessing id, collectionSpecific values, etc.) */
  parent?: null | Record<string, unknown>
  parentFieldName?: string
  tableData?: PaginatedDocs
  treeData?: HierarchyInitialData
  treeLimit?: number
  useAsTitle?: string
}
