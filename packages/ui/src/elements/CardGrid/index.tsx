'use client'

import React from 'react'

import './index.css'

const baseClass = 'card-grid'

export type CardGridProps<T> = {
  readonly ariaLabel: string
  readonly className?: string
  readonly getItemClassName?: (item: T) => string | undefined
  readonly getKey: (item: T) => React.Key
  readonly items: readonly T[]
  readonly renderItem: (item: T) => React.ReactNode
}

/** A presentation-only responsive grid. Selection, navigation, and drag behavior belong to callers. */
export const CardGrid = <T,>({
  ariaLabel,
  className,
  getItemClassName,
  getKey,
  items,
  renderItem,
}: CardGridProps<T>) => (
  <ul aria-label={ariaLabel} className={[baseClass, className].filter(Boolean).join(' ')}>
    {items.map((item) => (
      <li
        className={[`${baseClass}__item`, getItemClassName?.(item)].filter(Boolean).join(' ')}
        key={getKey(item)}
      >
        {renderItem(item)}
      </li>
    ))}
  </ul>
)
