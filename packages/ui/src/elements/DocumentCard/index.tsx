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
  readonly placeholder?: React.ReactNode
  readonly thumbnail?: DocumentCardThumbnail
  readonly title: string
}

/** Shared document-card presentation. Navigation and selection state remain controlled by callers. */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  children,
  href,
  isSelected = false,
  onSelect,
  placeholder,
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

  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a')) {
      return
    }

    onSelect?.()
  }

  const handleCardDoubleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!onSelect || (event.target as HTMLElement).closest('a')) {
      return
    }

    event.preventDefault()
    void router.push(href)
  }

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (
      !onSelect ||
      (event.target as HTMLElement).closest('a') ||
      (event.key !== 'Enter' && event.key !== ' ')
    ) {
      return
    }

    event.preventDefault()
    onSelect()
  }

  const cardInteractionProps: React.HTMLAttributes<HTMLDivElement> = onSelect
    ? {
        'aria-describedby': selectionStatusID,
        'aria-label': title,
        'aria-pressed': isSelected,
        onClick: handleCardClick,
        onDoubleClick: handleCardDoubleClick,
        onKeyDown: handleCardKeyDown,
        role: 'button',
        tabIndex: 0,
      }
    : {}

  return (
    <div
      {...cardInteractionProps}
      className={[
        baseClass,
        !onSelect && `${baseClass}--link`,
        isSelected && `${baseClass}--selected`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {thumbnail ? (
        <img alt={thumbnail.alt || ''} className={`${baseClass}__thumbnail`} src={thumbnail.src} />
      ) : (
        <div
          aria-hidden="true"
          className={`${baseClass}__thumbnail ${baseClass}__thumbnail--empty`}
        >
          {placeholder}
        </div>
      )}
      <div className={`${baseClass}__content`}>
        <Link
          className={`${baseClass}__title`}
          href={href}
          onClick={onSelect ? handleClick : undefined}
          onDoubleClick={onSelect ? handleDoubleClick : undefined}
        >
          {title}
        </Link>
        {children ? <div className={`${baseClass}__metadata`}>{children}</div> : null}
      </div>
      {onSelect ? (
        <span className="document-card__selection-status sr-only" id={selectionStatusID}>
          {isSelected ? 'Selected.' : 'Not selected.'} Press Enter or Space to change selection.
        </span>
      ) : null}
    </div>
  )
}
