'use client'
import { useNav } from '@payloadcms/ui/client'
import React from 'react'

import './index.scss'

export const Wrapper: React.FC<{
  baseClass?: string
  children?: React.ReactNode
  className?: string
}> = (props) => {
  const { baseClass, children, className } = props
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
