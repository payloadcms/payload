'use client'

import type { User } from 'payload'

import { getBestFitFromSizes, isImage } from 'payload/shared'
import React, { useMemo } from 'react'

import { Link } from '../../../../elements/Link/index.js'
import { Locked } from '../../../../elements/Locked/index.js'
import { Thumbnail } from '../../../../elements/Thumbnail/index.js'
import { CheckboxInput } from '../../../../fields/Checkbox/Input.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { formatRelativeDate } from '../../../../utilities/formatRelativeDate.js'
import './index.css'

const baseClass = 'hierarchy-document-card'

/**
 * Mirrors the labels and modifier classes of the table `StatusCell` so cards and rows read the
 * same. Unknown statuses fall back to the raw value with the neutral `draft` treatment.
 */
const statusLabels: Record<string, string> = {
  changed: 'Changed',
  draft: 'Draft',
  previouslyPublished: 'Previously Published',
  published: 'Published',
}

const statusModifiers: Record<string, string> = {
  changed: 'changed',
  draft: 'draft',
  previouslyPublished: 'previously-published',
  published: 'published',
}

export type DocumentCardProps = {
  children?: React.ReactNode
  collectionSlug: string
  doc: Record<string, unknown>
  href: string
  isSelected?: boolean
  /**
   * The user currently editing this document. When set, a lock indicator replaces the checkbox.
   */
  lockedUser?: User
  onSelectionChange?: () => void
  showType?: boolean
  typeLabel?: string
  updatedAt?: string
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  children,
  collectionSlug,
  doc,
  href,
  isSelected = false,
  lockedUser,
  onSelectionChange,
  showType = false,
  typeLabel,
  updatedAt,
}) => {
  const { getEntityConfig } = useConfig()
  const { i18n } = useTranslation()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const uploadConfig = collectionConfig?.upload
  const isPreviewAllowed = uploadConfig?.displayPreview ?? true
  const hasFile = typeof doc.filename === 'string' && doc.filename.length > 0
  const hasThumbnail = Boolean(uploadConfig) && isPreviewAllowed && hasFile

  const title = getDocTitle({ doc, titleField: collectionConfig?.admin?.useAsTitle || 'id' })
  const status = getDocStatus({ doc })
  const isSelectable = typeof onSelectionChange === 'function'
  const hasTypePill = showType && Boolean(typeLabel)

  // Creating the formatter is expensive, so build one per language rather than one per render.
  const relativeTimeFormat = useMemo(
    () => getLongRelativeTimeFormat(i18n.language),
    [i18n.language],
  )

  const updatedLabel = useMemo(
    () => (updatedAt ? formatRelativeDate({ relativeTimeFormat, value: updatedAt }) : undefined),
    [relativeTimeFormat, updatedAt],
  )

  const handleToggle = () => {
    onSelectionChange?.()
  }

  return (
    <div
      className={[
        baseClass,
        hasThumbnail ? `${baseClass}--has-thumbnail` : `${baseClass}--no-thumbnail`,
        // The corner slot holds either the checkbox or the lock indicator, and content below it
        // must reserve space for whichever is present.
        (isSelectable || lockedUser) && `${baseClass}--has-corner-slot`,
        isSelected && `${baseClass}--selected`,
      ]
        .filter(Boolean)
        .join(' ')}
      data-selected={isSelected ? 'true' : undefined}
    >
      {hasThumbnail && (
        <div className={`${baseClass}__thumbnail-wrap`}>
          <Thumbnail
            className={`${baseClass}__thumbnail`}
            collectionSlug={collectionConfig?.slug}
            doc={doc}
            fileSrc={getThumbnailSrc({ doc })}
            imageCacheTag={uploadConfig?.cacheTags ? (doc.updatedAt as string) : undefined}
            size="expand"
            uploadConfig={uploadConfig}
          />
          {hasTypePill && <span className={`${baseClass}__type`}>{typeLabel}</span>}
        </div>
      )}

      <div className={`${baseClass}__content`}>
        {hasTypePill && !hasThumbnail && (
          <span className={`${baseClass}__type ${baseClass}__type--inline`}>{typeLabel}</span>
        )}

        {/* The link is a sibling of the checkbox and stretches over the whole card via ::after */}
        <Link className={`${baseClass}__link`} href={href}>
          <span className={`${baseClass}__title`} title={title}>
            {title}
          </span>
        </Link>

        <div className={`${baseClass}__properties`}>
          {updatedLabel && (
            <div className={`${baseClass}__property`}>
              <span className={`${baseClass}__property-label`}>Updated</span>
              <time className={`${baseClass}__property-value`} dateTime={updatedAt}>
                {updatedLabel}
              </time>
            </div>
          )}

          {status && (
            <div className={`${baseClass}__property`}>
              <span className={`${baseClass}__property-label`}>Status</span>
              <span
                className={`${baseClass}__status ${baseClass}__status--${statusModifiers[status] || 'draft'}`}
              >
                {statusLabels[status] || status}
              </span>
            </div>
          )}

          {children ? <div className={`${baseClass}__extra`}>{children}</div> : null}
        </div>
      </div>

      {lockedUser ? (
        <div className={`${baseClass}__checkbox`}>
          <Locked user={lockedUser} />
        </div>
      ) : (
        isSelectable && (
          <CheckboxInput
            aria-label={`Select ${title}`}
            checked={isSelected}
            className={`${baseClass}__checkbox`}
            onToggle={handleToggle}
            variant="muted"
          />
        )
      )}

      {/*
        Without a checkbox there is no other non-visual signal that the card is selected. Suppressed
        when locked, so this never contradicts the lock indicator's own announcement.
      */}
      {isSelected && !isSelectable && !lockedUser && <span className="sr-only">Selected</span>}
    </div>
  )
}

/**
 * Cards spell the unit out ("2 days ago") per the design, whereas the shared
 * `getRelativeTimeFormat` helper is deliberately `narrow` ("2d ago") for the dense dashboard
 * widgets. Falls back to English on locales Intl does not recognise.
 */
function getLongRelativeTimeFormat(language: string): Intl.RelativeTimeFormat {
  try {
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto', style: 'long' })
  } catch {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'long' })
  }
}

function getDocTitle({
  doc,
  titleField,
}: {
  doc: Record<string, unknown>
  titleField: string
}): string {
  const rawTitle = doc[titleField]

  if (typeof rawTitle === 'string' || typeof rawTitle === 'number') {
    return String(rawTitle)
  }

  const { id } = doc

  if (typeof id === 'string' || typeof id === 'number') {
    return String(id)
  }

  return ''
}

/**
 * Prefers `_displayStatus` because the list view enriches docs with it to surface `changed`,
 * falling back to the persisted `_status`.
 */
function getDocStatus({ doc }: { doc: Record<string, unknown> }): string | undefined {
  const rawStatus = doc._displayStatus ?? doc._status

  return typeof rawStatus === 'string' && rawStatus.length > 0 ? rawStatus : undefined
}

/**
 * Matches the upload thumbnail derivation used by the hierarchy table cells: images resolve to the
 * best fit from the generated sizes, everything else falls back to the configured thumbnail URL.
 */
function getThumbnailSrc({ doc }: { doc: Record<string, unknown> }): string | undefined {
  const mimeType = doc.mimeType as string | undefined
  const isFileImage = mimeType ? isImage(mimeType) : false

  if (!isFileImage) {
    return doc.thumbnailURL as string
  }

  return getBestFitFromSizes({
    sizes: doc.sizes as Record<string, { url?: string; width?: number }>,
    thumbnailURL: doc.thumbnailURL as string,
    url: doc.url as string,
    width: doc.width as number,
  })
}
