'use client'
import { useNav } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

export const Wrapper: React.FC<{
  baseClass?: string
  children?: React.ReactNode
  className?: string
}> = (props) => {
  const { baseClass, children, className } = props
  const { hydrated, navOpen, shouldAnimate } = useNav()

  return (
    <div
      className={[
        baseClass,
        className,
        navOpen && `${baseClass}--nav-open`,
        shouldAnimate && `${baseClass}--nav-animate`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
