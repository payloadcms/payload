import { Button, type ButtonProps } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '../../../payload-types'

type CMSLinkType = {
  appearance?: ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string
  newTab?: boolean
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string
  }
  size?: ButtonProps['size']
  type?: 'custom' | 'reference'
  url?: string
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'link',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `${reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''}/${
          reference.value.slug
        }`
      : url

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={className} href={href || url} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
