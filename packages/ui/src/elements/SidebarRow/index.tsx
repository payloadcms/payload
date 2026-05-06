'use client'
import React from 'react'

import './index.css'

const baseClass = 'sidebar-row'

export type SidebarRowProps<T extends React.ElementType = 'div'> = {
  /**
   * The element type to render. Defaults to 'div'.
   * Use 'a' for links, 'button' for clickable items.
   */
  as?: T
  children?: React.ReactNode
  className?: string
  /**
   * Icon to display at the start of the row.
   */
  icon?: React.ReactNode
  /**
   * Whether this row is currently selected/active.
   */
  selected?: boolean
  /**
   * Title text to display. Will be truncated with ellipsis if too long.
   */
  title?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'title'>

export function SidebarRow<T extends React.ElementType = 'div'>({
  as,
  children,
  className,
  icon,
  selected,
  title,
  ...props
}: SidebarRowProps<T>) {
  const Component = as || 'div'

  return (
    <div className={`${baseClass}-wrapper`}>
      <Component
        className={[baseClass, selected && `${baseClass}--selected`, className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {Boolean(icon) && <span className={`${baseClass}__icon`}>{icon}</span>}
        {Boolean(title) && <span className={`${baseClass}__title`}>{title}</span>}
        {children}
      </Component>
    </div>
  )
}
