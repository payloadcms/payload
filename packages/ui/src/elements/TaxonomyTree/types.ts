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

export type CachedChildren<T = Record<string, unknown>> = {
  children: T[]
  hasMore: boolean
  page: number
  totalDocs: number
}

export type TreeNodeProps<T = Record<string, unknown>> = {
  cache?: React.MutableRefObject<Map<string, CachedChildren<T>>>
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
