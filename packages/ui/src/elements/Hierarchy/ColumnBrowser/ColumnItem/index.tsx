'use client'
import React, { useCallback, useId, useMemo } from 'react'

import type { ColumnItemProps } from '../types.js'

import { CheckboxInput } from '../../../../fields/Checkbox/Input.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { isSuperset } from '../../../../utilities/isSuperset.js'
import './index.css'

const baseClass = 'hierarchy-column-item'

export const ColumnItem: React.FC<ColumnItemProps> = ({
  disabled,
  filterByCollection,
  hasSelectedDescendants,
  isExpanded,
  isSelected,
  item,
  onExpand,
  onSelect,
}) => {
  const { id, allowedCollections, hasChildren, title } = item
  const titleId = useId()

  // Disable selection if:
  // 1. This item is in the disabledIds set (e.g., being moved)
  // 2. Folder doesn't allow ALL required collections
  const isDisabled = useMemo(() => {
    if (disabled) {
      return true
    }
    if (!filterByCollection || filterByCollection.length === 0) {
      return false
    }
    return !isSuperset(allowedCollections, filterByCollection)
  }, [allowedCollections, disabled, filterByCollection])

  const handleCheckboxToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (isDisabled) {
        return
      }
      onSelect({ id })
    },
    [id, isDisabled, onSelect],
  )

  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't expand when clicking the checkbox
      if ((e.target as HTMLElement).closest(`.${baseClass}__checkbox`)) {
        return
      }
      if (hasChildren) {
        onExpand({ id })
      }
    },
    [hasChildren, id, onExpand],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (hasChildren) {
          onExpand({ id })
        }
      }
    },
    [hasChildren, id, onExpand],
  )

  return (
    <div
      aria-current={isSelected ? 'location' : undefined}
      className={[
        baseClass,
        isExpanded && `${baseClass}--expanded`,
        isSelected && `${baseClass}--selected`,
        isDisabled && `${baseClass}--disabled`,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={isDisabled ? undefined : handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
    >
      <div className={`${baseClass}__checkbox`}>
        <CheckboxInput
          aria-labelledby={titleId}
          checked={isSelected}
          onToggle={handleCheckboxToggle}
          readOnly={isDisabled}
          variant="muted"
        />
      </div>

      <span className={`${baseClass}__title`} id={titleId} title={title}>
        {title}
      </span>

      {hasSelectedDescendants && !isSelected && (
        <span className={`${baseClass}__descendant-indicator`} />
      )}

      {hasChildren && (
        <span className={`${baseClass}__chevron`}>
          <ChevronIcon direction="right" />
        </span>
      )}
    </div>
  )
}
