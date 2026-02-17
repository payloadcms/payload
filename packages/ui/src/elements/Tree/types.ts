import type { ComponentType, MutableRefObject } from 'react'

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
  icon?: ComponentType
  initialData?: null | TreeInitialData
  onNodeClick?: (id: number | string) => void
  parentFieldName: string
  selectedNodeId?: number | string
  toggleNode: (id: number | string) => void
  treeLimit?: number
}

export type TreeNodeProps = {
  cache: TreeCache
  collectionSlug: string
  depth: number
  expandedNodes: Set<number | string>
  limit: number
  node: TreeNodeData
  onSelect?: (id: number | string) => void
  onToggle: (id: number | string) => void
  parentFieldName: string
  selected?: boolean
  selectedNodeId?: number | string
  useAsTitle?: string
}
