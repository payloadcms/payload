'use client'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { DEFAULT_HIERARCHY_TREE_LIMIT } from 'payload/shared'
import React, { useCallback, useId, useMemo, useRef, useState } from 'react'

import type { CachedChildren, HierarchyTreeProps, TreeDocument } from './types.js'

import { PlusIcon } from '../../../icons/Plus/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { CreateDocumentButton } from '../../CreateDocumentButton/index.js'
import { DelayedSpinner } from '../../DelayedSpinner/index.js'
import { DocumentDrawer } from '../../DocumentDrawer/index.js'
import { LoadMore } from './LoadMore/index.js'
import { TreeFocusProvider, useTreeFocus } from './TreeFocusContext.js'
import { TreeNode } from './TreeNode/index.js'
import { useChildren } from './useChildren.js'
import './index.css'

const baseClass = 'tree'

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

const HierarchyTreeInner: React.FC<HierarchyTreeProps> = ({
  baseFilter,
  collectionSlug,
  filterByCollections,
  icon,
  initialData: initialDataProp,
  initialExpandedNodes: initialExpandedNodesProp,
  onNodeClick,
  selectedNodeId,
  useAsTitle: useAsTitleProp,
}) => {
  const { moveFocus } = useTreeFocus()
  const router = useRouter()
  const { i18n, t } = useTranslation()
  const { permissions } = useAuth()
  const { getEntityConfig } = useConfig()
  const { closeModal, openModal } = useModal()
  const createDrawerSlug = `tree-create-${useId()}`
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)

  const {
    getExpandedNodesForCollection,
    getTreeDataForCollection,
    toggleNodeForCollection,
    typeFieldName,
  } = useHierarchy()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const hierarchyConfig =
    collectionConfig.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const parentFieldName = hierarchyConfig?.parentFieldName
  const treeLimit = hierarchyConfig?.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT
  const useAsTitle = useAsTitleProp ?? collectionConfig.admin?.useAsTitle
  const canCreate = Boolean(permissions?.collections?.[collectionSlug]?.create)

  const allPossibleTypeValues = useMemo(
    () =>
      hierarchyConfig?.relatedCollections
        ? Object.keys(hierarchyConfig.relatedCollections)
        : undefined,
    [hierarchyConfig?.relatedCollections],
  )

  const contextData = getTreeDataForCollection(collectionSlug)
  const baseFilterKey = baseFilter ? JSON.stringify(baseFilter) : ''
  const contextBaseFilterKey = contextData?.baseFilter ? JSON.stringify(contextData.baseFilter) : ''
  const initialData =
    baseFilterKey === contextBaseFilterKey ? (contextData ?? initialDataProp) : initialDataProp
  // Tracks whether context has been seeded at least once since the last navigation.
  // Resets when initialExpandedNodesProp changes (new array reference = navigation).
  // Allows the memo to distinguish "not yet seeded" (fall back to prop) from
  // "user collapsed all nodes" (trust empty context).
  const contextSeededRef = useRef(false)
  const lastInitialExpandedRef = useRef(initialExpandedNodesProp)
  if (lastInitialExpandedRef.current !== initialExpandedNodesProp) {
    lastInitialExpandedRef.current = initialExpandedNodesProp
    contextSeededRef.current = false
  }

  const expandedNodes = useMemo(() => {
    const contextExpanded = getExpandedNodesForCollection(collectionSlug)
    if (contextExpanded.size > 0) {
      contextSeededRef.current = true
      return contextExpanded
    }
    if (contextSeededRef.current) {
      // Context was seeded (had nodes since last navigation) — trust empty set as "all collapsed"
      return contextExpanded
    }
    return initialExpandedNodesProp ? new Set(initialExpandedNodesProp) : contextExpanded
  }, [collectionSlug, getExpandedNodesForCollection, initialExpandedNodesProp])

  const handleToggleNode = useCallback(
    ({ id }: { id: number | string }) => {
      // Mark context as seeded so the memo never falls back to the prop after this interaction.
      // Capture the previous value first — seeding is only needed on the very first interaction.
      const wasSeeded = contextSeededRef.current
      contextSeededRef.current = true
      const contextExpanded = getExpandedNodesForCollection(collectionSlug)
      if (!wasSeeded && contextExpanded.size === 0 && initialExpandedNodesProp?.length) {
        // Context not yet seeded. Seed it with all initial nodes, applying the toggle correctly:
        // exclude the target if collapsing, include it if expanding.
        const initialSet = new Set(initialExpandedNodesProp.map(String))
        const isCurrentlyExpanded = initialSet.has(String(id))
        for (const nodeId of initialExpandedNodesProp) {
          if (!isCurrentlyExpanded || String(nodeId) !== String(id)) {
            toggleNodeForCollection(collectionSlug, nodeId)
          }
        }
        if (!isCurrentlyExpanded) {
          toggleNodeForCollection(collectionSlug, id)
        }
        return
      }
      toggleNodeForCollection(collectionSlug, id)
    },
    [
      collectionSlug,
      getExpandedNodesForCollection,
      initialExpandedNodesProp,
      toggleNodeForCollection,
    ],
  )

  // Pre-populate cache with initialData synchronously before first render
  const childrenCache = useRef<Map<string, CachedChildren>>(new Map())

  const prevBaseFilterKeyRef = useRef(baseFilterKey)
  if (prevBaseFilterKeyRef.current !== baseFilterKey) {
    prevBaseFilterKeyRef.current = baseFilterKey
    childrenCache.current.clear()
  }

  useMemo(() => {
    if (!initialData || initialData.docs.length === 0) {
      return
    }

    const docsByParent = new Map<string, TreeDocument[]>()
    for (const doc of initialData.docs) {
      const parentId = doc[parentFieldName] || 'null'
      const parentKey = String(parentId)
      if (!docsByParent.has(parentKey)) {
        docsByParent.set(parentKey, [])
      }
      docsByParent.get(parentKey).push(doc)
    }

    const filterKey = filterByCollections?.length
      ? filterByCollections.slice().sort().join(',')
      : ''
    for (const [parentKey, docs] of docsByParent) {
      const cacheKey = `${collectionSlug}-${parentKey}-${filterKey}-${baseFilterKey}`
      const parentMeta = initialData.loadedParents[parentKey]

      if (parentMeta) {
        const loadedCount = parentMeta.loadedCount ?? docs.length
        childrenCache.current.set(cacheKey, {
          children: docs,
          hasMore: parentMeta.hasMore,
          page: Math.ceil(loadedCount / treeLimit) || 1,
          totalDocs: parentMeta.totalDocs,
        })
      } else {
        childrenCache.current.set(cacheKey, {
          children: docs,
          hasMore: false,
          page: 1,
          totalDocs: docs.length,
        })
      }
    }
  }, [initialData, filterByCollections, parentFieldName, collectionSlug, treeLimit, baseFilterKey])

  const treeRef = useRef<HTMLDivElement>(null)

  const {
    children: rootNodes,
    hasMore,
    isLoading,
    loadMore: loadMoreFromHook,
    refresh,
    totalDocs,
  } = useChildren({
    allPossibleTypeValues,
    baseFilter,
    cache: childrenCache,
    collectionSlug,
    enabled: true,
    filterByCollections,
    initialData,
    limit: treeLimit,
    parentFieldName,
    parentId: 'null',
    typeFieldName,
    useAsTitle,
  })

  const handleLoadMore = useCallback(async () => {
    await loadMoreFromHook()
  }, [loadMoreFromHook])

  const handleNodeClick = useCallback(
    ({ id }: { id: number | string }) => {
      onNodeClick?.({ id })
    },
    [onNodeClick],
  )

  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveFocus('down')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveFocus('up')
      }
    },
    [moveFocus],
  )

  if (isLoading && !rootNodes) {
    return (
      <div className={baseClass}>
        <DelayedSpinner baseClass={baseClass} isLoading={true} />
      </div>
    )
  }

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

  const isAllSelected = selectedNodeId === null
  const handleAllClick = () => onNodeClick?.({ id: null })

  return (
    <div
      className={baseClass}
      onKeyDown={handleTreeKeyDown}
      ref={treeRef}
      role="tree"
      tabIndex={-1}
    >
      <div className={`${baseClass}__all-option-wrapper`}>
        <div
          aria-selected={isAllSelected}
          className={[
            `${baseClass}__all-option`,
            'sidebar-row',
            isAllSelected && `${baseClass}__all-option--selected`,
            isAllSelected && 'sidebar-row--selected',
          ]
            .filter(Boolean)
            .join(' ')}
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
          <span className="sidebar-row__title">
            {t('general:all')}{' '}
            {getTranslation(getEntityConfig({ collectionSlug })?.labels?.plural, i18n)}
          </span>
        </div>
        {canCreate && (
          <>
            <Button
              aria-label={t('general:createNew')}
              buttonStyle="ghost"
              className={`${baseClass}__create-button`}
              margin={false}
              onClick={() => {
                setIsCreateDrawerOpen(true)
                openModal(createDrawerSlug)
              }}
            >
              <PlusIcon size={24} />
            </Button>
            {isCreateDrawerOpen && (
              <DocumentDrawer
                collectionSlug={collectionSlug}
                drawerSlug={createDrawerSlug}
                initialData={parentFieldName ? { [parentFieldName]: null } : undefined}
                onSave={async () => {
                  closeModal(createDrawerSlug)
                  setIsCreateDrawerOpen(false)
                  await refresh()
                  router.refresh()
                }}
                redirectAfterCreate={false}
              />
            )}
          </>
        )}
      </div>
      {rootNodes.map((node) => {
        const nodeId: number | string = node.id
        const nodeIdStr = typeof nodeId === 'number' ? String(nodeId) : nodeId
        const nodeTitle = getDocumentTitle(node, useAsTitle)

        return (
          <TreeNode
            allPossibleTypeValues={allPossibleTypeValues}
            baseFilter={baseFilter}
            cache={childrenCache}
            collectionSlug={collectionSlug}
            depth={0}
            expandedNodes={expandedNodes}
            filterByCollections={filterByCollections}
            icon={icon}
            key={nodeIdStr}
            limit={treeLimit}
            node={{ id: nodeId, hasChildren: true, title: nodeTitle }}
            onSelect={handleNodeClick}
            onToggle={handleToggleNode}
            parentFieldName={parentFieldName}
            selected={nodeIdStr === String(selectedNodeId)}
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

export const HierarchyTree: React.FC<HierarchyTreeProps> = (props) => {
  return (
    <TreeFocusProvider>
      <HierarchyTreeInner {...props} />
    </TreeFocusProvider>
  )
}
