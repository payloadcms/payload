'use client'

import React, { useRef } from 'react'

import type { TaxonomyDocument, TaxonomyTreeProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { LoadMore } from './LoadMore/index.js'
import { TreeFocusProvider, useTreeFocus } from './TreeFocusContext.js'
import { TreeNode } from './TreeNode/index.js'
import { useChildren } from './useChildren.js'
import { useTreeState } from './useTreeState.js'
import './index.scss'

export { TaxonomySidebarTab } from './TaxonomySidebarTab.js'
export { TaxonomyTabIcon } from './TaxonomyTabIcon.js'

const baseClass = 'taxonomy-tree'

const getDocumentTitle = (doc: TaxonomyDocument, useAsTitle: string | undefined): string => {
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

const TaxonomyTreeInner: React.FC<TaxonomyTreeProps> = ({
  collectionSlug,
  onNodeClick,
  selectedNodeId,
}) => {
  const { expandedNodes, toggleNode } = useTreeState()
  const { getEntityConfig } = useConfig()
  const { moveFocus } = useTreeFocus()

  const collectionConfig = getEntityConfig({ collectionSlug })

  // Get parent field name from taxonomy config
  const parentFieldName =
    (collectionConfig.taxonomy && typeof collectionConfig.taxonomy === 'object'
      ? collectionConfig.taxonomy.parentFieldName
      : null) || 'parent'

  const childrenCache = useRef(new Map())
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
    limit: 50,
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

  if (isLoading && !rootNodes) {
    return (
      <div className={baseClass}>
        <div className={`${baseClass}__loading`}>Loading...</div>
      </div>
    )
  }

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
    <div className={baseClass} onKeyDown={handleTreeKeyDown} ref={treeRef} role="tree" tabIndex={0}>
      {rootNodes.map((node) => {
        const nodeId: number | string = node.id
        const nodeIdStr = typeof nodeId === 'number' ? String(nodeId) : nodeId
        const nodeTitle = getDocumentTitle(node, collectionConfig?.admin?.useAsTitle)
        const isSelected = nodeIdStr === String(selectedNodeId)

        return (
          <TreeNode
            cache={childrenCache}
            collectionSlug={collectionSlug}
            depth={0}
            expandedNodes={expandedNodes}
            key={nodeIdStr}
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
            useAsTitle={collectionConfig?.admin?.useAsTitle}
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

export const TaxonomyTree: React.FC<TaxonomyTreeProps> = (props) => {
  return (
    <TreeFocusProvider>
      <TaxonomyTreeInner {...props} />
    </TreeFocusProvider>
  )
}
