import type { MutableRefObject, ReactNode } from 'react'

export type TreeDocument = {
  [key: string]: unknown
  id: number | string
}

export type TreeNodeData = {
  hasChildren: boolean
  id: number | string
  title: string
}

export type CachedChildren = {
  children: TreeDocument[]
  hasMore: boolean
  page: number
  totalDocs: number
}

export type TreeCache = MutableRefObject<Map<string, CachedChildren>>

export type TreeInitialData = {
  docs: TreeDocument[]
  loadedParents: Record<string, { hasMore: boolean; loadedCount?: number; totalDocs: number }>
}

export type TreeProps = {
  collectionSlug: string
  expandedNodes: Set<number | string>
  filterByCollections?: string[]
  icon?: ReactNode
  initialData?: null | TreeInitialData
  onNodeClick?: (id: null | number | string) => void
  parentFieldName: string
  selectedNodeId?: null | number | string
  showAllOption?: boolean
  toggleNode: (id: number | string) => void
  treeLimit?: number
  typeFieldName?: string
  useAsTitle?: string
}

export type TreeNodeProps = {
  cache: TreeCache
  collectionSlug: string
  depth: number
  expandedNodes: Set<number | string>
  filterByCollections?: string[]
  limit: number
  node: TreeNodeData
  onSelect?: (id: number | string) => void
  onToggle: (id: number | string) => void
  parentFieldName: string
  selected?: boolean
  selectedNodeId?: number | string
  typeFieldName?: null | string
  useAsTitle?: string
}
