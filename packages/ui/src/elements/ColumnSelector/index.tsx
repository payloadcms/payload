'use client'

import type { SanitizedCollectionConfig, StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { fieldIsHiddenOrDisabled, fieldIsID, isFieldDisabled } from 'payload/shared'
import React, { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { AlignJustifiedIcon } from '../../icons/AlignJustified/index.js'
import { SearchIcon } from '../../icons/Search/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTableColumns } from '../../providers/TableColumns/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Button } from '../Button/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable/index.js'
import { Switch } from '../Switch/index.js'
import './index.css'

const baseClass = 'column-selector'

/**
 * Parses a nested field label and returns segments for rendering.
 * - For deeply nested paths (more than 3 segments), truncates to [First, "...", Last]
 *
 * A column label isn't guaranteed to be a string — a field can supply a React
 * element (custom `Label`) or a non-string translation object — so non-strings
 * are returned as a single segment rather than crashing on `.includes`.
 */
function parseNestedLabel(label: React.ReactNode): React.ReactNode[] {
  if (typeof label !== 'string' || !label.includes(' > ')) {
    return [label]
  }

  const segments = label.split(' > ')

  if (segments.length <= 3) {
    return segments
  }

  // For deep nesting, show: First / ... / Last
  return [segments[0], '...', segments[segments.length - 1]]
}

type NestedLabelProps = {
  readonly label: React.ReactNode
}

const NestedLabel: React.FC<NestedLabelProps> = ({ label }) => {
  const segments = parseNestedLabel(label)

  if (segments.length === 1) {
    return <>{segments[0]}</>
  }

  return (
    <>
      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className={`${baseClass}__separator`}>/</span>}
          {segment}
        </React.Fragment>
      ))}
    </>
  )
}

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly onClose?: () => void
}

type ColumnItemProps = {
  readonly active: boolean
  readonly id: string
  readonly labelText: string
  readonly onToggle: () => void
}

const ColumnItem: React.FC<ColumnItemProps> = ({ id, active, labelText, onToggle }) => {
  const { t } = useTranslation()
  const { attributes, isDragging, isOver, isSorting, listeners, setNodeRef, transform } =
    useDraggableSortable({
      id,
    })

  return (
    <div
      aria-label={labelText}
      className={[
        `${baseClass}__item`,
        !active && `${baseClass}__item--inactive`,
        isDragging && `${baseClass}__item--dragging`,
        isOver && isSorting && !isDragging && `${baseClass}__item--over`,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={setNodeRef}
      style={{
        // Keep item in place while dragging - don't apply transform
        transform: isDragging ? undefined : transform,
        ...attributes.style,
      }}
      {...attributes}
    >
      <span
        aria-label={t('general:dragToReorder')}
        className={`${baseClass}__drag-handle`}
        {...listeners}
      >
        <AlignJustifiedIcon size={16} />
      </span>
      <span className={`${baseClass}__item-label`}>
        <NestedLabel label={labelText} />
      </span>
      <Switch checked={active} onChange={onToggle} />
    </div>
  )
}

export const ColumnSelector: React.FC<Props> = ({ collectionSlug, onClose }) => {
  const { columns, moveColumn, toggleColumn } = useTableColumns()
  const { i18n, t } = useTranslation()

  const uuid = useId()
  const editDepth = useEditDepth()
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [lockedWidth, setLockedWidth] = useState<null | number>(null)

  // Lock the width when search starts to prevent layout shift
  useLayoutEffect(() => {
    if (!containerRef.current) {
      return
    }

    if (searchQuery && lockedWidth === null) {
      // Capture width when search starts
      setLockedWidth(containerRef.current.offsetWidth)
    } else if (!searchQuery && lockedWidth !== null) {
      // Release width lock when search is cleared
      setLockedWidth(null)
    }
  }, [searchQuery, lockedWidth])

  const filteredColumns = useMemo(
    () =>
      columns?.filter(
        (col) =>
          !(fieldIsHiddenOrDisabled(col.field) && !fieldIsID(col.field)) &&
          !isFieldDisabled(col.field, 'column'),
      ),
    [columns],
  )

  const columnItems = useMemo(() => {
    if (!filteredColumns) {
      return { all: [], hidden: [], shown: [] }
    }

    const items = filteredColumns.map((col, i) => {
      const { accessor, active, field } = col

      const label =
        'labelWithPrefix' in field && field.labelWithPrefix !== undefined
          ? field.labelWithPrefix
          : 'label' in field && field.label !== undefined
            ? field.label
            : 'name' in field && field.name !== undefined
              ? field.name
              : accessor

      const labelText =
        typeof label === 'string' ? label : getTranslation(label as StaticLabel, i18n)

      return {
        id: `${collectionSlug}-${accessor}-${i}${editDepth ? `-${editDepth}-` : ''}${uuid}`,
        accessor,
        active,
        index: i,
        label,
        labelText,
      }
    })

    // Filter by search query
    const filtered = searchQuery
      ? items.filter((item) => item.labelText.toLowerCase().includes(searchQuery.toLowerCase()))
      : items

    return {
      all: items,
      hidden: filtered.filter((item) => !item.active),
      shown: filtered.filter((item) => item.active),
    }
  }, [collectionSlug, editDepth, filteredColumns, i18n, searchQuery, uuid])

  const handleDragEnd = useCallback(
    ({ moveFromIndex, moveToIndex }: { moveFromIndex: number; moveToIndex: number }) => {
      if (moveFromIndex === moveToIndex) {
        return
      }

      // All shown items first, then all hidden items
      const allItems = [...columnItems.shown, ...columnItems.hidden]
      const shownCount = columnItems.shown.length
      const fromItem = allItems[moveFromIndex]
      const toItem = allItems[moveToIndex]

      if (!fromItem || !toItem) {
        return
      }

      // Determine if crossing sections
      const fromIsShown = moveFromIndex < shownCount
      const toIsShown = moveToIndex < shownCount

      if (fromIsShown !== toIsShown) {
        // Cross-section move: just toggle the column's active state (show/hide)
        void toggleColumn(fromItem.accessor)
        // Don't reorder when crossing sections - the toggle handles the change
        return
      }

      // Same-section move: perform the reorder
      void moveColumn({
        fromIndex: fromItem.index,
        toIndex: toItem.index,
      })
    },
    [columnItems.shown, columnItems.hidden, moveColumn, toggleColumn],
  )

  if (!filteredColumns) {
    return null
  }

  // Combined IDs: shown items first, then hidden items
  const allIds = [...columnItems.shown, ...columnItems.hidden].map((item) => item.id)

  const containerStyle = lockedWidth
    ? ({ '--column-selector-locked-width': `${lockedWidth}px` } as React.CSSProperties)
    : undefined

  return (
    <div
      className={baseClass}
      data-popup-prevent-close
      data-width-locked={lockedWidth ? 'true' : undefined}
      ref={containerRef}
      style={containerStyle}
    >
      <div className={`${baseClass}__header`}>
        <span className={`${baseClass}__title`}>{t('general:editColumns')}</span>
        {onClose && (
          <Button
            aria-label={t('general:close')}
            buttonStyle="ghost"
            className={`${baseClass}__close`}
            icon={<XIcon size={24} />}
            onClick={onClose}
          />
        )}
      </div>
      <div className={`${baseClass}__search`}>
        <div className={`${baseClass}__search-bar`}>
          <SearchIcon size={24} />
          <input
            aria-label={t('general:searchColumns')}
            className={`${baseClass}__search-input`}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('general:searchColumns')}
            type="text"
            value={searchQuery}
          />
        </div>
      </div>
      <div className={`${baseClass}__content`}>
        <DraggableSortable ids={allIds} onDragEnd={handleDragEnd}>
          {columnItems.shown.length === 0 && columnItems.hidden.length === 0 && searchQuery && (
            <div className={`${baseClass}__no-results`}>{t('general:noMatchesFound')}</div>
          )}
          {columnItems.shown.length > 0 && (
            <div className={`${baseClass}__section`}>
              <div className={`${baseClass}__section-header`}>{t('general:shownInTable')}</div>
              {columnItems.shown.map((item) => (
                <ColumnItem
                  active={item.active}
                  id={item.id}
                  key={item.id}
                  labelText={item.labelText}
                  onToggle={() => {
                    void toggleColumn(item.accessor)
                  }}
                />
              ))}
            </div>
          )}
          {columnItems.hidden.length > 0 && (
            <div className={`${baseClass}__section`}>
              <div className={`${baseClass}__section-header`}>{t('general:notShownInTable')}</div>
              {columnItems.hidden.map((item) => (
                <ColumnItem
                  active={item.active}
                  id={item.id}
                  key={item.id}
                  labelText={item.labelText}
                  onToggle={() => {
                    void toggleColumn(item.accessor)
                  }}
                />
              ))}
            </div>
          )}
        </DraggableSortable>
      </div>
    </div>
  )
}
