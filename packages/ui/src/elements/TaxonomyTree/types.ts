import type { TypeWithID } from 'payload'
import type React from 'react'

export type TaxonomyDocument = {
  [key: string]: unknown
} & TypeWithID

export type TaxonomyNode = {
  hasChildren: boolean
  id: number | string
  title: string
}

export type TaxonomyInitialData = {
  docs: TaxonomyDocument[]
  // Metadata about what was loaded - keyed by parent ID ('null' for root)
  loadedParents: Record<string, { hasMore: boolean; loadedCount?: number; totalDocs: number }>
}

export type TaxonomyTreeProps = {
  collectionSlug: string
  initialData?: null | TaxonomyInitialData
  onNodeClick?: (id: number | string) => void
  selectedNodeId?: null | number | string
  useAsTitle?: string
}

export type CachedChildren = {
  children: TaxonomyDocument[]
  hasMore: boolean
  page: number
  totalDocs: number
}

export type TreeNodeProps = {
  cache?: React.MutableRefObject<Map<string, CachedChildren>>
  collectionSlug: string
  depth?: number
  expandedNodes: Set<number | string>
  limit?: number
  node: TaxonomyNode
  onSelect: (id: number | string) => void
  onToggle: (id: number | string) => void
  parentFieldName: string
  selected: boolean
  selectedNodeId?: null | number | string
  useAsTitle?: string
}
