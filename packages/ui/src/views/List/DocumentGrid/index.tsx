'use client'

import type { ViewTypes } from 'payload'

import React from 'react'

import { CardGrid } from '../../../elements/CardGrid/index.js'
import { DocumentCard } from '../../../elements/DocumentCard/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { useSelection } from '../../../providers/Selection/index.js'
import { getDocumentThumbnail } from '../../../utilities/getDocumentThumbnail.js'
import { getDocumentListItemURL } from '../getDocumentListItemURL.js'

type DocumentGridProps = {
  readonly adminRoute: string
  readonly collectionLabel: string
  readonly collectionSlug: string
  readonly docs: Record<string, unknown>[]
  readonly documentURLs?: Record<string, null | string>
  readonly enableRowSelections?: boolean
  readonly hierarchyParentFieldName?: string
  readonly useAsThumbnail?: string
  readonly useAsTitle?: string
  readonly viewType?: ViewTypes
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

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  adminRoute,
  collectionLabel,
  collectionSlug,
  docs,
  documentURLs,
  enableRowSelections = true,
  hierarchyParentFieldName,
  useAsThumbnail,
  useAsTitle,
  viewType,
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
        const thumbnailSrc = getDocumentThumbnail({ doc, useAsThumbnail })
        const title = getDocumentTitle({ doc, useAsTitle })

        return (
          <DocumentCard
            href={
              documentURLs && documentID in documentURLs
                ? documentURLs[documentID]
                : getDocumentListItemURL({
                    adminRoute,
                    collectionSlug,
                    documentID,
                    hierarchyParentFieldName,
                    viewType,
                  })
            }
            isSelected={
              (typeof id === 'string' || typeof id === 'number') && Boolean(selected.get(id))
            }
            onSelect={
              enableRowSelections && (typeof id === 'string' || typeof id === 'number')
                ? () => setSelection(id)
                : undefined
            }
            placeholder={<DocumentIcon />}
            thumbnail={thumbnailSrc ? { alt: title, src: thumbnailSrc } : undefined}
            title={title}
          />
        )
      }}
    />
  )
}
