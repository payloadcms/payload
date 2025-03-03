'use client'
import type { SanitizedConfig } from 'payload'

import { Link } from '@payloadcms/ui'
import { useParams, usePathname, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

export const DocumentTabLink: React.FC<{
  adminRoute: SanitizedConfig['routes']['admin']
  ariaLabel?: string
  baseClass: string
  children?: React.ReactNode
  href: string
  isActive?: boolean
  isCollection?: boolean
  newTab?: boolean
}> = ({
  adminRoute,
  ariaLabel,
  baseClass,
  children,
  href: hrefFromProps,
  isActive: isActiveFromProps,
  newTab,
}) => {
  const pathname = usePathname()
  const params = useParams()

  const searchParams = useSearchParams()

  const locale = searchParams.get('locale')

  const [entityType, entitySlug, segmentThree, segmentFour, ...rest] = params.segments || []
  const isCollection = entityType === 'collections'

  let docPath = formatAdminURL({
    adminRoute,
    path: `/${isCollection ? 'collections' : 'globals'}/${entitySlug}`,
  })

  if (isCollection && segmentThree) {
    // doc ID
    docPath += `/${segmentThree}`
  }

  const href = `${docPath}${hrefFromProps}`
  // separated the two so it doesn't break checks against pathname
  const hrefWithLocale = `${href}${locale ? `?locale=${locale}` : ''}`

  const isActive =
    (href === docPath && pathname === docPath) ||
    (href !== docPath && pathname.startsWith(href)) ||
    isActiveFromProps

  return (
    <li
      aria-label={ariaLabel}
      className={[baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(' ')}
    >
      <Link
        className={`${baseClass}__link`}
        href={!isActive || href !== pathname ? hrefWithLocale : ''}
        prefetch={false}
        {...(newTab && { rel: 'noopener noreferrer', target: '_blank' })}
        tabIndex={isActive ? -1 : 0}
      >
        {children}
      </Link>
    </li>
  )
}
