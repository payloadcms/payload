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
  collectionSlug: string
  expandedNodes?: (number | string)[]
  parentFieldName?: string
  selectedParentId?: null | number | string
  tableData?: PaginatedDocs
  treeData?: HierarchyInitialData
  treeLimit?: number
}

export type HierarchyContextValue = {
  collectionSlug: null | string
  expandedNodes: Set<number | string>
  getNodeChildren: (parentId: null | number | string) => HierarchyDocument[]
  hydrate: (data: HierarchyHydrateData) => void
  isLoadingMore: boolean
  loadingNodeId: null | number | string
  loadMoreChildren: (parentId: null | number | string) => Promise<void>
  parentFieldName: string
  reset: () => void
  selectedParentId: null | number | string
  selectParent: (id: null | number | string) => void
  toggleNode: (id: number | string) => void
  treeLimit: number
}

export type HierarchyProviderProps = {
  children: React.ReactNode
}

export type HydrateHierarchyProviderProps = {
  collectionSlug: string
  expandedNodes?: (number | string)[]
  parentFieldName?: string
  selectedParentId?: null | number | string
  tableData?: PaginatedDocs
  treeData?: HierarchyInitialData
  treeLimit?: number
}
