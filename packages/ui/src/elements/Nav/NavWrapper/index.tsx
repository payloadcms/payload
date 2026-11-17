'use client'
import React from 'react'

import { useEmbed } from '../../../providers/Embed/index.js'
import { useNav } from '../context.js'
import './index.css'

/**
 * @internal
 */
export const NavWrapper: React.FC<{
  baseClass?: string
  children: React.ReactNode
  header?: React.ReactNode
}> = (props) => {
  const { baseClass, children, header } = props

  const { hydrated, navOpen, navRef } = useNav()
  const { isEmbedded } = useEmbed()

  return (
    <aside
      className={[
        baseClass,
        navOpen && `${baseClass}--nav-open`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
      inert={!navOpen ? true : undefined}
    >
      {!isEmbedded && header}
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
