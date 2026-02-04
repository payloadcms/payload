import type React from 'react'

export type TaxonomyDocument = {
  [key: string]: unknown
  createdAt: string
  id: number | string
  updatedAt: string
}

export type TaxonomyNode = {
  hasChildren: boolean
  id: number | string
  title: string
}

export type TaxonomyTreeProps = {
  collectionSlug: string
  onNodeClick?: (id: number | string) => void
  selectedNodeId?: null | number | string
}

export type CachedChildren = {
  children: Record<string, unknown>[]
  hasMore: boolean
  page: number
  totalDocs: number
}

export type TreeNodeProps = {
  cache?: React.MutableRefObject<Map<string, CachedChildren>>
  collectionSlug: string
  depth?: number
  expandedNodes: Set<number | string>
  node: TaxonomyNode
  onSelect: (id: number | string) => void
  onToggle: (id: number | string) => void
  parentFieldName: string
  selected: boolean
  selectedNodeId?: null | number | string
  useAsTitle?: string
}
