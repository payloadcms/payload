'use client'
import type { SanitizedConfig } from 'payload/types'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import React from 'react'

export const DocumentTabLink: React.FC<{
  adminRoute: SanitizedConfig['routes']['admin']
  baseClass: string
  children?: React.ReactNode
  href: string
  isActive?: boolean
  isCollection?: boolean
  newTab?: boolean
}> = ({
  adminRoute,
  baseClass,
  children,
  href: hrefFromProps,
  isActive: isActiveFromProps,
  isCollection,
  newTab,
}) => {
  const pathname = usePathname()
  const params = useParams()

  const docHref = `${adminRoute}/${isCollection ? 'collections' : 'globals'}${
    isCollection ? `/${params.collection}` : `/${params.global}`
  }${isCollection ? `/${params.segments?.[0]}` : ''}`

  const href = `${docHref}${hrefFromProps}`

  const isActive =
    (href === docHref && pathname === docHref) ||
    (href !== docHref && pathname.startsWith(href)) ||
    isActiveFromProps

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
