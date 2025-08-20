'use client'
import type { SanitizedConfig } from 'payload'

import { Button } from '@payloadcms/ui'
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

  if (isCollection) {
    if (segmentThree === 'trash' && segmentFour) {
      docPath += `/trash/${segmentFour}`
    } else if (segmentThree) {
      docPath += `/${segmentThree}`
    }
  }

  const href = `${docPath}${hrefFromProps}`
  // separated the two so it doesn't break checks against pathname
  const hrefWithLocale = `${href}${locale ? `?locale=${locale}` : ''}`

  const isActive =
    (href === docPath && pathname === docPath) ||
    (href !== docPath && pathname.startsWith(href)) ||
    isActiveFromProps

  return (
    <Button
      aria-label={ariaLabel}
      buttonStyle="tab"
      className={[baseClass, isActive && `${baseClass}--active`].filter(Boolean).join(' ')}
      disabled={isActive}
      el={!isActive || href !== pathname ? 'link' : 'div'}
      margin={false}
      newTab={newTab}
      size="medium"
      to={!isActive || href !== pathname ? hrefWithLocale : undefined}
    >
      {children}
    </Button>
  )
}
