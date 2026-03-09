'use client'

import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import React, { useId, useMemo, useRef } from 'react'

import type { TreeDocument, TreeProps } from './types.js'

import { CreateDocumentButton } from '../../elements/CreateDocumentButton/index.js'
import { DelayedSpinner } from '../../elements/DelayedSpinner/index.js'
import { TagIcon } from '../../icons/Tag/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { LoadMore } from './LoadMore/index.js'
import { TreeFocusProvider, useTreeFocus } from './TreeFocusContext.js'
import './index.scss'
import { TreeNode } from './TreeNode/index.js'
import { useChildren } from './useChildren.js'

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
  allPossibleTypeValues,
  collectionSlug,
  expandedNodes,
  filterByCollections,
  icon,
  initialData,
  onNodeClick,
  parentFieldName,
  selectedNodeId,
  showAllOption = true,
  toggleNode,
  treeLimit = DEFAULT_TREE_LIMIT,
  typeFieldName,
  useAsTitle,
}) => {
  const { moveFocus } = useTreeFocus()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { getEntityConfig } = useConfig()
  const createDrawerSlug = `tree-create-${useId()}`

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
        const filterKey = filterByCollections?.length
          ? filterByCollections.slice().sort().join(',')
          : ''
        for (const [parentKey, docs] of docsByParent) {
          const cacheKey = `${collectionSlug}-${parentKey}-${filterKey}`
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
    }, [initialData, filterByCollections, parentFieldName, collectionSlug, treeLimit]),
  )
  const treeRef = useRef<HTMLDivElement>(null)

  // Fetch root nodes (items with no parent)
  const {
    children: rootNodes,
    hasMore,
    isLoading,
    loadMore: loadMoreFromHook,
    refresh,
    totalDocs,
  } = useChildren({
    allPossibleTypeValues,
    cache: childrenCache,
    collectionSlug,
    enabled: true,
    filterByCollections,
    initialData,
    limit: treeLimit,
    parentFieldName,
    parentId: 'null', // Special value to query for null parent
    typeFieldName,
    useAsTitle,
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
    const collectionLabel = getEntityConfig({ collectionSlug })
    return (
      <div className={baseClass}>
        <CreateDocumentButton
          buttonStyle="primary"
          collections={[{ collectionSlug }]}
          drawerSlug={createDrawerSlug}
          label={t('general:createNewLabel', {
            label: getTranslation(collectionLabel.labels.singular, i18n),
          })}
          onSave={async () => {
            await refresh()
            router.refresh()
          }}
        />
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

  const isAllSelected = selectedNodeId === null

  const handleAllClick = () => {
    if (onNodeClick) {
      onNodeClick(null)
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
      {showAllOption && (
        <div
          aria-selected={isAllSelected}
          className={`${baseClass}__all-option${isAllSelected ? ` ${baseClass}__all-option--selected` : ''}`}
          onClick={handleAllClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleAllClick()
            }
          }}
          role="treeitem"
          tabIndex={0}
        >
          {icon || <TagIcon color="muted" />}
          <span>{t('general:all')}</span>
        </div>
      )}
      {rootNodes.map((node) => {
        const nodeId: number | string = node.id
        const nodeIdStr = typeof nodeId === 'number' ? String(nodeId) : nodeId
        const nodeTitle = getDocumentTitle(node, useAsTitle)
        const isSelected = nodeIdStr === String(selectedNodeId)

        return (
          <TreeNode
            allPossibleTypeValues={allPossibleTypeValues}
            cache={childrenCache}
            collectionSlug={collectionSlug}
            depth={0}
            expandedNodes={expandedNodes}
            filterByCollections={filterByCollections}
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
            typeFieldName={typeFieldName}
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
