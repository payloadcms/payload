'use client'

import { formatAdminURL, getBestFitFromSizes, isImage } from 'payload/shared'
import React from 'react'

import { CardGrid } from '../../../elements/CardGrid/index.js'
import { DocumentCard } from '../../../elements/DocumentCard/index.js'
import { useSelection } from '../../../providers/Selection/index.js'

type DocumentGridProps = {
  readonly adminRoute: string
  readonly collectionLabel: string
  readonly collectionSlug: string
  readonly docs: Record<string, unknown>[]
  readonly useAsThumbnail?: string
  readonly useAsTitle?: string
}

const getDocumentID = (doc: Record<string, unknown>): string => {
  const id = doc.id

  return typeof id === 'string' || typeof id === 'number' ? String(id) : ''
}

const getDocumentTitle = ({
  doc,
  useAsTitle,
}: {
  doc: Record<string, unknown>
  useAsTitle?: string
}) => {
  const value = useAsTitle ? doc[useAsTitle] : undefined

  return typeof value === 'string' || typeof value === 'number' ? String(value) : getDocumentID(doc)
}

const getThumbnailDoc = ({
  doc,
  useAsThumbnail,
}: {
  doc: Record<string, unknown>
  useAsThumbnail?: string
}) => {
  const thumbnailValue = useAsThumbnail ? doc[useAsThumbnail] : undefined

  if (Array.isArray(thumbnailValue)) {
    return thumbnailValue[0] && typeof thumbnailValue[0] === 'object'
      ? (thumbnailValue[0] as Record<string, unknown>)
      : undefined
  }

  if (thumbnailValue && typeof thumbnailValue === 'object') {
    return thumbnailValue as Record<string, unknown>
  }

  return doc
}

const getThumbnail = ({
  doc,
  useAsThumbnail,
}: {
  doc: Record<string, unknown>
  useAsThumbnail?: string
}) => {
  const thumbnailDoc = getThumbnailDoc({ doc, useAsThumbnail })
  const mimeType = typeof thumbnailDoc.mimeType === 'string' ? thumbnailDoc.mimeType : undefined

  if (mimeType && isImage(mimeType)) {
    return getBestFitFromSizes({
      sizes: thumbnailDoc.sizes as Record<string, { url?: string; width?: number }>,
      thumbnailURL: thumbnailDoc.thumbnailURL as string,
      url: thumbnailDoc.url as string,
      width: thumbnailDoc.width as number,
    })
  }

  return typeof thumbnailDoc.thumbnailURL === 'string' ? thumbnailDoc.thumbnailURL : undefined
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  adminRoute,
  collectionLabel,
  collectionSlug,
  docs,
  useAsThumbnail,
  useAsTitle,
}) => {
  const { selected, setSelection } = useSelection()

  return (
    <CardGrid
      ariaLabel={collectionLabel}
      getItemClassName={(doc) => {
        const id = doc.id

        return (typeof id === 'string' || typeof id === 'number') && selected.get(id)
          ? 'card-grid__item--selected'
          : undefined
      }}
      getKey={getDocumentID}
      items={docs}
      renderItem={(doc) => {
        const id = doc.id
        const documentID = getDocumentID(doc)
        const thumbnailSrc = getThumbnail({ doc, useAsThumbnail })
        const title = getDocumentTitle({ doc, useAsTitle })

        return (
          <DocumentCard
            href={formatAdminURL({
              adminRoute,
              path: `/collections/${collectionSlug}/${encodeURIComponent(documentID)}`,
            })}
            isSelected={
              (typeof id === 'string' || typeof id === 'number') && Boolean(selected.get(id))
            }
            onSelect={
              typeof id === 'string' || typeof id === 'number' ? () => setSelection(id) : undefined
            }
            thumbnail={thumbnailSrc ? { alt: title, src: thumbnailSrc } : undefined}
            title={title}
          />
        )
      }}
    />
  )
}
