'use client'
import React from 'react'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useConfig } from '../../../../providers/Config'

export const DocumentTabLink: React.FC<{
  isCollection?: boolean
  newTab?: boolean
  href: string
  baseClass: string
  children?: React.ReactNode
}> = ({ baseClass, href: hrefFromProps, newTab, children, isCollection }) => {
  const pathname = usePathname()
  const params = useParams()
  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const docHref = `${adminRoute}/${isCollection ? 'collections' : 'globals'}${
    isCollection ? `/${params.collection}` : `/${params.global}`
  }${isCollection ? `/${params.segments?.[0]}` : ''}`

  const href = `${docHref}${hrefFromProps}`

  const isActive =
    (href === docHref && pathname === docHref) || (href !== docHref && pathname.startsWith(href))

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
