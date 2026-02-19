'use client'

import React, { useMemo, useRef } from 'react'

import type { TreeDocument, TreeProps } from './types.js'

import { DelayedSpinner } from '../../elements/DelayedSpinner/index.js'
import { LoadMore } from './LoadMore/index.js'
import { TreeFocusProvider, useTreeFocus } from './TreeFocusContext.js'
import { TreeNode } from './TreeNode/index.js'
import { useChildren } from './useChildren.js'
import './index.scss'

const baseClass = 'tree'
const DEFAULT_TREE_LIMIT = 10

const getDocumentTitle = (doc: TreeDocument, useAsTitle: string | undefined): string => {
  const docId: number | string = doc.id
  const idStr = typeof docId === 'number' ? String(docId) : docId

  if (!useAsTitle) {
    return idStr
  }

  const value = doc[useAsTitle]
  if (value && (typeof value === 'string' || typeof value === 'number')) {
    return String(value)
  }
  return idStr
}

const TreeInner: React.FC<TreeProps> = ({
  collectionSlug,
  expandedNodes,
  initialData,
  onNodeClick,
  parentFieldName,
  selectedNodeId,
  toggleNode,
  treeLimit = DEFAULT_TREE_LIMIT,
  useAsTitle,
}) => {
  const { moveFocus } = useTreeFocus()

  // Pre-populate cache with initialData SYNCHRONOUSLY (before first render)
  // This ensures expanded children find their data immediately without client-side fetch
  const childrenCache = useRef(
    useMemo(() => {
      const cache = new Map()

      if (initialData && initialData.docs.length > 0) {
        // Group docs by parent to populate cache
        const docsByParent = new Map<string, TreeDocument[]>()

        for (const doc of initialData.docs) {
          const parentId = doc[parentFieldName] || 'null'
          const parentKey = String(parentId)

          if (!docsByParent.has(parentKey)) {
            docsByParent.set(parentKey, [])
          }
          const parentDocs = docsByParent.get(parentKey)
          if (parentDocs) {
            parentDocs.push(doc)
          }
        }

        // Populate cache with grouped docs and metadata from server
        for (const [parentKey, docs] of docsByParent) {
          const cacheKey = `${collectionSlug}-${parentKey}`
          const parentMeta = initialData.loadedParents[parentKey]

          if (parentMeta) {
            // Calculate page number based on loaded count
            // If server loaded multiple pages to find a selected node, loadedCount > treeLimit
            const loadedCount = parentMeta.loadedCount ?? docs.length
            const currentPage = Math.ceil(loadedCount / treeLimit) || 1

            cache.set(cacheKey, {
              children: docs,
              hasMore: parentMeta.hasMore,
              page: currentPage,
              totalDocs: parentMeta.totalDocs,
            })
          } else {
            // Shouldn't happen, but fallback to conservative estimate
            cache.set(cacheKey, {
              children: docs,
              hasMore: false,
              page: 1,
              totalDocs: docs.length,
            })
          }
        }
      }

      return cache
    }, [initialData, parentFieldName, collectionSlug, treeLimit]),
  )
  const treeRef = useRef<HTMLDivElement>(null)

  // Fetch root nodes (items with no parent)
  const {
    children: rootNodes,
    hasMore,
    isLoading,
    loadMore: loadMoreFromHook,
    totalDocs,
  } = useChildren({
    cache: childrenCache,
    collectionSlug,
    enabled: true,
    initialData,
    limit: treeLimit,
    parentFieldName,
    parentId: 'null', // Special value to query for null parent
  })

  // Wrap loadMore - focusedId stays the same, tabindex handles the rest
  const handleLoadMore = React.useCallback(async () => {
    await loadMoreFromHook()
  }, [loadMoreFromHook])

  const handleNodeClick = (id: number | string) => {
    if (onNodeClick) {
      onNodeClick(id)
    }
  }

  // Show loading state with delay to prevent flash
  if (isLoading && !rootNodes) {
    return (
      <div className={baseClass}>
        <DelayedSpinner baseClass={baseClass} isLoading={true} />
      </div>
    )
  }

  // Show empty state after loading completes
  if (!rootNodes || rootNodes.length === 0) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__empty`}>No items</div>
      </div>
    )
  }

  const handleTreeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveFocus('down')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveFocus('up')
    }
  }

  return (
    <div
      className={baseClass}
      onKeyDown={handleTreeKeyDown}
      ref={treeRef}
      role="tree"
      tabIndex={-1}
    >
      {rootNodes.map((node) => {
        const nodeId: number | string = node.id
        const nodeIdStr = typeof nodeId === 'number' ? String(nodeId) : nodeId
        const nodeTitle = getDocumentTitle(node, useAsTitle)
        const isSelected = nodeIdStr === String(selectedNodeId)

        return (
          <TreeNode
            cache={childrenCache}
            collectionSlug={collectionSlug}
            depth={0}
            expandedNodes={expandedNodes}
            key={nodeIdStr}
            limit={treeLimit}
            node={{
              id: nodeId,
              hasChildren: true,
              title: nodeTitle,
            }}
            onSelect={handleNodeClick}
            onToggle={toggleNode}
            parentFieldName={parentFieldName}
            selected={isSelected}
            selectedNodeId={selectedNodeId}
            useAsTitle={useAsTitle}
          />
        )
      })}
      {hasMore && (
        <LoadMore
          currentCount={rootNodes.length}
          depth={0}
          id="load-more-root"
          onLoadMore={handleLoadMore}
          totalDocs={totalDocs}
        />
      )}
    </div>
  )
}

export const Tree: React.FC<TreeProps> = (props) => {
  return (
    <TreeFocusProvider>
      <TreeInner {...props} />
    </TreeFocusProvider>
  )
}
