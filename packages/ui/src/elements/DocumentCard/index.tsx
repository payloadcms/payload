'use client'

import React from 'react'

import { Link } from '../Link/index.js'
import './index.css'

const baseClass = 'document-card'

export type DocumentCardThumbnail = { alt?: string; src: string }
export type DocumentCardProps = {
  readonly children?: React.ReactNode
  readonly href: string
  readonly isSelected?: boolean
  readonly thumbnail?: DocumentCardThumbnail
  readonly title: string
}

/** Shared document-card presentation. Navigation and selection state remain controlled by callers. */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  children,
  href,
  isSelected = false,
  thumbnail,
  title,
}) => (
  <article
    aria-current={isSelected ? 'true' : undefined}
    className={[baseClass, isSelected && `${baseClass}--selected`].filter(Boolean).join(' ')}
  >
    {thumbnail ? (
      <img alt={thumbnail.alt || ''} className={`${baseClass}__thumbnail`} src={thumbnail.src} />
    ) : (
      <div className={`${baseClass}__thumbnail ${baseClass}__thumbnail--empty`} />
    )}
    <div className={`${baseClass}__content`}>
      <Link className={`${baseClass}__link`} href={href}>
        <span className={`${baseClass}__title`}>{title}</span>
      </Link>
      {children ? <div className={`${baseClass}__metadata`}>{children}</div> : null}
    </div>
  </article>
)
