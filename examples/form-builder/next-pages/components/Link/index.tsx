import Link from 'next/link'
import React from 'react'
import { Page } from '../../payload-types'
import { Button } from '../Button'

type CMSLinkType = {
  type?: 'custom' | 'reference'
  url?: string
  newTab?: boolean
  reference?: {
    value: string | Page
    relationTo: 'pages'
  }
  label?: string
  appearance?: 'default' | 'primary' | 'secondary'
  children?: React.ReactNode
  className?: string
}

export const CMSLink = ({
  type,
  url,
  newTab,
  reference,
  label,
  appearance,
  children,
  className,
}: CMSLinkType) => {
  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `/${reference.value.slug}`
      : url

  if (!appearance) {
    const newTabProps = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

    if (type === 'custom') {
      return (
        <Link href={url} {...newTabProps} className={className}>
          {label && label}
          {children && children}
        </Link>
      )
    }

    if (href) {
      return (
        <Link href={href} {...newTabProps} className={className}>
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
