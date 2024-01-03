'use client'
import React from 'react'

import Link from 'next/link'
import { usePathname, useSelectedLayoutSegments } from 'next/navigation'

export const DocumentTabLink: React.FC<{
  href: string
  newTab?: boolean
  baseClass: string
  children?: React.ReactNode
  isActive?: boolean
}> = ({ isActive: isActiveFromProps, baseClass, href: hrefFromProps, newTab, children }) => {
  const pathname = usePathname()
  const segments = useSelectedLayoutSegments()

  const isActive =
    typeof isActiveFromProps === 'boolean' ? isActiveFromProps : pathname.endsWith(hrefFromProps)

  const href = hrefFromProps ? `${pathname}${hrefFromProps}` : ''

  return (
    <li className={[baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(' ')}>
      <Link
        className={`${baseClass}__link`}
        href={!isActive ? href : ''}
        {...(newTab && { rel: 'noopener noreferrer', target: '_blank' })}
        tabIndex={isActive ? -1 : 0}
      >
        {children}
      </Link>
    </li>
  )
}
