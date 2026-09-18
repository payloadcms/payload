'use client'

import React from 'react'

import './index.css'

const baseClass = 'list-controls-bar'

export type ListControlsBarProps = {
  readonly children: React.ReactNode
  readonly className?: string
  /**
   * Whether to show a bottom border. Defaults to true.
   */
  readonly showBorder?: boolean
}

/**
 * A simple container for list controls (search, filters, actions).
 * Provides consistent padding and layout across list views.
 */
export const ListControlsBar: React.FC<ListControlsBarProps> = ({
  children,
  className,
  showBorder = true,
}) => {
  return (
    <div
      className={[baseClass, showBorder && `${baseClass}--border`, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
