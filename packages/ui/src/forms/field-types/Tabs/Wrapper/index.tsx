'use client'
import React from 'react'
import { useCollapsible } from '../../../../elements/Collapsible/provider'
import { fieldBaseClass } from '../../shared'

const baseClass = 'tabs-field'

export const Wrapper: React.FC<{
  className?: string
  children: React.ReactNode
}> = (props) => {
  const { className, children } = props

  const isWithinCollapsible = useCollapsible()

  return (
    <div
      className={[
        fieldBaseClass,
        className,
        baseClass,
        isWithinCollapsible && `${baseClass}--within-collapsible`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
