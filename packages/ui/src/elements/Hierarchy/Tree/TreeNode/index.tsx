'use client'

import { useDroppable } from '@dnd-kit/core'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import type { HierarchyDropData } from '../../../../providers/HierarchyDnd/types.js'
import type { TreeNodeProps } from '../types.js'

import { Spinner } from '../../../../elements/Spinner/index.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { useHierarchyDnd } from '../../../../providers/HierarchyDnd/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { LoadMore } from '../LoadMore/index.js'
import { useFocusableItem, useTreeFocus } from '../TreeFocusContext.js'
import { useChildren } from '../useChildren.js'
import './index.css'

const DEFAULT_TREE_LIMIT = 10

/**
 * How long a drag has to hover a collapsed node before it springs open, so a drag can drill into the
 * tree without being dropped and restarted.
 */
const SPRING_LOAD_DELAY = 600

const baseClass = 'tree-node'

const getDocumentTitle = (doc: Record<string, unknown>, useAsTitle: string | undefined): string => {
  const docId: number | string = doc.id as number | string
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

export const TreeNode = ({
  allPossibleTypeValues,
  ancestorIds,
  baseFilter,
  cache,
  collectionSlug,
  depth = 0,
  dropParentFieldName,
  expandedNodes,
  filterByCollections,
  limit = DEFAULT_TREE_LIMIT,
  node,
  onSelect,
  onToggle,
  parentFieldName,
  selected,
  selectedNodeId,
  typeFieldName,
  useAsTitle,
}: TreeNodeProps) => {
  const { t } = useTranslation()
  const expanded = expandedNodes.has(node.id)
  const nodeRef = useRef<HTMLDivElement>(null)
  const { setFocusedId } = useTreeFocus()

  const {
    children,
    hasMore,
    isLoading,
    load,
    loadMore: loadMoreFromHook,
    totalDocs,
  } = useChildren({
    allPossibleTypeValues,
    baseFilter,
    cache,
    collectionSlug,
    enabled: expanded,
    filterByCollections,
    limit,
    parentFieldName,
    parentId: node.id,
    typeFieldName,
    useAsTitle,
  })

  const handleLoadMore = React.useCallback(async () => {
    const newDocs = await loadMoreFromHook()

    if (newDocs && newDocs.length > 0) {
      const firstNewDoc = newDocs[0]
      const docId: number | string = (firstNewDoc as { id: number | string }).id
      window.requestAnimationFrame(() => {
        setFocusedId(`node-${docId}`)
      })
    }
  }, [loadMoreFromHook, setFocusedId])

  const { handleFocus, tabIndex } = useFocusableItem({
    id: `node-${node.id}`,
    type: 'node',
    ref: nodeRef,
  })

  // Determine if node has children:
  // - If explicitly set in data, use that
  // - If expanded and loaded, check the actual children
  // - Otherwise, assume it might have children (show chevron until proven otherwise)
  const hasChildren =
    node.hasChildren === true || (expanded && children !== null ? children.length > 0 : true)

  const handleToggle = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.stopPropagation()
      void load()
      onToggle({ id: node.id })
    },
    [load, node.id, onToggle],
  )

  const { canDrop } = useHierarchyDnd()

  const childAncestorIds = useMemo(() => [...(ancestorIds ?? []), node.id], [ancestorIds, node.id])

  const dropData = useMemo<HierarchyDropData | undefined>(
    () =>
      dropParentFieldName
        ? {
            type: 'hierarchy-folder',
            // Tree nodes carry only id/title/hasChildren, not the folder's collectionSpecific value,
            // so type acceptance is left to the server validator here. The self/descendant check
            // below still runs, since that only needs ids.
            ancestorIds: ancestorIds ?? [],
            folderId: node.id,
            hierarchySlug: collectionSlug,
            parentFieldName: dropParentFieldName,
            title: node.title,
          }
        : undefined,
    [ancestorIds, collectionSlug, dropParentFieldName, node.id, node.title],
  )

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `tree-node-drop-${collectionSlug}-${node.id}`,
    data: dropData,
    disabled: !dropData,
  })

  const dropState = isOver && dropData ? (canDrop(dropData) ? 'over' : 'invalid') : undefined

  const handleSelectClick = useCallback(() => {
    onSelect?.({ id: node.id })
  }, [node.id, onSelect])

  /**
   * Hovering a collapsed node mid-drag opens it after a beat. The timer is cleared when the drag
   * leaves, so a pass-over on the way somewhere else doesn't expand the whole tree.
   */
  useEffect(() => {
    if (!isOver || expanded || !hasChildren) {
      return
    }

    const timeout = setTimeout(() => {
      handleToggle()
    }, SPRING_LOAD_DELAY)

    return () => clearTimeout(timeout)
  }, [expanded, handleToggle, hasChildren, isOver])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) {
        return
      }
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          e.stopPropagation()
          handleSelectClick()
          break
        case 'ArrowLeft':
          e.preventDefault()
          e.stopPropagation()
          if (hasChildren && expanded) {
            onToggle({ id: node.id })
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          e.stopPropagation()
          if (hasChildren && !expanded) {
            handleToggle()
          }
          break
      }
    },
    [expanded, handleSelectClick, handleToggle, hasChildren, node.id, onToggle],
  )

  return (
    <div
      aria-expanded={hasChildren ? expanded : undefined}
      aria-level={depth + 1}
      aria-selected={selected}
      className={baseClass}
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          handleFocus()
        }
      }}
      onKeyDown={handleKeyDown}
      ref={nodeRef}
      role="treeitem"
      style={{ '--tree-depth': depth } as React.CSSProperties}
      tabIndex={tabIndex}
    >
      <div className={`${baseClass}__content-wrapper`}>
        <div
          className={[
            `${baseClass}__content`,
            selected && `${baseClass}__content--selected`,
            dropState && `${baseClass}__content--drop-${dropState}`,
          ]
            .filter(Boolean)
            .join(' ')}
          ref={setDropRef}
        >
          {hasChildren && (
            <button
              aria-label={expanded ? t('general:collapse') : t('general:open')}
              className={`${baseClass}__toggle`}
              onClick={handleToggle}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex={-1}
              type="button"
            >
              <ChevronIcon direction={expanded ? 'down' : 'right'} size={16} />
            </button>
          )}
          <button
            className={[
              `${baseClass}__node-trigger`,
              selected && `${baseClass}__node-trigger--selected`,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={handleSelectClick}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex={-1}
            title={node.title}
            type="button"
          >
            <span className={`${baseClass}__title sidebar-row__title`}>{node.title}</span>
          </button>
          {isLoading && expanded && (
            <span className={`${baseClass}__loading`}>
              <Spinner loadingText={null} size="sm" />
            </span>
          )}
        </div>
      </div>

      {expanded && children && children.length > 0 && (
        <>
          <div className={`${baseClass}__children`} role="group">
            {children.map((child) => {
              const childData = child as { id: number | string }
              const childId = childData.id
              const childTitle = getDocumentTitle(child, useAsTitle)
              return (
                <TreeNode
                  allPossibleTypeValues={allPossibleTypeValues}
                  ancestorIds={childAncestorIds}
                  baseFilter={baseFilter}
                  cache={cache}
                  collectionSlug={collectionSlug}
                  depth={depth + 1}
                  dropParentFieldName={dropParentFieldName}
                  expandedNodes={expandedNodes}
                  filterByCollections={filterByCollections}
                  key={String(childId)}
                  limit={limit}
                  node={{
                    id: childId,
                    hasChildren: true,
                    title: childTitle,
                  }}
                  onSelect={onSelect}
                  onToggle={onToggle}
                  parentFieldName={parentFieldName}
                  selected={String(childId) === String(selectedNodeId)}
                  selectedNodeId={selectedNodeId}
                  typeFieldName={typeFieldName}
                  useAsTitle={useAsTitle}
                />
              )
            })}
          </div>
          {hasMore && (
            <LoadMore
              currentCount={children.length}
              depth={depth + 1}
              id={`load-more-${node.id}`}
              onLoadMore={handleLoadMore}
              totalDocs={totalDocs}
            />
          )}
        </>
      )}
    </div>
  )
}
