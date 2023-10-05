import React from 'react'
import Link from 'next/link'

import { Page } from '../../../payload-types'

type CMSLinkType = {
  type?: 'custom' | 'reference'
  url?: string
  newTab?: boolean
  reference?: {
    value: string | Page
    relationTo: 'pages'
  }
  label?: string
  children?: React.ReactNode
  className?: string
}

export const CMSLink: React.FC<CMSLinkType> = ({
  type,
  url,
  newTab,
  reference,
  label,
  children,
  className,
}) => {
  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `/${reference.value.slug}`
      : url

  if (!href && !url) return null

  const newTabProps = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  if (href || url) {
    return (
      <Link {...newTabProps} href={href || url || ''} className={className}>
        {label && label}
        {children && children}
      </Link>
    )
  }
}
