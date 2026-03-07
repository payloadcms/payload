'use client'
import React, { useCallback } from 'react'

import type { ColumnProps } from '../types.js'

import { PlusIcon } from '../../../icons/Plus/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { LoadMoreRow } from '../../LoadMoreRow/index.js'
import { Spinner } from '../../Spinner/index.js'
import { ColumnItem } from '../ColumnItem/index.js'
import './index.scss'

const baseClass = 'hierarchy-column'

export const Column: React.FC<ColumnProps> = ({
  ancestorsWithSelections,
  canCreate,
  collectionLabel,
  disabled,
  disabledIds,
  expandedId,
  filterByCollection,
  hasNextPage,
  isLoading,
  items,
  onCreateNew,
  onExpand,
  onLoadMore,
  onSelect,
  parentId,
  parentTitle,
  pathToColumn,
  selectedIds,
  totalDocs,
}) => {
  const { t } = useTranslation()

  const headerTitle = parentTitle || (parentId === null ? t('general:all') : '')

  const handleSelect = useCallback(
    (id: number | string) => {
      const item = items.find((i) => i.id === id)
      const fullPath = item ? [...pathToColumn, { id: item.id, title: item.title }] : pathToColumn
      onSelect(id, fullPath)
    },
    [items, onSelect, pathToColumn],
  )

  const handleCreateNew = useCallback(() => {
    onCreateNew(parentId)
  }, [onCreateNew, parentId])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <span className={`${baseClass}__header-title`}>{headerTitle}</span>
        {canCreate && (
          <Button
            buttonStyle="muted-text"
            className={`${baseClass}__add-button`}
            disabled={disabled}
            icon={<PlusIcon />}
            iconPosition="left"
            margin={false}
            onClick={handleCreateNew}
            size="xsmall"
          >
            New {collectionLabel}
          </Button>
        )}
      </div>

      <div className={`${baseClass}__items`}>
        {items.map((item) => (
          <ColumnItem
            disabled={Boolean(disabled || disabledIds?.has(item.id))}
            filterByCollection={filterByCollection}
            hasSelectedDescendants={ancestorsWithSelections.has(item.id)}
            isExpanded={expandedId === item.id}
            isSelected={selectedIds.has(item.id)}
            item={item}
            key={String(item.id)}
            onExpand={onExpand}
            onSelect={handleSelect}
          />
        ))}

        {isLoading && (
          <div className={`${baseClass}__loading`}>
            <Spinner loadingText={null} size="small" />
          </div>
        )}

        {!disabled && !isLoading && totalDocs > 0 && (
          <LoadMoreRow
            className={`${baseClass}__load-more`}
            currentCount={items.length}
            hasMore={hasNextPage}
            onLoadMore={onLoadMore}
            totalDocs={totalDocs}
          />
        )}
      </div>
    </div>
  )
}
