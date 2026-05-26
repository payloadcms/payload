'use client'

import React from 'react'

import { FilterIcon } from '../../icons/Filter/index.js'
import { XIcon } from '../../icons/X/index.js'
import { Button } from '../Button/index.js'
import './index.css'

const baseClass = 'filter-trigger'

type FilterTriggerProps = {
  children: React.ReactNode
  className?: string
  id?: string
  isActive?: boolean
  onClear?: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  /** Whether the popup is currently open */
  popupActive?: boolean
  /** Whether to show the badge cutout on the filter icon. Defaults to `isActive`. */
  showBadge?: boolean
}

export function FilterTrigger({
  id,
  children,
  className,
  isActive,
  onClear,
  onClick,
  onKeyDown,
  popupActive,
  showBadge,
}: FilterTriggerProps) {
  return (
    <div className={`${baseClass}__wrap`}>
      <Button
        buttonStyle="secondary"
        className={[baseClass, className].filter(Boolean).join(' ')}
        extraButtonProps={{ onKeyDown }}
        icon={<FilterIcon hasBadgeCutout={showBadge ?? isActive} size={24} />}
        iconPosition="left"
        id={id}
        onClick={onClick}
        selected={popupActive}
        size="medium"
      >
        {children}
      </Button>
      {isActive && onClear && (
        <button className={`${baseClass}__clear`} onClick={onClear} type="button">
          <XIcon size={16} />
        </button>
      )}
    </div>
  )
}
