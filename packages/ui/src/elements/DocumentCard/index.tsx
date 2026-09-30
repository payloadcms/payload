'use client'

import React from 'react'

import { useRouter } from '../../providers/RouterAdapter/index.js'
import { Link } from '../Link/index.js'
import './index.css'

const baseClass = 'document-card'

export type DocumentCardThumbnail = { alt?: string; src: string }
export type DocumentCardProps = {
  readonly children?: React.ReactNode
  readonly href: string
  readonly isSelected?: boolean
  readonly onSelect?: () => void
  readonly thumbnail?: DocumentCardThumbnail
  readonly title: string
}

/** Shared document-card presentation. Navigation and selection state remain controlled by callers. */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  children,
  href,
  isSelected = false,
  onSelect,
  thumbnail,
  title,
}) => {
  const router = useRouter()
  const selectionStatusID = React.useId()

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onSelect || event.detail === 0) {
      return
    }

    event.preventDefault()
    onSelect()
  }

  const handleDoubleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onSelect) {
      return
    }

    event.preventDefault()
    void router.push(href)
  }

  return (
    <article
      className={[baseClass, isSelected && `${baseClass}--selected`].filter(Boolean).join(' ')}
    >
      <Link
        aria-describedby={isSelected ? selectionStatusID : undefined}
        className={`${baseClass}__link`}
        href={href}
        onClick={onSelect ? handleClick : undefined}
        onDoubleClick={onSelect ? handleDoubleClick : undefined}
      >
        {thumbnail ? (
          <img
            alt={thumbnail.alt || ''}
            className={`${baseClass}__thumbnail`}
            src={thumbnail.src}
          />
        ) : (
          <div className={`${baseClass}__thumbnail ${baseClass}__thumbnail--empty`} />
        )}
        <div className={`${baseClass}__content`}>
          <span className={`${baseClass}__title`}>{title}</span>
          {children ? <div className={`${baseClass}__metadata`}>{children}</div> : null}
        </div>
      </Link>
      {onSelect ? (
        <span className="document-card__selection-status sr-only" id={selectionStatusID}>
          {isSelected ? 'Selected' : 'Not selected'}
        </span>
      ) : null}
    </article>
  )
}
