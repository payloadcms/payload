'use client'
import type { ViewTypes } from 'payload'

import React from 'react'

import { useNav } from '../../../elements/Nav/context.js'
import { HierarchyDndProvider } from '../../../providers/HierarchyDnd/index.js'
import './index.css'

export const Wrapper: React.FC<{
  baseClass?: string
  children?: React.ReactNode
  className?: string
  viewType?: ViewTypes
}> = (props) => {
  const { baseClass, children, className, viewType } = props
  const { hydrated, navOpen } = useNav()

  const content = (
    <div
      className={[
        baseClass,
        className,
        navOpen && `${baseClass}--nav-open`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )

  /*
   * The hierarchy drag context has to enclose both the nav and the view, since the sidebar tree is
   * a drop target. It is mounted only on the hierarchy view so it never wraps the field-level drag
   * contexts that array and blocks rows set up on document views.
   */
  return viewType === 'hierarchy' ? <HierarchyDndProvider>{content}</HierarchyDndProvider> : content
}
