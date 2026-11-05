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
    if (filterByCollection === undefined) {
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

  const content = (
    <>
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
    </>
  )

  return (
    <div
      aria-current={isSelected ? 'location' : undefined}
      aria-disabled={isDisabled || undefined}
      className={[
        baseClass,
        isExpanded && `${baseClass}--expanded`,
        isSelected && `${baseClass}--selected`,
        isDisabled && `${baseClass}--disabled`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hasChildren ? (
        <button
          aria-expanded={isExpanded}
          className={`${baseClass}__content`}
          disabled={isDisabled}
          onClick={() => onExpand({ id })}
          type="button"
        >
          {content}
        </button>
      ) : (
        <div className={`${baseClass}__content`}>{content}</div>
      )}

      <div className={`${baseClass}__checkbox`}>
        <CheckboxInput
          aria-labelledby={titleId}
          checked={isSelected}
          onToggle={handleCheckboxToggle}
          readOnly={isDisabled}
          variant="muted"
        />
      </div>
    </div>
  )
}
