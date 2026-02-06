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
  selectedParentId: null | number | string
  selectParent: (id: null | number | string) => void
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
