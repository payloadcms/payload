'use client'

import React, { useCallback, useRef } from 'react'

import type { TreeNodeProps } from '../types.js'

import { Spinner } from '../../../elements/Spinner/index.js'
import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { LoadMore } from '../LoadMore/index.js'
import { useFocusableItem, useTreeFocus } from '../TreeFocusContext.js'
import { useChildren } from '../useChildren.js'
import './index.scss'

const baseClass = 'taxonomy-tree-node'

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
  cache,
  collectionSlug,
  depth = 0,
  expandedNodes,
  node,
  onSelect,
  onToggle,
  parentFieldName,
  selected,
  selectedNodeId,
  useAsTitle,
}: TreeNodeProps) => {
  const expanded = expandedNodes.has(node.id)
  const nodeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { setFocusedId } = useTreeFocus()

  const {
    children,
    hasMore,
    isLoading,
    loadMore: loadMoreFromHook,
    totalDocs,
  } = useChildren({
    cache,
    collectionSlug,
    enabled: expanded,
    limit: 50,
    parentFieldName,
    parentId: node.id,
  })

  const handleLoadMore = React.useCallback(async () => {
    const newDocs = await loadMoreFromHook()

    if (newDocs && newDocs.length > 0) {
      const firstNewDoc = newDocs[0]
      const docId: number | string = (firstNewDoc as { id: number | string }).id
      const docIdStr = typeof docId === 'number' ? String(docId) : docId
      const firstNewDocId = `node-${docIdStr}`
      setFocusedId(firstNewDocId)
    }
  }, [loadMoreFromHook, setFocusedId])

  const { handleFocus, isFocused, tabIndex } = useFocusableItem({
    id: `node-${node.id}`,
    type: 'node',
    ref: contentRef,
  })

  // When focusedId points to this node, actually call .focus()
  React.useEffect(() => {
    if (isFocused && contentRef.current && document.activeElement !== contentRef.current) {
      contentRef.current.focus()
    }
  }, [isFocused])

  // Determine if node has children:
  // - If explicitly set in data, use that
  // - If expanded and loaded, check the actual children
  // - Otherwise, assume it might have children (show chevron until proven otherwise)
  const hasChildren =
    node.hasChildren === true || (expanded && children !== null ? children.length > 0 : true)

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle(node.id)
    },
    [node.id, onToggle],
  )

  const handleSelectClick = useCallback(() => {
    onSelect(node.id)
  }, [node.id, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          handleSelectClick()
          break
        case 'ArrowLeft':
          if (hasChildren && expanded) {
            e.preventDefault()
            onToggle(node.id)
          }
          break
        case 'ArrowRight':
          if (hasChildren && !expanded) {
            e.preventDefault()
            onToggle(node.id)
          }
          break
      }
    },
    [hasChildren, expanded, handleSelectClick, onToggle, node.id],
  )

  return (
    <div
      className={baseClass}
      ref={nodeRef}
      style={{ '--taxonomy-tree-depth': depth } as React.CSSProperties}
    >
      <div
        className={[`${baseClass}__content`, selected && `${baseClass}__content--selected`]
          .filter(Boolean)
          .join(' ')}
        onClick={handleSelectClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        ref={contentRef}
        role="button"
        tabIndex={tabIndex}
      >
        {hasChildren ? (
          <button
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className={`${baseClass}__toggle`}
            onClick={handleToggleClick}
            tabIndex={-1}
            type="button"
          >
            <ChevronIcon direction={expanded ? 'down' : 'right'} />
          </button>
        ) : (
          <div className={`${baseClass}__toggle-spacer`} />
        )}
        <span className={`${baseClass}__title`}>{node.title}</span>
        {isLoading && expanded && (
          <span className={`${baseClass}__loading`}>
            <Spinner loadingText={null} size="small" />
          </span>
        )}
      </div>

      {expanded && children && children.length > 0 && (
        <>
          <div className={`${baseClass}__children`}>
            {children.map((child) => {
              const childData = child as { id: number | string }
              const childId = childData.id
              const childTitle = getDocumentTitle(child, useAsTitle)
              return (
                <TreeNode
                  cache={cache}
                  collectionSlug={collectionSlug}
                  depth={depth + 1}
                  expandedNodes={expandedNodes}
                  key={String(childId)}
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
