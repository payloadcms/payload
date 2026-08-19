import type { TypeWithID, Where } from 'payload'
import type { ReactNode, RefObject } from 'react'

export type HierarchyDocument = {
  [key: string]: unknown
} & TypeWithID

export type HierarchyInitialData = {
  baseFilter?: null | Where
  docs: HierarchyDocument[]
  // Metadata about what was loaded - keyed by parent ID ('null' for root)
  loadedParents: Record<string, { hasMore: boolean; loadedCount?: number; totalDocs: number }>
}

export type HierarchyTreeProps = {
  baseFilter?: null | Where
  collectionSlug: string
  filterByCollections?: string[]
  icon?: ReactNode
  /** Initial data for first render (before context hydration). After hydration, context data takes precedence. */
  initialData?: HierarchyInitialData | null
  /** Initial expanded nodes for first render (before context hydration). After hydration, context takes precedence. */
  initialExpandedNodes?: (number | string)[]
  onNodeClick?: ({ id }: { id: null | number | string }) => void
  selectedNodeId?: null | number | string
  useAsTitle?: string
}

// Tree primitive types (used by TreeNode, useChildren, HierarchyTree)

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

export type TreeCache = RefObject<Map<string, CachedChildren>>

export type TreeInitialData = {
  docs: TreeDocument[]
  loadedParents: Record<string, { hasMore: boolean; loadedCount?: number; totalDocs: number }>
}

export type TreeNodeProps = {
  allPossibleTypeValues?: string[]
  /**
   * Ids of this node's ancestors, so a folder can't be dropped into its own subtree.
   */
  ancestorIds?: (number | string)[]
  baseFilter?: null | Where
  cache: TreeCache
  collectionSlug: string
  depth: number
  /**
   * Parent field name to set on documents dropped onto this node. Omit to make the tree inert as a
   * drop target.
   */
  dropParentFieldName?: string
  expandedNodes: Set<number | string>
  filterByCollections?: string[]
  limit: number
  node: TreeNodeData
  onSelect?: ({ id }: { id: number | string }) => void
  onToggle: ({ id }: { id: number | string }) => void
  parentFieldName: string
  selected?: boolean
  selectedNodeId?: number | string
  typeFieldName?: null | string
  useAsTitle?: string
}
