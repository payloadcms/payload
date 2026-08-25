'use client'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import type { ColumnItemProps } from '../types.js'

import { CheckboxInput } from '../../../../fields/Checkbox/Input.js'
import { ChevronIcon } from '../../../../icons/Chevron/index.js'
import { isSuperset } from '../../../../utilities/isSuperset.js'
import './index.css'

const baseClass = 'hierarchy-column-item'

export const ColumnItem: React.FC<ColumnItemProps> = ({
  disabled,
  filterByCollection,
  hasMany,
  isExpanded,
  isSelected,
  item,
  onExpand,
  onSelect,
  revealToken,
  selectedDescendantCount,
}) => {
  const { id, allowedCollections, hasChildren, title } = item
  const rowRef = useRef<HTMLDivElement>(null)
  const rowActionRef = useRef<HTMLButtonElement>(null)
  const checkboxRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (revealToken === undefined) {
      return
    }

    rowRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' })

    // Focus whichever control owns selection for this mode
    const target = hasMany ? checkboxRef.current : rowActionRef.current
    target?.focus({ preventScroll: true })
  }, [hasMany, revealToken])

  const handleSelect = useCallback(() => {
    onSelect({ id })

    // Single-select mirrors the macOS column view: picking a folder also makes it the open one,
    // which collapses any columns deeper than it.
    if (!hasMany && hasChildren) {
      onExpand({ id })
    }
  }, [hasChildren, hasMany, id, onExpand, onSelect])

  const handleExpand = useCallback(() => {
    onExpand({ id })
  }, [id, onExpand])

  return (
    <div
      className={[
        baseClass,
        hasMany && `${baseClass}--multi-select`,
        isExpanded && `${baseClass}--expanded`,
        isSelected && `${baseClass}--selected`,
        isDisabled && `${baseClass}--disabled`,
      ]
        .filter(Boolean)
        .join(' ')}
      ref={rowRef}
    >
      {/*
        Full-bleed overlay carrying the row's primary action. Single-select picks the row; in
        multi-select the checkbox owns selection, so the row body opens children instead - and a
        row with none gets no overlay at all. The chevron and checkbox are the controls exposed to
        assistive tech in multi-select, so the overlay is hidden from it to avoid announcing the
        same action twice.
      */}
      {(!hasMany || hasChildren) && (
        <button
          aria-hidden={hasMany ? 'true' : undefined}
          aria-label={title}
          aria-pressed={hasMany ? undefined : isSelected}
          className={`${baseClass}__select`}
          disabled={isDisabled}
          onClick={hasMany ? handleExpand : handleSelect}
          ref={rowActionRef}
          tabIndex={hasMany ? -1 : undefined}
          type="button"
        />
      )}

      {hasMany && (
        <div className={`${baseClass}__checkbox`}>
          <CheckboxInput
            aria-label={title}
            checked={isSelected}
            inputRef={checkboxRef}
            onToggle={handleSelect}
            readOnly={isDisabled}
          />
        </div>
      )}

      <span className={`${baseClass}__title`} title={title}>
        {title}
      </span>

      {((hasMany && selectedDescendantCount > 0) || hasChildren) && (
        <div className={`${baseClass}__trail`}>
          {hasMany && selectedDescendantCount > 0 && (
            <span className={`${baseClass}__descendant-count`}>{selectedDescendantCount}</span>
          )}

          {hasChildren && (
            <button
              aria-expanded={isExpanded}
              // TODO: replace with a translation key once the hierarchy strings are finalized
              aria-label={`Open ${title}`}
              className={`${baseClass}__chevron`}
              disabled={isDisabled}
              onClick={handleExpand}
              type="button"
            >
              <ChevronIcon direction="right" size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
