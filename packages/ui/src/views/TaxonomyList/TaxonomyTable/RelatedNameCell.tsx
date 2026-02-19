'use client'

import { formatAdminURL, getBestFitFromSizes, isImage } from 'payload/shared'
import React from 'react'

import type { SlotColumn } from './SlotTable.js'
import type { TableRow } from './types.js'

import { Link } from '../../../elements/Link/index.js'
import { Locked } from '../../../elements/Locked/index.js'
import { Thumbnail } from '../../../elements/Thumbnail/index.js'
import { DocumentIcon } from '../../../icons/Document/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useDocumentSelection } from '../../../providers/DocumentSelection/index.js'
import { baseClass } from './types.js'

type RelatedDocIconProps = {
  collectionSlug: string
  row: TableRow
}

const RelatedDocIcon = ({ collectionSlug, row }: RelatedDocIconProps) => {
  const { getEntityConfig } = useConfig()

  const config = getEntityConfig({ collectionSlug })
  const isUploadCollection = Boolean(config?.upload)
  const previewAllowed = config?.upload?.displayPreview ?? true

  if (!isUploadCollection || !previewAllowed) {
    return <DocumentIcon />
  }

  const mimeType = row.mimeType as string | undefined
  const isFileImage = mimeType ? isImage(mimeType) : false

  let thumbnailSrc: string | undefined = isFileImage
    ? (row.thumbnailURL as string) || (row.url as string)
    : (row.thumbnailURL as string)

  if (isFileImage) {
    thumbnailSrc = getBestFitFromSizes({
      sizes: row.sizes as Record<string, { url?: string; width?: number }>,
      thumbnailURL: row.thumbnailURL as string,
      url: row.url as string,
      width: row.width as number,
    })
  }

  return (
    <Thumbnail
      className={`${baseClass}__thumbnail`}
      collectionSlug={config?.slug}
      doc={row}
      fileSrc={thumbnailSrc}
      imageCacheTag={config?.upload?.cacheTags ? (row.updatedAt as string) : undefined}
      size="small"
      uploadConfig={config?.upload}
    />
  )
}

export const RelatedNameCell: SlotColumn<TableRow>['Cell'] = ({ row }) => {
  const { getEntityConfig } = useConfig()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const { isLocked } = useDocumentSelection()

  const config = getEntityConfig({ collectionSlug: row._collectionSlug })
  const titleField = config?.admin?.useAsTitle || 'id'
  const rawTitle =
    typeof row[titleField] === 'string' || typeof row[titleField] === 'number'
      ? row[titleField]
      : row.id
  const title = typeof rawTitle === 'object' ? JSON.stringify(rawTitle) : String(rawTitle)

  const locked = isLocked({ id: row.id, collectionSlug: row._collectionSlug })

  if (locked && row._userEditing) {
    return (
      <span className={`${baseClass}__name-link ${baseClass}__name-link--locked`}>
        <Locked user={row._userEditing} />
        <RelatedDocIcon collectionSlug={row._collectionSlug} row={row} />
        <span className={`${baseClass}__name-text`}>{title}</span>
      </span>
    )
  }

  const editUrl = formatAdminURL({
    adminRoute,
    path: `/collections/${row._collectionSlug}/${row.id}`,
  })

  return (
    <Link className={`${baseClass}__name-link`} href={editUrl}>
      <RelatedDocIcon collectionSlug={row._collectionSlug} row={row} />
      <span className={`${baseClass}__name-text`}>{title}</span>
    </Link>
  )
}
