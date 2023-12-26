'use client'
import React from 'react'
import { useNav } from '../../../elements/Nav/context'

import './index.scss'

export const NavWrapper: React.FC<{
  baseClass?: string
  className?: string
  children?: React.ReactNode
}> = (props) => {
  const { children, baseClass, className } = props
  const { navOpen } = useNav()

  return (
    <div
      className={[baseClass, className, navOpen && `${baseClass}--nav-open`]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
