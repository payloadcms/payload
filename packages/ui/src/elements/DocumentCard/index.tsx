'use client'

import React from 'react'

import { useVideoFrame } from '../../hooks/useVideoFrame.js'
import { useVideoPreviewPlayback } from '../../hooks/useVideoPreviewPlayback.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Link } from '../Link/index.js'
import { RenderIfInViewport } from '../RenderIfInViewport/index.js'
import './index.css'

const baseClass = 'document-card'

export type DocumentCardThumbnail = {
  alt?: string
  /** Render `src` as an early video frame instead of an image. */
  isVideo?: boolean
  /** Use `lazy` for cards that may be hidden on load, so their image is only downloaded once shown. */
  loading?: 'eager' | 'lazy'
  src: string
}
export type DocumentCardProps = {
  readonly children?: React.ReactNode
  readonly href?: null | string
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
  const { t } = useTranslation()
  const selectionStatusID = React.useId()
  const { isVideoPreviewActive, videoPreviewTriggerProps } = useVideoPreviewTrigger()

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onSelect || event.detail === 0) {
      return
    }

    event.preventDefault()
    onSelect()
  }

  const handleDoubleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onSelect || !href) {
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
    if (!onSelect || !href || (event.target as HTMLElement).closest('a')) {
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
      {...(thumbnail?.isVideo ? videoPreviewTriggerProps : {})}
      className={[
        baseClass,
        !onSelect && href && `${baseClass}--link`,
        isSelected && `${baseClass}--selected`,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <CardThumbnail
        isVideoPreviewActive={isVideoPreviewActive}
        placeholder={placeholder}
        thumbnail={thumbnail}
      />
      <div className={`${baseClass}__content`}>
        {href ? (
          <Link
            className={`${baseClass}__title`}
            href={href}
            onClick={onSelect ? handleClick : undefined}
            onDoubleClick={onSelect ? handleDoubleClick : undefined}
          >
            {title}
          </Link>
        ) : (
          <span className={`${baseClass}__title`}>{title}</span>
        )}
        {children ? <div className={`${baseClass}__metadata`}>{children}</div> : null}
      </div>
      {onSelect ? (
        <span className="document-card__selection-status sr-only" id={selectionStatusID}>
          {t(isSelected ? 'general:selectedDocument' : 'general:notSelectedDocument')}
        </span>
      ) : null}
    </div>
  )
}

/** Mouse hover and visible keyboard focus play a video thumbnail. A touch only selects or opens the card. */
function useVideoPreviewTrigger() {
  const [isHovered, setIsHovered] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)

  const videoPreviewTriggerProps: React.HTMLAttributes<HTMLDivElement> = {
    onBlur: (event) => {
      const isFocusInCard =
        event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)

      if (!isFocusInCard) {
        setIsFocused(false)
      }
    },
    onFocus: (event) => {
      if (event.target instanceof Element && event.target.matches(':focus-visible')) {
        setIsFocused(true)
      }
    },
    onPointerEnter: (event) => {
      if (event.pointerType === 'mouse') {
        setIsHovered(true)
      }
    },
    onPointerLeave: () => setIsHovered(false),
  }

  return { isVideoPreviewActive: isHovered || isFocused, videoPreviewTriggerProps }
}

function CardThumbnail({
  isVideoPreviewActive,
  placeholder,
  thumbnail,
}: { isVideoPreviewActive: boolean } & Pick<DocumentCardProps, 'placeholder' | 'thumbnail'>) {
  if (thumbnail?.isVideo) {
    // Videos have no native lazy loading, so every video card waits until it is near the viewport
    return (
      <RenderIfInViewport className={`${baseClass}__thumbnail ${baseClass}__thumbnail--video`}>
        <CardVideoThumbnail
          alt={thumbnail.alt}
          isPreviewActive={isVideoPreviewActive}
          key={thumbnail.src}
          placeholder={placeholder}
          src={thumbnail.src}
        />
      </RenderIfInViewport>
    )
  }

  if (thumbnail) {
    return (
      <img
        alt={thumbnail.alt || ''}
        className={`${baseClass}__thumbnail`}
        decoding="async"
        loading={thumbnail.loading}
        src={thumbnail.src}
      />
    )
  }

  return (
    <div aria-hidden="true" className={`${baseClass}__thumbnail ${baseClass}__thumbnail--empty`}>
      {placeholder}
    </div>
  )
}

function CardVideoThumbnail({
  alt,
  isPreviewActive,
  placeholder,
  src,
}: { isPreviewActive: boolean } & Pick<DocumentCardProps, 'placeholder'> &
  Pick<DocumentCardThumbnail, 'alt' | 'src'>) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const { shouldRenderVideo, shouldShowFallback, videoProps } = useVideoFrame({ src })

  useVideoPreviewPlayback({ isActive: isPreviewActive, videoRef })

  return (
    <>
      {shouldRenderVideo && (
        <video {...videoProps} aria-label={alt || undefined} loop muted ref={videoRef} />
      )}
      {shouldShowFallback && (
        <div aria-hidden="true" className={`${baseClass}__thumbnail--empty`}>
          {placeholder}
        </div>
      )}
    </>
  )
}
