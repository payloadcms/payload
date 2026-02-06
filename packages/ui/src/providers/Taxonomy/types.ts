import type { PaginatedDocs, Where } from 'payload'

export type TaxonomyDocument = {
  [key: string]: unknown
  createdAt: string
  id: number | string
  updatedAt: string
}

export type TaxonomyTreeNode = {
  hasChildren: boolean
  id: number | string
  title: string
}

export type TaxonomyMetadata = {
  collectionSlug: string
  parentFieldName: string
  relatedCollections?: string[]
  titlePathFieldName?: string
}

export type TaxonomyTreeData = {
  docs: TaxonomyDocument[]
}

export type TaxonomyContextValue = {
  collectionSlug: string
  expandedNodeIds: (number | string)[]
  metadata: TaxonomyMetadata
  selectedParentId: null | number | string
  setExpandedNodeIds: (ids: (number | string)[]) => void
  treeData: null | TaxonomyTreeData
}

export type TaxonomyProviderProps = {
  children: React.ReactNode
  disabled?: boolean
  initialExpandedNodeIds?: (number | string)[]
  initialTreeData?: null | TaxonomyTreeData
  metadata: TaxonomyMetadata
  selectedParentId?: null | number | string
}
