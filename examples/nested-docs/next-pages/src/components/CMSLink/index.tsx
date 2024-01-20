import React from 'react'
import Link from 'next/link'

import { Page } from '../../payload-types'
import { Button } from '../Button'

export type CMSLinkType = {
  type?: 'custom' | 'reference' | null
  url?: string | null
  newTab?: boolean | null
  reference?: {
    value: string | Page
    relationTo: 'pages'
  } | null
  label?: string
  appearance?: 'default' | 'primary' | 'secondary'
  children?: React.ReactNode
  className?: string
}

export const CMSLink: React.FC<CMSLinkType> = ({
  type,
  url,
  newTab,
  reference,
  label,
  appearance,
  children,
  className,
}) => {
  let href = url

  if (type === 'reference' && reference && reference.value && typeof reference.value === 'object') {
    if ('breadcrumbs' in reference.value) {
      href = reference.value.breadcrumbs?.[reference.value.breadcrumbs.length - 1]?.url || ''
    } else {
      href = `/${reference.value.slug === 'home' ? '' : reference.value.slug}`
    }
  }

  if (!appearance) {
    const newTabProps = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

    if (type === 'custom') {
      return (
        <a href={url || ''} {...newTabProps} className={className}>
          {label && label}
          {children && children}
        </a>
      )
    }

    if (href) {
      return (
        <Link href={href} {...newTabProps} className={className} prefetch={false}>
          {label && label}
          {children && children}
        </Link>
      )
    }
  }

  const buttonProps = {
    newTab,
    href,
    appearance,
    label,
  }

  return <Button className={className} {...buttonProps} el="link" />
}
