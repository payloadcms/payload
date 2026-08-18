'use client'
import React, { useCallback } from 'react'

import type { ColumnProps } from '../types.js'

import { PlusIcon } from '../../../../icons/Plus/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { Button } from '../../../Button/index.js'
import { LoadMoreRow } from '../../../LoadMoreRow/index.js'
import { Spinner } from '../../../Spinner/index.js'
import { ColumnItem } from '../ColumnItem/index.js'
import './index.css'

const baseClass = 'hierarchy-column'

export const Column: React.FC<ColumnProps> = ({
  canCreate,
  collectionLabel,
  collectionLabelPlural,
  disabled,
  disabledIds,
  expandedId,
  filterByCollection,
  hasMany,
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
  revealedId,
  revealToken,
  selectedDescendantCounts,
  selectedIds,
  totalDocs,
}) => {
  const { t } = useTranslation()

  const headerTitle = parentTitle || (parentId === null ? t('general:all') : '')
  const newItemLabel = `New ${collectionLabel}`
  const isEmpty = !disabled && !isLoading && items.length === 0

  // TODO: replace with translation keys once the hierarchy strings are finalized. The closest
  // existing string, `version:noRowsFound`, belongs to the version-diff tables.
  const emptyLabel =
    parentId === null ? `No ${collectionLabelPlural}` : `No other ${collectionLabelPlural}`

  const handleSelect = useCallback(
    ({ id }: { id: number | string }) => {
      const item = items.find((i) => i.id === id)
      const fullPath = item ? [...pathToColumn, { id: item.id, title: item.title }] : pathToColumn
      onSelect({ id, path: fullPath })
    },
    [items, onSelect, pathToColumn],
  )

  const handleCreateNew = useCallback(() => {
    onCreateNew({ parentId })
  }, [onCreateNew, parentId])

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <span className={`${baseClass}__header-title`}>{headerTitle}</span>
        {canCreate && (
          <Button
            aria-label={newItemLabel}
            buttonStyle="ghost"
            className={`${baseClass}__add-button`}
            disabled={disabled}
            icon={<PlusIcon size={24} />}
            margin={false}
            onClick={handleCreateNew}
            size="medium"
            tooltip={newItemLabel}
          />
        )}
      </div>

      <div className={`${baseClass}__items`}>
        {items.map((item) => (
          <ColumnItem
            disabled={Boolean(disabled || disabledIds?.has(item.id))}
            filterByCollection={filterByCollection}
            hasMany={hasMany}
            isExpanded={expandedId === item.id}
            isSelected={selectedIds.has(item.id)}
            item={item}
            key={String(item.id)}
            onExpand={onExpand}
            onSelect={handleSelect}
            revealToken={revealedId === item.id ? revealToken : undefined}
            selectedDescendantCount={selectedDescendantCounts.get(item.id) ?? 0}
          />
        ))}

        {isLoading && (
          <div className={`${baseClass}__loading`}>
            <Spinner loadingText={null} size="sm" />
          </div>
        )}

        {isEmpty && <div className={`${baseClass}__empty`}>{emptyLabel}</div>}

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
