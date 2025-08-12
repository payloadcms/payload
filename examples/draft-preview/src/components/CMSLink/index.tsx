import Link from 'next/link'
import React from 'react'

import type { Page } from '@payload-types'

import { Button } from '../Button'

export type CMSLinkType = {
  appearance?: 'default' | 'primary' | 'secondary'
  children?: React.ReactNode
  className?: string
  label?: string
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages'
    value: number | Page | string
  } | null
  type?: 'custom' | 'reference' | null
  url?: null | string
}

export const CMSLink: React.FC<CMSLinkType> = ({
  type,
  appearance,
  children,
  className,
  label,
  newTab,
  reference,
  url,
}) => {
  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `${reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''}/${
          reference.value.slug
        }`
      : url

  if (!href) {
    return null
  }

  if (!appearance) {
    const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

    if (type === 'custom') {
      return (
        <a href={url || ''} {...newTabProps} className={className}>
          {label && label}
          {children ? <>{children}</> : null}
        </a>
      )
    }

    if (href) {
      return (
        <Link href={href} {...newTabProps} className={className} prefetch={false}>
          {label && label}
          {children ? <>{children}</> : null}
        </Link>
      )
    }
  }

  const buttonProps = {
    appearance,
    href,
    label,
    newTab,
  }

  return <Button className={className} {...buttonProps} el="link" />
}
