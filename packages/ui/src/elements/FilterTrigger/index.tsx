'use client'

import React from 'react'

import { FilterIcon } from '../../icons/Filter/index.js'
import { XIcon } from '../../icons/X/index.js'
import { Button } from '../Button/index.js'
import './index.css'

const baseClass = 'filter-trigger'

type FilterTriggerProps = {
  ariaProps?: React.AriaAttributes
  children: React.ReactNode
  className?: string
  id?: string
  isActive?: boolean
  onClear?: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  /** Whether to show the badge cutout on the filter icon. Defaults to `isActive`. */
  showBadge?: boolean
}

export function FilterTrigger({
  id,
  ariaProps,
  children,
  className,
  isActive,
  onClear,
  onClick,
  onKeyDown,
  showBadge,
}: FilterTriggerProps) {
  return (
    <div className={`${baseClass}__wrap`}>
      <Button
        {...ariaProps}
        buttonStyle="secondary"
        className={[baseClass, className].filter(Boolean).join(' ')}
        extraButtonProps={{ onKeyDown }}
        icon={<FilterIcon hasBadgeCutout={showBadge ?? isActive} size={24} />}
        iconPosition="left"
        id={id}
        onClick={onClick}
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
