'use client'
import React, { useCallback } from 'react'

import type { ColumnItemProps } from '../types.js'

import { CheckboxInput } from '../../../../fields/Checkbox/Input.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import './index.scss'

const baseClass = 'taxonomy-drawer-column-item'

export const ColumnItem: React.FC<ColumnItemProps> = ({
  hasSelectedDescendants,
  isExpanded,
  isSelected,
  item,
  onExpand,
  onSelect,
}) => {
  const { id, hasChildren, title } = item

  const handleCheckboxToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation()
      onSelect(id)
    },
    [id, onSelect],
  )

  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't expand when clicking the checkbox
      if ((e.target as HTMLElement).closest(`.${baseClass}__checkbox`)) {
        return
      }
      if (hasChildren) {
        onExpand(id)
      }
    },
    [hasChildren, id, onExpand],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (hasChildren) {
          onExpand(id)
        }
      }
    },
    [hasChildren, id, onExpand],
  )

  return (
    <div
      className={[
        baseClass,
        isExpanded && `${baseClass}--expanded`,
        isSelected && `${baseClass}--selected`,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={`${baseClass}__checkbox`}>
        <CheckboxInput checked={isSelected} onToggle={handleCheckboxToggle} />
      </div>

      <span className={`${baseClass}__title`} title={title}>
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
