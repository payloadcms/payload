'use client'
import React from 'react'

import { useNav } from '../context'
import './index.scss'

export const NavWrapper: React.FC<{
  children: React.ReactNode
  baseClass?: string
}> = (props) => {
  const { children, baseClass } = props

  const { navOpen, navRef } = useNav()

  return (
    <aside className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
