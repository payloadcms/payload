'use client'
import { useNav } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

export const Wrapper: React.FC<{
  baseClass?: string
  children?: React.ReactNode
  className?: string
  railMode?: boolean
}> = (props) => {
  const { baseClass, children, className, railMode } = props
  const { hydrated, navOpen, shouldAnimate } = useNav()

  return (
    <div
      className={[
        baseClass,
        className,
        navOpen && `${baseClass}--nav-open`,
        shouldAnimate && `${baseClass}--nav-animate`,
        hydrated && `${baseClass}--nav-hydrated`,
        railMode && `${baseClass}--rail-mode`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
